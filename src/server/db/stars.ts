import "server-only";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, keys, now, TABLE } from "./table";

export async function setStar(userId: string, itemId: string, starred: boolean) {
  if (starred) {
    await ddb().send(new PutCommand({ TableName: TABLE(), Item: { ...keys.star(userId, itemId), itemId, createdAt: now() } }));
  } else {
    await ddb().send(new DeleteCommand({ TableName: TABLE(), Key: keys.star(userId, itemId) }));
  }
}

export async function listStarIds(userId: string): Promise<string[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :star)",
      ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":star": "STAR#" },
    }),
  );
  return (res.Items ?? []).map((i) => i.itemId as string);
}
