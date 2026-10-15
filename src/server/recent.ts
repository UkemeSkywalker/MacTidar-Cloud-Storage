import "server-only";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, epochSeconds, keys, TABLE } from "./db/table";

export type RecentAction = "uploaded" | "opened" | "downloaded" | "renamed" | "moved" | "shared";

// One record per (user, item), refreshed on each touch; expires after 30 days.
export async function recordRecent(userId: string, itemId: string, action: RecentAction) {
  const at = new Date();
  await ddb().send(
    new PutCommand({
      TableName: TABLE(),
      Item: {
        ...keys.recent(userId, itemId),
        GSI2PK: `RECENT#${userId}`,
        GSI2SK: at.toISOString(),
        itemId,
        action,
        at: at.toISOString(),
        expiresAt: epochSeconds(new Date(at.getTime() + 30 * 86400_000)),
      },
    }),
  );
}

export async function listRecent(userId: string, limit = 100) {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk",
      ExpressionAttributeValues: { ":pk": `RECENT#${userId}` },
      ScanIndexForward: false,
      Limit: limit,
    }),
  );
  return (res.Items ?? []).map((r) => ({ itemId: r.itemId as string, action: r.action as RecentAction, at: r.at as string }));
}
