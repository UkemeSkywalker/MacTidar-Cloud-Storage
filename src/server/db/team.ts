import "server-only";
import { TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, keys, TABLE } from "./table";
import { getWorkspace } from "./workspaces";

// Storage counters now live on each workspace (WS#<id>/META).
export type TeamSettings = {
  quotaBytes: number;
  usedBytes: number;
  freeBytes: number;
  maxFileBytes: number;
  alertPercent: number;
  alertSentAt?: string;
};

export async function getTeamSettings(workspaceId: string): Promise<TeamSettings> {
  const ws = await getWorkspace(workspaceId);
  if (!ws) throw new Error(`Workspace ${workspaceId} is missing.`);
  const { quotaBytes, usedBytes, freeBytes, maxFileBytes, alertPercent, alertSentAt } = ws;
  return { quotaBytes, usedBytes, freeBytes, maxFileBytes, alertPercent, alertSentAt };
}

const isConditionFailed = (err: unknown) => (err as { name?: string }).name === "ConditionalCheckFailedException";

// Reserves space before an upload starts; fails if the workspace quota would be exceeded.
export async function reserveBytes(workspaceId: string, bytes: number) {
  try {
    await ddb().send(
      new UpdateCommand({
        TableName: TABLE(),
        Key: keys.workspace(workspaceId),
        UpdateExpression: "SET freeBytes = freeBytes - :b",
        ConditionExpression: "freeBytes >= :b",
        ExpressionAttributeValues: { ":b": bytes },
      }),
    );
    return true;
  } catch (err) {
    if (isConditionFailed(err)) return false;
    throw err;
  }
}

export async function releaseBytes(workspaceId: string, bytes: number) {
  if (bytes <= 0) return;
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.workspace(workspaceId),
      UpdateExpression: "SET freeBytes = freeBytes + :b",
      ExpressionAttributeValues: { ":b": bytes },
    }),
  );
}

// Moves bytes into (positive) or out of (negative) the workspace's and the
// member's "used" totals.
export async function addUsedBytes(workspaceId: string, userId: string, bytes: number, { alsoFree = false } = {}) {
  if (!bytes) return;
  await ddb().send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: TABLE(),
            Key: keys.workspace(workspaceId),
            UpdateExpression: alsoFree ? "SET usedBytes = usedBytes + :b, freeBytes = freeBytes - :b" : "SET usedBytes = usedBytes + :b",
            ExpressionAttributeValues: { ":b": bytes },
          },
        },
        {
          Update: {
            TableName: TABLE(),
            Key: keys.member(workspaceId, userId),
            UpdateExpression: "SET usedBytes = if_not_exists(usedBytes, :zero) + :b",
            ConditionExpression: "attribute_exists(PK)",
            ExpressionAttributeValues: { ":b": bytes, ":zero": 0 },
          },
        },
      ],
    }),
  ).catch(async (err) => {
    // Member left the workspace: still keep the workspace totals right.
    if ((err as { name?: string }).name !== "TransactionCanceledException") throw err;
    await ddb().send(
      new UpdateCommand({
        TableName: TABLE(),
        Key: keys.workspace(workspaceId),
        UpdateExpression: alsoFree ? "SET usedBytes = usedBytes + :b, freeBytes = freeBytes - :b" : "SET usedBytes = usedBytes + :b",
        ExpressionAttributeValues: { ":b": bytes },
      }),
    );
  });
}

// Changes the quota; refuses to go below what's already used or reserved.
export async function setQuota(workspaceId: string, oldQuota: number, newQuota: number) {
  const delta = newQuota - oldQuota;
  try {
    await ddb().send(
      new UpdateCommand({
        TableName: TABLE(),
        Key: keys.workspace(workspaceId),
        UpdateExpression: "SET quotaBytes = :new, freeBytes = freeBytes + :delta REMOVE alertSentAt",
        ConditionExpression: "quotaBytes = :old AND freeBytes >= :need",
        ExpressionAttributeValues: { ":new": newQuota, ":old": oldQuota, ":delta": delta, ":need": Math.max(0, -delta) },
      }),
    );
    return true;
  } catch (err) {
    if (isConditionFailed(err)) return false;
    throw err;
  }
}

export async function updateTeamFields(workspaceId: string, fields: { maxFileBytes?: number; alertPercent?: number; alertSentAt?: string | null }) {
  const set: string[] = [];
  const remove: string[] = [];
  const values: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    if (v === null) remove.push(k);
    else {
      set.push(`${k} = :${k}`);
      values[`:${k}`] = v;
    }
  }
  if (!set.length && !remove.length) return;
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.workspace(workspaceId),
      UpdateExpression: [set.length ? `SET ${set.join(", ")}` : "", remove.length ? `REMOVE ${remove.join(", ")}` : ""].join(" "),
      ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
    }),
  );
}
