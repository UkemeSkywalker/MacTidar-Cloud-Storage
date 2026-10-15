import "server-only";
import { InvokeCommand } from "@aws-sdk/client-lambda";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { formatBytes } from "@/lib/format";
import { aws } from "./aws";
import { config } from "./config";
import { listSubtree, type Item } from "./db/items";
import { ddb, epochSeconds, now, TABLE } from "./db/table";
import { badRequest, forbidden, HttpError, notFound } from "./errors";
import { newId } from "./ids";
import { presignGet } from "./storage";

const MAX_ZIP_BYTES = 10 * 1024 ** 3;

type ZipJob = {
  jobId: string;
  folderId: string;
  folderName: string;
  requester: string; // user id, or "link:<token>"
  key: string;
  status: "PENDING" | "RUNNING" | "READY" | "FAILED";
  totalBytes: number;
  files?: number;
  error?: string;
};

const jobKey = (jobId: string) => ({ PK: `ZIP#${jobId}`, SK: "META" });

// Starts building a zip of `folder` in the background (see infra/modules/workers/zip).
export async function startZip(folder: Item, requester: string) {
  if (folder.type !== "folder") throw badRequest("Only folders can be downloaded as a zip.");
  const contents = (await listSubtree(folder.rootId, folder.path)).filter((i) => i.status === "ACTIVE" && i.type === "file");
  if (!contents.length) throw badRequest("This folder has no files to download.");
  const totalBytes = contents.reduce((a, i) => a + (i.size ?? 0), 0);
  if (totalBytes > MAX_ZIP_BYTES) {
    throw new HttpError(413, `This folder is ${formatBytes(totalBytes)}. Zips are limited to ${formatBytes(MAX_ZIP_BYTES, 0)} — download sub-folders instead.`);
  }
  const jobId = newId();
  const job: ZipJob = {
    jobId,
    folderId: folder.id,
    folderName: folder.parentId ? folder.name : "My Files",
    requester,
    key: `tmp/zips/${jobId}.zip`,
    status: "PENDING",
    totalBytes,
  };
  await ddb().send(
    new PutCommand({
      TableName: TABLE(),
      // Zips expire with the bucket's tmp/ lifecycle rule (1 day).
      Item: { ...jobKey(jobId), ...job, createdAt: now(), expiresAt: epochSeconds(new Date(Date.now() + 86400_000)) },
    }),
  );
  await aws().lambda.send(
    new InvokeCommand({ FunctionName: config().ZIP_FUNCTION, InvocationType: "Event", Payload: Buffer.from(JSON.stringify({ jobId })) }),
  );
  return { jobId, files: contents.length, totalBytes };
}

export async function zipStatus(jobId: string, requester: string) {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: jobKey(jobId) }));
  const job = res.Item as ZipJob | undefined;
  if (!job) throw notFound("This download has expired. Start it again.");
  if (job.requester !== requester) throw forbidden();
  return {
    status: job.status,
    error: job.error,
    totalBytes: job.totalBytes,
    url: job.status === "READY" ? await presignGet(job.key, `${job.folderName}.zip`, "application/zip", false) : undefined,
  };
}
