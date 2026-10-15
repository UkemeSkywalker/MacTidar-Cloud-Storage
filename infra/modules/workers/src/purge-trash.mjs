// Daily: permanently delete items that have been in the trash for 30+ days.
import { batchDelete, deleteObjects, queryAll, scanAll, subtractUsed, TABLE } from "./shared.mjs";

const RETENTION_DAYS = 30;

export async function handler() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400_000).toISOString();
  const roots = await scanAll({
    TableName: TABLE,
    FilterExpression: "SK = :meta AND #s = :trashed AND trashRootId = id AND trashedAt < :cutoff",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":meta": "META", ":trashed": "TRASHED", ":cutoff": cutoff },
  });

  let purged = 0;
  for (const root of roots) {
    const subtree = root.type === "folder"
      ? (await queryAll({
          TableName: TABLE,
          IndexName: "GSI3",
          KeyConditionExpression: "GSI3PK = :pk AND begins_with(GSI3SK, :path)",
          ExpressionAttributeValues: { ":pk": `ROOT#${root.rootId}`, ":path": root.path },
        })).filter((d) => d.id === root.id || d.trashRootId === root.id)
      : [root];

    await deleteObjects(subtree.filter((d) => d.type === "file" && d.s3Key).map((d) => d.s3Key));

    const keys = [];
    for (const d of subtree) {
      const rows = await queryAll({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `ITEM#${d.id}` },
        ProjectionExpression: "PK, SK, #t",
        ExpressionAttributeNames: { "#t": "token" },
      });
      for (const r of rows) {
        keys.push({ PK: r.PK, SK: r.SK });
        if (r.SK === "LINK" && r.token) keys.push({ PK: `LINK#${r.token}`, SK: "META" });
      }
    }
    await batchDelete(keys);

    const byUser = new Map();
    for (const d of subtree) if (d.type === "file" && d.size) byUser.set(d.createdBy, (byUser.get(d.createdBy) ?? 0) + d.size);
    for (const [userId, bytes] of byUser) await subtractUsed(root.workspaceId, userId, bytes);
    purged += subtree.length;
  }
  console.log(JSON.stringify({ trashRoots: roots.length, itemsPurged: purged }));
  return { trashRoots: roots.length, itemsPurged: purged };
}
