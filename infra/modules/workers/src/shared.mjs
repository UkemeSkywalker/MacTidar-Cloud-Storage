// Shared helpers for the scheduled cleanup Lambdas. Mirrors the app's data
// model in src/server (see docs/architecture.md §5).
import { AbortMultipartUploadCommand, DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

export const TABLE = process.env.TABLE_NAME;
export const BUCKET = process.env.FILES_BUCKET;
export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const s3 = new S3Client({});

export async function queryAll(input) {
  const out = [];
  let ExclusiveStartKey;
  do {
    const res = await ddb.send(new QueryCommand({ ...input, ExclusiveStartKey }));
    out.push(...(res.Items ?? []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return out;
}

export async function scanAll(input) {
  const out = [];
  let ExclusiveStartKey;
  do {
    const res = await ddb.send(new ScanCommand({ ...input, ExclusiveStartKey }));
    out.push(...(res.Items ?? []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return out;
}

export async function batchDelete(keys) {
  for (let i = 0; i < keys.length; i += 25) {
    let request = { [TABLE]: keys.slice(i, i + 25).map((Key) => ({ DeleteRequest: { Key } })) };
    while (request && Object.keys(request).length) {
      const res = await ddb.send(new BatchWriteCommand({ RequestItems: request }));
      request = res.UnprocessedItems;
    }
  }
}

export async function deleteObjects(keys) {
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    if (batch.length) await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true } }));
  }
}

export async function abortUpload(key, uploadId) {
  await s3.send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId })).catch(() => {});
}

export async function releaseFree(workspaceId, bytes) {
  if (bytes > 0) {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `WS#${workspaceId}`, SK: "META" },
      UpdateExpression: "SET freeBytes = freeBytes + :b",
      ExpressionAttributeValues: { ":b": bytes },
    }));
  }
}

// Removes permanently deleted bytes from the workspace and uploader totals.
export async function subtractUsed(workspaceId, userId, bytes) {
  if (!bytes) return;
  const ws = { PK: `WS#${workspaceId}`, SK: "META" };
  await ddb.send(new TransactWriteCommand({
    TransactItems: [
      { Update: { TableName: TABLE, Key: ws, UpdateExpression: "SET usedBytes = usedBytes - :b, freeBytes = freeBytes + :b", ExpressionAttributeValues: { ":b": bytes } } },
      { Update: { TableName: TABLE, Key: { PK: `WS#${workspaceId}`, SK: `MEMBER#${userId}` }, UpdateExpression: "SET usedBytes = if_not_exists(usedBytes, :zero) - :b", ConditionExpression: "attribute_exists(PK)", ExpressionAttributeValues: { ":b": bytes, ":zero": 0 } } },
    ],
  })).catch(async () => {
    // Uploader left the workspace: still fix the workspace totals.
    await ddb.send(new UpdateCommand({ TableName: TABLE, Key: ws, UpdateExpression: "SET usedBytes = usedBytes - :b, freeBytes = freeBytes + :b", ExpressionAttributeValues: { ":b": bytes } }));
  });
}

export { DeleteCommand };
