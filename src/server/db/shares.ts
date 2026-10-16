import "server-only";
import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { AccessRole } from "../permissions";
import { ddb, keys, now, TABLE } from "./table";

export type Share = { workspaceId?: string; itemId: string; userId: string; role: Exclude<AccessRole, "OWNER">; grantedBy: string; createdAt: string };

export async function listSharesOn(itemId: string): Promise<Share[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :s)",
      ExpressionAttributeValues: { ":pk": `ITEM#${itemId}`, ":s": "SHARE#" },
    }),
  );
  return (res.Items ?? []).map((s) => ({ itemId, userId: s.userId, role: s.role, grantedBy: s.grantedBy, createdAt: s.createdAt }));
}

export async function getShare(itemId: string, userId: string): Promise<Share | null> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.share(itemId, userId) }));
  return res.Item ? (res.Item as unknown as Share) : null;
}

// Grants or changes access. Returns true when the share is new.
export async function putShare(workspaceId: string, itemId: string, userId: string, role: Share["role"], grantedBy: string) {
  const existing = await getShare(itemId, userId);
  await ddb().send(
    new PutCommand({
      TableName: TABLE(),
      Item: {
        ...keys.share(itemId, userId),
        GSI1PK: `SHAREDWITH#${workspaceId}#${userId}`,
        workspaceId,
        GSI1SK: existing?.createdAt ?? now(),
        itemId,
        userId,
        role,
        grantedBy,
        createdAt: existing?.createdAt ?? now(),
      },
    }),
  );
  if (!existing) await adjustSharedCount(itemId, 1);
  return !existing;
}

export async function deleteShare(itemId: string, userId: string) {
  const res = await ddb().send(new DeleteCommand({ TableName: TABLE(), Key: keys.share(itemId, userId), ReturnValues: "ALL_OLD" }));
  if (res.Attributes) await adjustSharedCount(itemId, -1);
}

async function adjustSharedCount(itemId: string, by: number) {
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.item(itemId),
      UpdateExpression: "SET sharedCount = if_not_exists(sharedCount, :zero) + :by",
      ConditionExpression: "attribute_exists(PK)",
      ExpressionAttributeValues: { ":by": by, ":zero": 0 },
    }),
  ).catch(() => {});
}

export async function sharedWithUser(workspaceId: string, userId: string): Promise<Share[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": `SHAREDWITH#${workspaceId}#${userId}` },
      ScanIndexForward: false,
    }),
  );
  return (res.Items ?? []).map((s) => ({ itemId: s.itemId, userId, role: s.role, grantedBy: s.grantedBy, createdAt: s.createdAt }));
}
