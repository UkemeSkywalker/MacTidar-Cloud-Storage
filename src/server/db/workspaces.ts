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
  // Company workspaces: the admin allows members to share with people outside.
  externalSharing: boolean;
  // Optional allowlist for outside sharing (e.g. ["designcorp.com"]); empty = any domain.
  allowedDomains?: string[];
  // Personal workspaces: public links are off until the owner turns sharing on.
  sharingEnabled?: boolean;
  // Company workspaces: the shared "Team Files" root every member can see and edit.
  teamRootId?: string;
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
  // The member's own opt-in to sharing outside the workspace (when the admin allows it).
  outsideSharing?: boolean;
};

// A workspace member joined with their global profile.
export type Member = Membership & { id: string; name: string; email: string; lastActiveAt?: string; userStatus: User["status"] };

export const GB = 1024 ** 3;
export const DEFAULT_QUOTA: Record<WorkspaceType, number> = { PERSONAL: 3 * GB, COMPANY: 3 * GB };
export const DEFAULT_MAX_FILE = 5 * GB;

// Every workspace is listed under GSI2 "WORKSPACES" for the platform admin console.
export const workspaceIndex = (ws: Pick<Workspace, "createdAt">) => ({ GSI2PK: "WORKSPACES", GSI2SK: ws.createdAt });

export async function listAllWorkspaces(): Promise<Workspace[]> {
  const out: Workspace[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb().send(
      new QueryCommand({
        TableName: TABLE(),
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :pk",
        ExpressionAttributeValues: { ":pk": "WORKSPACES" },
        ScanIndexForward: false,
        ExclusiveStartKey: start,
      }),
    );
    out.push(...(res.Items ?? []).map((i) => strip(i) as Workspace));
    start = res.LastEvaluatedKey;
  } while (start);
  return out;
}

export async function countMembers(workspaceId: string): Promise<number> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :m)",
      ExpressionAttributeValues: { ":pk": `WS#${workspaceId}`, ":m": "MEMBER#" },
      Select: "COUNT",
    }),
  );
  return res.Count ?? 0;
}

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

export const TEAM_FILES = "Team Files";

export function rootFolderRecord(workspaceId: string, rootFolderId: string, userId: string, at: string, name = "My Files") {
  return {
    ...keys.item(rootFolderId),
    GSI3PK: `ROOT#${rootFolderId}`,
    GSI3SK: `/${rootFolderId}/`,
    id: rootFolderId,
    workspaceId,
    type: "folder",
    name,
    nameLower: name.toLowerCase(),
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

// Adds a user to a workspace. Company members share the workspace's Team Files;
// personal workspaces get their own root "My Files" folder.
export async function addMember(workspaceId: string, userId: string, role: Role) {
  const at = now();
  const ws = await getWorkspace(workspaceId);
  const teamRoot = ws?.teamRootId;
  const m: Membership = { workspaceId, userId, role, status: "ACTIVE", rootFolderId: teamRoot ?? `root-${newId()}`, usedBytes: 0, joinedAt: at };
  await ddb().send(
    new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: TABLE(), Item: membershipRecord(m), ConditionExpression: "attribute_not_exists(PK)" } },
        ...(teamRoot ? [] : [{ Put: { TableName: TABLE(), Item: rootFolderRecord(workspaceId, m.rootFolderId, userId, at), ConditionExpression: "attribute_not_exists(PK)" } }]),
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
    ...(input.type === "COMPANY" ? { teamRootId: `team-${newId()}` } : {}),
    createdAt: at,
  };
  await ddb().send(
    new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: TABLE(), Item: { ...keys.workspace(ws.id), ...workspaceIndex(ws), ...ws }, ConditionExpression: "attribute_not_exists(PK)" } },
        ...(ws.teamRootId
          ? [{ Put: { TableName: TABLE(), Item: rootFolderRecord(ws.id, ws.teamRootId, input.ownerId, at, TEAM_FILES), ConditionExpression: "attribute_not_exists(PK)" } }]
          : []),
      ],
    }),
  );
  const membership = await addMember(ws.id, input.ownerId, "ADMIN");
  return { workspace: ws, membership };
}

export async function updateMembership(workspaceId: string, userId: string, fields: Partial<Pick<Membership, "role" | "status" | "outsideSharing">>) {
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

export async function updateWorkspace(
  id: string,
  fields: Partial<Pick<Workspace, "name" | "sharingEnabled" | "ownerId" | "status" | "externalSharing" | "allowedDomains">>,
) {
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
