import "server-only";
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, keys, now, strip, TABLE } from "./table";

export type { Role } from "./workspaces";

// A person's global identity. Their role, root folder and usage belong to each
// workspace membership (see db/workspaces.ts).
export type User = {
  id: string;
  email: string;
  name: string;
  status: "ACTIVE" | "DISABLED";
  sessionVersion: number;
  createdAt: string;
  lastActiveAt?: string;
  notifyShares?: boolean;
};

export async function getUser(id: string): Promise<User | null> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.user(id) }));
  return res.Item ? (strip(res.Item) as User) : null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :email",
      ExpressionAttributeValues: { ":pk": "MEMBERS", ":email": email.toLowerCase() },
    }),
  );
  return res.Items?.[0] ? (strip(res.Items[0]) as User) : null;
}

export async function listAllUsers(): Promise<User[]> {
  const out: User[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb().send(
      new QueryCommand({
        TableName: TABLE(),
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": "MEMBERS" },
        ExclusiveStartKey: start,
      }),
    );
    out.push(...(res.Items ?? []).map((i) => strip(i) as User));
    start = res.LastEvaluatedKey;
  } while (start);
  return out;
}

export async function createUser(input: { id: string; email: string; name: string }) {
  const at = now();
  const user: User = {
    id: input.id,
    email: input.email.toLowerCase(),
    name: input.name,
    status: "ACTIVE",
    sessionVersion: 1,
    createdAt: at,
    lastActiveAt: at,
  };
  await ddb().send(
    new PutCommand({
      TableName: TABLE(),
      Item: { ...keys.user(user.id), GSI1PK: "MEMBERS", GSI1SK: user.email, ...user },
      ConditionExpression: "attribute_not_exists(PK)",
    }),
  );
  return user;
}

export async function updateUser(id: string, fields: Partial<Pick<User, "name" | "status" | "lastActiveAt" | "notifyShares">>) {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return;
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.user(id),
      UpdateExpression: "SET " + entries.map(([k]) => `#${k} = :${k}`).join(", "),
      ExpressionAttributeNames: Object.fromEntries(entries.map(([k]) => [`#${k}`, k])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([k, v]) => [`:${k}`, v])),
      ConditionExpression: "attribute_exists(PK)",
    }),
  );
}

// Invalidates every existing session for the user.
export async function bumpSessionVersion(id: string) {
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.user(id),
      UpdateExpression: "ADD sessionVersion :one",
      ExpressionAttributeValues: { ":one": 1 },
    }),
  );
}
