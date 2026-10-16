import "server-only";
import { BatchGetCommand, GetCommand, QueryCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { newId } from "../ids";
import { ddb, keys, now, strip, TABLE } from "./table";
import type { User } from "./users";

export type WorkspaceType = "PERSONAL" | "COMPANY";
export type Role = "ADMIN" | "MEMBER";
export type MemberStatus = "ACTIVE" | "DISABLED";

export type Workspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  status: "ACTIVE" | "SUSPENDED";
  quotaBytes: number;
  usedBytes: number;
  freeBytes: number;
  maxFileBytes: number;
  alertPercent: number;
  alertSentAt?: string;
  externalSharing: boolean;
  // Personal workspaces: public links are off until the owner turns sharing on.
  sharingEnabled?: boolean;
  createdAt: string;
};

export type Membership = {
  workspaceId: string;
  userId: string;
  role: Role;
  status: MemberStatus;
  rootFolderId: string;
  usedBytes: number;
  joinedAt: string;
};

// A workspace member joined with their global profile.
export type Member = Membership & { id: string; name: string; email: string; lastActiveAt?: string; userStatus: User["status"] };

export const GB = 1024 ** 3;
export const DEFAULT_QUOTA: Record<WorkspaceType, number> = { PERSONAL: 3 * GB, COMPANY: 3 * GB };
export const DEFAULT_MAX_FILE = 5 * GB;

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.workspace(id) }));
  return res.Item ? (strip(res.Item) as Workspace) : null;
}

export async function getMembership(workspaceId: string, userId: string): Promise<Membership | null> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.member(workspaceId, userId) }));
  return res.Item ? (strip(res.Item) as Membership) : null;
}

// All of a user's memberships with their workspaces (company workspaces first).
export async function listUserWorkspaces(userId: string): Promise<{ workspace: Workspace; membership: Membership }[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": `USERWS#${userId}` },
    }),
  );
  const memberships = (res.Items ?? []).map((i) => strip(i) as Membership);
  if (!memberships.length) return [];
  const got = await ddb().send(
    new BatchGetCommand({ RequestItems: { [TABLE()]: { Keys: memberships.map((m) => keys.workspace(m.workspaceId)) } } }),
  );
  const byId = new Map((got.Responses?.[TABLE()] ?? []).map((w) => [w.id as string, strip(w) as Workspace]));
  return memberships
    .filter((m) => byId.has(m.workspaceId))
    .map((m) => ({ workspace: byId.get(m.workspaceId)!, membership: m }))
    .sort((a, b) => (a.workspace.type === b.workspace.type ? a.workspace.name.localeCompare(b.workspace.name) : a.workspace.type === "COMPANY" ? -1 : 1));
}

export async function listWorkspaceMembers(workspaceId: string): Promise<Member[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :m)",
      ExpressionAttributeValues: { ":pk": `WS#${workspaceId}`, ":m": "MEMBER#" },
    }),
  );
  const memberships = (res.Items ?? []).map((i) => strip(i) as Membership);
  if (!memberships.length) return [];
  const users = new Map<string, User>();
  for (let i = 0; i < memberships.length; i += 100) {
    const got = await ddb().send(
      new BatchGetCommand({ RequestItems: { [TABLE()]: { Keys: memberships.slice(i, i + 100).map((m) => keys.user(m.userId)) } } }),
    );
    for (const u of got.Responses?.[TABLE()] ?? []) users.set(u.id as string, strip(u) as User);
  }
  return memberships
    .filter((m) => users.has(m.userId))
    .map((m) => {
      const u = users.get(m.userId)!;
      return { ...m, id: u.id, name: u.name, email: u.email, lastActiveAt: u.lastActiveAt, userStatus: u.status };
    });
}

function rootFolderRecord(workspaceId: string, rootFolderId: string, userId: string, at: string) {
  return {
    ...keys.item(rootFolderId),
    GSI3PK: `ROOT#${rootFolderId}`,
    GSI3SK: `/${rootFolderId}/`,
    id: rootFolderId,
    workspaceId,
    type: "folder",
    name: "My Files",
    nameLower: "my files",
    parentId: null,
    rootId: rootFolderId,
    path: `/${rootFolderId}/`,
    ownerId: userId,
    createdBy: userId,
    status: "ACTIVE",
    size: 0,
    createdAt: at,
    updatedAt: at,
    updatedBy: userId,
  };
}

function membershipRecord(m: Membership) {
  return { ...keys.member(m.workspaceId, m.userId), GSI1PK: `USERWS#${m.userId}`, GSI1SK: m.workspaceId, ...m };
}

// Adds a user to a workspace with their own root "My Files" folder.
export async function addMember(workspaceId: string, userId: string, role: Role) {
  const at = now();
  const m: Membership = { workspaceId, userId, role, status: "ACTIVE", rootFolderId: `root-${newId()}`, usedBytes: 0, joinedAt: at };
  await ddb().send(
    new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: TABLE(), Item: membershipRecord(m), ConditionExpression: "attribute_not_exists(PK)" } },
        { Put: { TableName: TABLE(), Item: rootFolderRecord(workspaceId, m.rootFolderId, userId, at), ConditionExpression: "attribute_not_exists(PK)" } },
      ],
    }),
  );
  return m;
}

// Creates a workspace and makes `ownerId` its first admin.
export async function createWorkspace(input: { name: string; type: WorkspaceType; ownerId: string; quotaBytes?: number }) {
  const at = now();
  const quota = input.quotaBytes ?? DEFAULT_QUOTA[input.type];
  const ws: Workspace = {
    id: `ws-${newId()}`,
    name: input.name,
    type: input.type,
    ownerId: input.ownerId,
    status: "ACTIVE",
    quotaBytes: quota,
    usedBytes: 0,
    freeBytes: quota,
    maxFileBytes: DEFAULT_MAX_FILE,
    alertPercent: 80,
    externalSharing: false,
    createdAt: at,
  };
  await ddb().send(
    new TransactWriteCommand({
      TransactItems: [{ Put: { TableName: TABLE(), Item: { ...keys.workspace(ws.id), ...ws }, ConditionExpression: "attribute_not_exists(PK)" } }],
    }),
  );
  const membership = await addMember(ws.id, input.ownerId, "ADMIN");
  return { workspace: ws, membership };
}

export async function updateMembership(workspaceId: string, userId: string, fields: Partial<Pick<Membership, "role" | "status">>) {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return;
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.member(workspaceId, userId),
      UpdateExpression: "SET " + entries.map(([k]) => `#${k} = :${k}`).join(", "),
      ExpressionAttributeNames: Object.fromEntries(entries.map(([k]) => [`#${k}`, k])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([k, v]) => [`:${k}`, v])),
      ConditionExpression: "attribute_exists(PK)",
    }),
  );
}

export async function updateWorkspace(id: string, fields: Partial<Pick<Workspace, "name" | "sharingEnabled">>) {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return;
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.workspace(id),
      UpdateExpression: "SET " + entries.map(([k]) => `#${k} = :${k}`).join(", "),
      ExpressionAttributeNames: Object.fromEntries(entries.map(([k]) => [`#${k}`, k])),
      ExpressionAttributeValues: Object.fromEntries(entries.map(([k, v]) => [`:${k}`, v])),
      ConditionExpression: "attribute_exists(PK)",
    }),
  );
}
