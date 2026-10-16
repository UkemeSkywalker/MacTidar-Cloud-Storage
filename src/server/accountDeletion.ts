import "server-only";
import { AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { BatchWriteCommand, DeleteCommand, QueryCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { aws } from "./aws";
import { config } from "./config";
import { getItem, listSubtree, listingSortKey, withUniqueName, type Item } from "./db/items";
import { deleteShare, sharedWithUser } from "./db/shares";
import { ddb, keys, now, TABLE } from "./db/table";
import type { User } from "./db/users";
import { listUserWorkspaces, listWorkspaceMembers, updateWorkspace, type Membership, type Workspace } from "./db/workspaces";
import { deleteObjects } from "./storage";

type Rec = Record<string, unknown> & { PK: string; SK: string };

export type DeletionPlan = {
  deleteWorkspaces: { id: string; name: string; type: Workspace["type"] }[];
  leaveWorkspaces: { id: string; name: string; transferTo: { id: string; name: string } }[];
  blockers: { id: string; name: string }[];
};

// What happens to each of the user's workspaces if they delete their account.
export async function planAccountDeletion(user: User): Promise<DeletionPlan> {
  const plan: DeletionPlan = { deleteWorkspaces: [], leaveWorkspaces: [], blockers: [] };
  for (const { workspace, membership } of await listUserWorkspaces(user.id)) {
    const others = (await listWorkspaceMembers(workspace.id)).filter((m) => m.id !== user.id && m.status === "ACTIVE" && m.userStatus === "ACTIVE");
    if (workspace.type === "PERSONAL" || others.length === 0) {
      plan.deleteWorkspaces.push({ id: workspace.id, name: workspace.name, type: workspace.type });
      continue;
    }
    const admins = others.filter((m) => m.role === "ADMIN");
    if (membership.role === "ADMIN" && admins.length === 0) {
      plan.blockers.push({ id: workspace.id, name: workspace.name });
      continue;
    }
    const target = admins.find((m) => m.id === workspace.ownerId) ?? admins[0] ?? others[0];
    plan.leaveWorkspaces.push({ id: workspace.id, name: workspace.name, transferTo: { id: target.id, name: target.name } });
  }
  return plan;
}

async function scanAll(filter: string, values: Record<string, unknown>): Promise<Rec[]> {
  const out: Rec[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb().send(new ScanCommand({ TableName: TABLE(), FilterExpression: filter, ExpressionAttributeValues: values, ExclusiveStartKey: start }));
    out.push(...((res.Items ?? []) as Rec[]));
    start = res.LastEvaluatedKey;
  } while (start);
  return out;
}

async function partition(pk: string): Promise<Rec[]> {
  const res = await ddb().send(new QueryCommand({ TableName: TABLE(), KeyConditionExpression: "PK = :pk", ExpressionAttributeValues: { ":pk": pk } }));
  return (res.Items ?? []) as Rec[];
}

async function batchDelete(records: { PK: string; SK: string }[]) {
  for (let i = 0; i < records.length; i += 25) {
    let request: Record<string, unknown[]> | undefined = {
      [TABLE()]: records.slice(i, i + 25).map((r) => ({ DeleteRequest: { Key: { PK: r.PK, SK: r.SK } } })),
    };
    while (request && Object.keys(request).length) {
      const res = await ddb().send(new BatchWriteCommand({ RequestItems: request as never }));
      request = res.UnprocessedItems as typeof request;
    }
  }
}

// Removes a workspace and everything in it: files (S3 too), shares, links, members, invites.
export async function deleteWorkspaceEverything(workspaceId: string) {
  const items = await scanAll("SK = :meta AND workspaceId = :ws AND begins_with(PK, :item)", { ":meta": "META", ":ws": workspaceId, ":item": "ITEM#" });
  await deleteObjects(items.map((i) => i.s3Key as string).filter(Boolean));
  const doomed: { PK: string; SK: string }[] = [];
  for (const it of items) {
    for (const r of await partition(it.PK)) {
      doomed.push({ PK: r.PK, SK: r.SK });
      if (r.SK === "LINK" && r.token) doomed.push(keys.link(r.token as string));
    }
  }
  const invites = await scanAll("begins_with(PK, :inv) AND workspaceId = :ws", { ":inv": "INVITE#", ":ws": workspaceId });
  doomed.push(...invites.map((r) => ({ PK: r.PK, SK: r.SK })));
  doomed.push(...(await partition(`WS#${workspaceId}`)).map((r) => ({ PK: r.PK, SK: r.SK })));
  await batchDelete(doomed);
  return items.length;
}

// Leaves a company workspace, handing the user's files to another member.
async function leaveWorkspace(workspace: Workspace, membership: Membership, user: User, targetId: string) {
  const targetMembership = (await listUserWorkspaces(targetId)).find((w) => w.workspace.id === workspace.id)?.membership;
  const [oldRoot, newParent] = await Promise.all([getItem(membership.rootFolderId), targetMembership ? getItem(targetMembership.rootFolderId) : null]);
  if (oldRoot && newParent) {
    const subtree = await listSubtree(oldRoot.rootId, oldRoot.path);
    const newPathOf = (it: Item) => newParent.path + it.path.slice(1);
    // The old root becomes a normal folder inside the new owner's My Files.
    await withUniqueName(
      newParent.id,
      `Files from ${user.name}`,
      (name) => [
        {
          Update: {
            TableName: TABLE(),
            Key: keys.item(oldRoot.id),
            UpdateExpression:
              "SET parentId = :p, #n = :n, nameLower = :nl, GSI1PK = :g1pk, GSI1SK = :g1sk, updatedAt = :at, updatedBy = :by",
            ExpressionAttributeNames: { "#n": "name" },
            ExpressionAttributeValues: {
              ":p": newParent.id,
              ":n": name,
              ":nl": name.toLowerCase(),
              ":g1pk": `PARENT#${newParent.id}`,
              ":g1sk": listingSortKey("folder", name.toLowerCase()),
              ":at": now(),
              ":by": targetId,
            },
          },
        },
      ],
      { autoRename: true },
    );
    for (const it of subtree) {
      const p = newPathOf(it);
      await ddb().send(
        new UpdateCommand({
          TableName: TABLE(),
          Key: keys.item(it.id),
          UpdateExpression: "SET #path = :path, rootId = :root, ownerId = :owner, GSI3PK = :g3pk, GSI3SK = :path",
          ExpressionAttributeNames: { "#path": "path" },
          ExpressionAttributeValues: { ":path": p, ":root": newParent.rootId, ":owner": targetId, ":g3pk": `ROOT#${newParent.rootId}` },
        }),
      );
    }
  }
  // The new owner's usage now includes these files.
  if (membership.usedBytes) {
    await ddb().send(
      new UpdateCommand({
        TableName: TABLE(),
        Key: keys.member(workspace.id, targetId),
        UpdateExpression: "SET usedBytes = if_not_exists(usedBytes, :zero) + :b",
        ExpressionAttributeValues: { ":b": membership.usedBytes, ":zero": 0 },
      }),
    );
  }
  for (const share of await sharedWithUser(workspace.id, user.id)) await deleteShare(share.itemId, user.id);
  if (workspace.ownerId === user.id) await updateWorkspace(workspace.id, { ownerId: targetId });
  await ddb().send(new DeleteCommand({ TableName: TABLE(), Key: keys.member(workspace.id, user.id) }));
}

export async function deleteAccount(user: User) {
  const plan = await planAccountDeletion(user);
  if (plan.blockers.length) throw new Error("Account deletion is blocked by workspaces that need another admin.");
  const memberships = new Map((await listUserWorkspaces(user.id)).map((w) => [w.workspace.id, w]));
  for (const ws of plan.deleteWorkspaces) await deleteWorkspaceEverything(ws.id);
  for (const ws of plan.leaveWorkspaces) {
    const m = memberships.get(ws.id);
    if (m) await leaveWorkspace(m.workspace, m.membership, user, ws.transferTo.id);
  }
  // Profile, stars and recent activity.
  await batchDelete((await partition(`USER#${user.id}`)).map((r) => ({ PK: r.PK, SK: r.SK })));
  await aws()
    .cognito.send(new AdminDeleteUserCommand({ UserPoolId: config().COGNITO_USER_POOL_ID, Username: user.id }))
    .catch((err) => {
      if ((err as { name?: string }).name !== "UserNotFoundException") throw err;
    });
  return plan;
}
