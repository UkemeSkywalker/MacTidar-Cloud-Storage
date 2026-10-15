import "server-only";
import { GetCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, keys, TABLE } from "./table";

export type TeamSettings = {
  quotaBytes: number;
  usedBytes: number;
  freeBytes: number;
  maxFileBytes: number;
  alertPercent: number;
  alertSentAt?: string;
};

export async function getTeamSettings(): Promise<TeamSettings> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.team() }));
  if (!res.Item) throw new Error("Team settings record is missing.");
  const { quotaBytes, usedBytes, freeBytes, maxFileBytes, alertPercent, alertSentAt } = res.Item;
  return { quotaBytes, usedBytes, freeBytes, maxFileBytes, alertPercent, alertSentAt };
}

const isConditionFailed = (err: unknown) => (err as { name?: string }).name === "ConditionalCheckFailedException";

// Reserves space before an upload starts; fails if the team quota would be exceeded.
export async function reserveBytes(bytes: number) {
  try {
    await ddb().send(
      new UpdateCommand({
        TableName: TABLE(),
        Key: keys.team(),
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

export async function releaseBytes(bytes: number) {
  if (bytes <= 0) return;
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.team(),
      UpdateExpression: "SET freeBytes = freeBytes + :b",
      ExpressionAttributeValues: { ":b": bytes },
    }),
  );
}

// Moves bytes between "used" totals (positive when an upload completes,
// negative when files are permanently deleted). Updates the team and the user.
export async function addUsedBytes(userId: string, bytes: number, { alsoFree = false } = {}) {
  if (!bytes) return;
  await ddb().send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: TABLE(),
            Key: keys.team(),
            UpdateExpression: alsoFree ? "SET usedBytes = usedBytes + :b, freeBytes = freeBytes - :b" : "SET usedBytes = usedBytes + :b",
            ExpressionAttributeValues: { ":b": bytes },
          },
        },
        {
          Update: {
            TableName: TABLE(),
            Key: keys.user(userId),
            UpdateExpression: "SET usedBytes = if_not_exists(usedBytes, :zero) + :b",
            ConditionExpression: "attribute_exists(PK)",
            ExpressionAttributeValues: { ":b": bytes, ":zero": 0 },
          },
        },
      ],
    }),
  );
}
