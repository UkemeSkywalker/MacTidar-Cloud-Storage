import "server-only";
import { GetCommand, QueryCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, keys, now, strip, TABLE } from "./table";

export type Role = "ADMIN" | "MEMBER";
export type UserStatus = "ACTIVE" | "DISABLED";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  rootFolderId: string;
  usedBytes: number;
  sessionVersion: number;
  createdAt: string;
  lastActiveAt?: string;
  notifyShares?: boolean;
};

export async function getUser(id: string): Promise<User | null> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.user(id) }));
  return res.Item ? (strip(res.Item) as User) : null;
}

export async function listMembers(): Promise<User[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": "MEMBERS" },
    }),
  );
  return (res.Items ?? []).map((i) => strip(i) as User);
}

export async function findMemberByEmail(email: string): Promise<User | null> {
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

// Creates the user record and their root "My Files" folder in one transaction.
export async function createUser(input: { id: string; email: string; name: string; role: Role }) {
  const at = now();
  const rootFolderId = `root-${input.id}`;
  const user: User = {
    id: input.id,
    email: input.email.toLowerCase(),
    name: input.name,
    role: input.role,
    status: "ACTIVE",
    rootFolderId,
    usedBytes: 0,
    sessionVersion: 1,
    createdAt: at,
    lastActiveAt: at,
  };
  await ddb().send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLE(),
            Item: { ...keys.user(user.id), GSI1PK: "MEMBERS", GSI1SK: user.email, ...user },
            ConditionExpression: "attribute_not_exists(PK)",
          },
        },
        {
          Put: {
            TableName: TABLE(),
            Item: {
              ...keys.item(rootFolderId),
              GSI3PK: `ROOT#${rootFolderId}`,
              GSI3SK: `/${rootFolderId}/`,
              id: rootFolderId,
              type: "folder",
              name: "My Files",
              nameLower: "my files",
              parentId: null,
              rootId: rootFolderId,
              path: `/${rootFolderId}/`,
              ownerId: user.id,
              createdBy: user.id,
              status: "ACTIVE",
              size: 0,
              createdAt: at,
              updatedAt: at,
              updatedBy: user.id,
            },
            ConditionExpression: "attribute_not_exists(PK)",
          },
        },
      ],
    }),
  );
  return user;
}

export async function updateUser(
  id: string,
  fields: Partial<Pick<User, "name" | "role" | "status" | "lastActiveAt" | "notifyShares">>,
) {
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
