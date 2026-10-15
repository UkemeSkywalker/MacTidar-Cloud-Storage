// Builds a .zip of a folder (and everything inside it) straight from S3 to S3.
// Invoked asynchronously by the app; progress is tracked on the ZIP#<jobId> record.
// Bundled into ../src/zip-folder.mjs by `npm run build:workers`.
import { Readable } from "node:stream";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Upload } from "@aws-sdk/lib-storage";
import yazl from "yazl";

const TABLE = process.env.TABLE_NAME;
const BUCKET = process.env.FILES_BUCKET;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

// Opens the S3 object only when the zip writer reaches this entry, so files
// are streamed one at a time.
class LazyObject extends Readable {
  constructor(key) {
    super();
    this.key = key;
    this.body = null;
  }
  _read() {
    if (this.body) return this.body.resume();
    s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: this.key }))
      .then((res) => {
        this.body = res.Body;
        this.body.on("data", (chunk) => {
          if (!this.push(chunk)) this.body.pause();
        });
        this.body.on("end", () => this.push(null));
        this.body.on("error", (err) => this.destroy(err));
      })
      .catch((err) => this.destroy(err));
  }
}

async function setJob(jobId, fields) {
  const names = {}, values = {};
  const sets = Object.entries(fields).map(([k, v]) => {
    names[`#${k}`] = k;
    values[`:${k}`] = v;
    return `#${k} = :${k}`;
  });
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: `ZIP#${jobId}`, SK: "META" },
    UpdateExpression: `SET ${sets.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

export async function handler({ jobId }) {
  const job = (await ddb.send(new GetCommand({ TableName: TABLE, Key: { PK: `ZIP#${jobId}`, SK: "META" } }))).Item;
  if (!job || job.status !== "PENDING") return;
  await setJob(jobId, { status: "RUNNING" });
  try {
    const folder = (await ddb.send(new GetCommand({ TableName: TABLE, Key: { PK: `ITEM#${job.folderId}`, SK: "META" } }))).Item;
    if (!folder || folder.status !== "ACTIVE") throw new Error("The folder no longer exists.");

    const items = [];
    let ExclusiveStartKey;
    do {
      const res = await ddb.send(new QueryCommand({
        TableName: TABLE,
        IndexName: "GSI3",
        KeyConditionExpression: "GSI3PK = :pk AND begins_with(GSI3SK, :path)",
        ExpressionAttributeValues: { ":pk": `ROOT#${folder.rootId}`, ":path": folder.path },
        ExclusiveStartKey,
      }));
      items.push(...(res.Items ?? []));
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    const active = items.filter((i) => i.status === "ACTIVE");
    const byId = new Map(active.map((i) => [i.id, i]));
    // Path inside the zip, built from folder names below the zipped folder.
    const relPath = (item) => {
      const ids = item.path.split("/").filter(Boolean);
      const start = ids.indexOf(folder.id) + 1;
      const parts = ids.slice(start).map((id) => byId.get(id)?.name);
      return parts.some((p) => p === undefined) ? null : parts.join("/");
    };

    const zip = new yazl.ZipFile();
    const upload = new Upload({
      client: s3,
      params: { Bucket: BUCKET, Key: job.key, Body: zip.outputStream, ContentType: "application/zip" },
      partSize: 16 * 1024 * 1024,
      queueSize: 4,
    });
    let files = 0;
    for (const item of active.sort((a, b) => a.path.localeCompare(b.path))) {
      if (item.id === folder.id) continue;
      const name = relPath(item);
      if (!name) continue; // inside a trashed sub-folder
      if (item.type === "folder") zip.addEmptyDirectory(name, { mtime: new Date(item.updatedAt) });
      else if (item.s3Key) {
        zip.addReadStream(new LazyObject(item.s3Key), name, { mtime: new Date(item.updatedAt), compress: false, size: item.size });
        files++;
      }
    }
    zip.end();
    await upload.done();
    await setJob(jobId, { status: "READY", files, finishedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    await setJob(jobId, { status: "FAILED", error: String(err.message ?? err).slice(0, 300) });
  }
}
