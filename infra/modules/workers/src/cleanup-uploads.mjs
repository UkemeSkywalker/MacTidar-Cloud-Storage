// Hourly: cancel uploads that were started but never finished, and give the
// reserved space back to the team quota.
import { abortUpload, ddb, DeleteCommand, queryAll, releaseFree, TABLE } from "./shared.mjs";

const STALE_HOURS = 24;

export async function handler() {
  const cutoff = new Date(Date.now() - STALE_HOURS * 3600_000).toISOString();
  const stale = await queryAll({
    TableName: TABLE,
    IndexName: "GSI2",
    KeyConditionExpression: "GSI2PK = :pk AND GSI2SK < :cutoff",
    ExpressionAttributeValues: { ":pk": "PENDING", ":cutoff": cutoff },
  });
  let cleaned = 0;
  for (const item of stale) {
    if (item.status !== "UPLOADING") continue;
    if (item.uploadId) await abortUpload(item.s3Key, item.uploadId);
    try {
      await ddb.send(new DeleteCommand({
        TableName: TABLE,
        Key: { PK: item.PK, SK: item.SK },
        ConditionExpression: "#s = :uploading",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":uploading": "UPLOADING" },
      }));
    } catch {
      continue; // finished in the meantime
    }
    if (item.parentId) {
      await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { PK: `ITEM#${item.parentId}`, SK: `NAME#${item.nameLower}` } }));
    }
    await releaseFree(item.size ?? 0);
    cleaned++;
  }
  console.log(JSON.stringify({ stale: stale.length, cleaned }));
  return { stale: stale.length, cleaned };
}
