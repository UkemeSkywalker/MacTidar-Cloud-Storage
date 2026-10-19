import "server-only";
import { BatchWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  getItem,
  itemRecord,
  listSubtree,
  listingSortKey,
  pathIds,
  releaseName,
  setItemFields,
  validateName,
  withUniqueName,
  type Item,
} from "./db/items";
import { ddb, keys, now, strip, TABLE } from "./db/table";
import { addUsedBytes } from "./db/team";
import { getMembership, listWorkspaceMembers } from "./db/workspaces";
import type { Viewer } from "./session";
import { badRequest, forbidden, notFound } from "./errors";
import { newId } from "./ids";
import { inTeamFiles, requireAccess } from "./permissions";
import { guestShareKey } from "./db/guests";
import { deleteObjects } from "./storage";

export async function createFolder(user: Viewer, parentId: string, rawName: string) {
  const { item: parent } = await requireAccess(user, parentId, "EDITOR");
  if (parent.type !== "folder") throw badRequest("You can only create folders inside a folder.");
  const { id, name } = await createFolderIn(user, parent, rawName, false);
  return { id, name };
}

// Who owns something new: in Team Files the person who made it; in a shared
// folder elsewhere, the folder's owner (it lives in their space).
export const newItemOwner = (user: Viewer, parent: Item) => (inTeamFiles(user, parent) ? user.id : parent.ownerId);

async function createFolderIn(user: Viewer, parent: Item, rawName: string, autoRename: boolean) {
  const name = validateName(rawName);
  const id = newId();
  const at = now();
  const build = (finalName: string) => {
    const folder: Item = {
      id,
      workspaceId: parent.workspaceId,
      type: "folder",
      name: finalName,
      nameLower: finalName.toLowerCase(),
      parentId: parent.id,
      rootId: parent.rootId,
      path: `${parent.path}${id}/`,
      ownerId: newItemOwner(user, parent),
      createdBy: user.id,
      size: 0,
      status: "ACTIVE",
      createdAt: at,
      updatedAt: at,
      updatedBy: user.id,
    };
    return [{ Put: { TableName: TABLE(), Item: itemRecord(folder) } }];
  };
  const finalName = await withUniqueName(parent.id, name, build, { autoRename });
  const folder = build(finalName)[0].Put.Item as unknown as Item;
  return { id, name: finalName, folder };
}

// Recreates an uploaded folder's structure under `parentId` in one call.
// `paths` are folder paths like "Photos" and "Photos/2026". Top-level folders
// that clash get " (1)" added; returns path → new folder id.
export async function createFolderTree(user: Viewer, parentId: string, paths: string[]) {
  const { item: parent } = await requireAccess(user, parentId, "EDITOR");
  if (parent.type !== "folder") throw badRequest("You can only upload folders into a folder.");
  const all = new Set<string>();
  for (const p of paths) {
    const parts = p.split("/").filter(Boolean);
    for (let i = 1; i <= parts.length; i++) all.add(parts.slice(0, i).join("/"));
  }
  if (all.size > 2000) throw badRequest("That folder has too many sub-folders to upload at once (max 2,000).");
  const byDepth = [...all].sort((a, b) => a.split("/").length - b.split("/").length);
  const made = new Map<string, Item>();
  const ids: Record<string, string> = {};
  for (let depth = 1; ; depth++) {
    const level = byDepth.filter((p) => p.split("/").length === depth);
    if (!level.length) break;
    // Siblings at the same depth are created together.
    await Promise.all(
      level.map(async (p) => {
        const parts = p.split("/");
        const under = depth === 1 ? parent : made.get(parts.slice(0, -1).join("/"))!;
        const { id, folder } = await createFolderIn(user, under, parts[parts.length - 1], depth === 1);
        made.set(p, folder);
        ids[p] = id;
      }),
    );
  }
  return ids;
}

export async function renameItem(user: Viewer, id: string, rawName: string) {
  const { item } = await requireAccess(user, id, "EDITOR");
  if (!item.parentId) throw badRequest("The top-level folder can't be renamed.");
  const name = validateName(rawName);
  if (name === item.name) return item;
  await withUniqueName(
    item.parentId,
    name,
    (finalName) => [
      {
        Update: {
          TableName: TABLE(),
          Key: keys.item(item.id),
          UpdateExpression: "SET #n = :n, nameLower = :nl, GSI1SK = :sk, updatedAt = :at, updatedBy = :by",
          ExpressionAttributeNames: { "#n": "name" },
          ExpressionAttributeValues: {
            ":n": finalName,
            ":nl": finalName.toLowerCase(),
            ":sk": listingSortKey(item.type, finalName.toLowerCase()),
            ":at": now(),
            ":by": user.id,
          },
        },
      },
    ],
    { autoRename: false, releaseOld: { parentId: item.parentId, nameLower: item.nameLower } },
  );
}

export async function moveItems(user: Viewer, ids: string[], targetId: string) {
  const { item: target } = await requireAccess(user, targetId, "EDITOR");
  if (target.type !== "folder") throw badRequest("Choose a folder to move into.");
  const moved: string[] = [];
  for (const id of ids) {
    const { item } = await requireAccess(user, id, "EDITOR");
    if (!item.parentId) throw badRequest("The top-level folder can't be moved.");
    if (item.parentId === target.id) continue;
    if (item.rootId !== target.rootId) {
      throw badRequest("Items can only be moved within the same owner's files for now.");
    }
    if (target.path.startsWith(item.path)) throw badRequest(`"${item.name}" can't be moved into itself.`);

    const newPath = `${target.path}${item.id}/`;
    await withUniqueName(
      target.id,
      item.name,
      (finalName) => [
        {
          Update: {
            TableName: TABLE(),
            Key: keys.item(item.id),
            UpdateExpression:
              "SET parentId = :p, #path = :path, GSI1PK = :pk, GSI1SK = :sk, GSI3SK = :path, #n = :n, nameLower = :nl, updatedAt = :at, updatedBy = :by",
            ExpressionAttributeNames: { "#path": "path", "#n": "name" },
            ExpressionAttributeValues: {
              ":p": target.id,
              ":path": newPath,
              ":pk": `PARENT#${target.id}`,
              ":sk": listingSortKey(item.type, finalName.toLowerCase()),
              ":n": finalName,
              ":nl": finalName.toLowerCase(),
              ":at": now(),
              ":by": user.id,
            },
          },
        },
      ],
      { autoRename: true },
    );
    await releaseName(item.parentId, item.nameLower);

    if (item.type === "folder") {
      const descendants = (await listSubtree(item.rootId, item.path)).filter((d) => d.id !== item.id);
      for (const d of descendants) {
        const p = newPath + d.path.slice(item.path.length);
        await setItemFields(d.id, { path: p, GSI3SK: p });
      }
    }
    moved.push(item.id);
  }
  return moved;
}

export async function trashItems(user: Viewer, ids: string[]) {
  for (const id of ids) {
    const { item } = await requireAccess(user, id, "EDITOR");
    if (!item.parentId) throw badRequest("The top-level folder can't be deleted.");
    await moveToTrash(item, user.id);
  }
}

async function moveToTrash(item: Item, byUserId: string) {
  const at = now();
  await setItemFields(
    item.id,
    { status: "TRASHED", trashRootId: item.id, trashedAt: at, trashedBy: byUserId, GSI2PK: `TRASH#${item.workspaceId}#${byUserId}`, GSI2SK: at },
    ["GSI1PK", "GSI1SK"],
  );
  if (item.parentId) await releaseName(item.parentId, item.nameLower);
  if (item.type === "folder") {
    for (const d of await listSubtree(item.rootId, item.path)) {
      if (d.id !== item.id && d.status === "ACTIVE") await setItemFields(d.id, { status: "TRASHED", trashRootId: item.id });
    }
  }
}

// Platform staff removing reported content: trash it, then delete it for good.
export async function removeItemAsPlatform(admin: Viewer, item: Item) {
  if (!item.parentId) throw badRequest("A top-level folder can't be removed. Suspend the workspace instead.");
  if (item.status === "ACTIVE") await moveToTrash(item, item.ownerId);
  const fresh = await getItem(item.id);
  if (fresh?.status === "TRASHED" && fresh.trashRootId === fresh.id) return deleteForever(admin, fresh.id, { system: true });
  return 0;
}

async function trashedBy(workspaceId: string, userId: string): Promise<Item[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :pk",
      ExpressionAttributeValues: { ":pk": `TRASH#${workspaceId}#${userId}` },
      ScanIndexForward: false,
    }),
  );
  return (res.Items ?? []).map((i) => strip(i) as Item);
}

const isCompanyAdmin = (user: Viewer) => user.workspaceType === "COMPANY" && user.role === "ADMIN";

// What you deleted. Company admins see everything the team deleted.
export async function listTrash(user: Viewer): Promise<Item[]> {
  if (!isCompanyAdmin(user)) return trashedBy(user.workspaceId, user.id);
  const members = await listWorkspaceMembers(user.workspaceId);
  const all = (await Promise.all(members.map((m) => trashedBy(user.workspaceId, m.id)))).flat();
  return all.sort((a, b) => String(b.trashedAt).localeCompare(String(a.trashedAt)));
}

// Who can restore or permanently delete a trashed item.
export const canManageTrashed = (user: Viewer, item: Item) => item.trashedBy === user.id || item.ownerId === user.id || isCompanyAdmin(user);

async function requireTrashRoot(user: Viewer, id: string) {
  const item = await getItem(id);
  if (!item || item.status !== "TRASHED" || item.trashRootId !== item.id || item.workspaceId !== user.workspaceId) {
    throw notFound("This item isn't in the trash.");
  }
  if (!canManageTrashed(user, item)) throw forbidden();
  return item;
}

export async function restoreItem(user: Viewer, id: string) {
  const item = await requireTrashRoot(user, id);
  // Go back to the original folder if it still exists, otherwise to the top level
  // (Team Files, or the owner's My Files).
  let parent = item.parentId ? await getItem(item.parentId) : null;
  if (!parent || parent.status !== "ACTIVE") {
    const owner = await getMembership(item.workspaceId, item.ownerId);
    parent = await getItem(user.teamRootId ?? owner?.rootFolderId ?? user.rootFolderId);
    if (!parent) throw badRequest("The original location no longer exists.");
  }
  const newPath = `${parent.path}${item.id}/`;
  await withUniqueName(
    parent.id,
    item.name,
    (finalName) => [
      {
        Update: {
          TableName: TABLE(),
          Key: keys.item(item.id),
          UpdateExpression:
            "SET #s = :active, parentId = :p, #path = :path, GSI3SK = :path, GSI1PK = :pk, GSI1SK = :sk, #n = :n, nameLower = :nl, updatedAt = :at REMOVE trashRootId, trashedAt, trashedBy, GSI2PK, GSI2SK",
          ExpressionAttributeNames: { "#s": "status", "#path": "path", "#n": "name" },
          ExpressionAttributeValues: {
            ":active": "ACTIVE",
            ":p": parent.id,
            ":path": newPath,
            ":pk": `PARENT#${parent.id}`,
            ":sk": listingSortKey(item.type, finalName.toLowerCase()),
            ":n": finalName,
            ":nl": finalName.toLowerCase(),
            ":at": now(),
          },
        },
      },
    ],
    { autoRename: true },
  );
  if (item.type === "folder") {
    for (const d of await listSubtree(item.rootId, item.path)) {
      if (d.id === item.id || d.trashRootId !== item.id) continue;
      const p = newPath + d.path.slice(item.path.length);
      await setItemFields(d.id, { status: "ACTIVE", path: p, GSI3SK: p }, ["trashRootId"]);
    }
  }
}

// Permanently removes a trashed item and everything under it.
export async function deleteForever(user: Viewer, id: string, { system = false } = {}) {
  const item = system ? await getItem(id) : await requireTrashRoot(user, id);
  if (!item) return;
  if (!system && !canManageTrashed(user, item)) throw forbidden("Only the owner can delete items forever.");
  const all = item.type === "folder" ? await listSubtree(item.rootId, item.path) : [item];
  const doomed = all.filter((d) => d.id === item.id || d.trashRootId === item.id);

  await deleteObjects(doomed.filter((d) => d.type === "file" && d.s3Key).map((d) => d.s3Key!));

  // Shares, link pointers and name locks live in each item's partition.
  const deletes: Record<string, string>[] = [];
  for (const d of doomed) {
    const res = await ddb().send(
      new QueryCommand({
        TableName: TABLE(),
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `ITEM#${d.id}` },
        ProjectionExpression: "PK, SK, #t",
        ExpressionAttributeNames: { "#t": "token" },
      }),
    );
    for (const r of res.Items ?? []) {
      deletes.push({ PK: r.PK, SK: r.SK });
      if (r.SK === "LINK" && r.token) deletes.push(keys.link(r.token as string));
      if (String(r.SK).startsWith("GUEST#") && r.token) deletes.push(guestShareKey(r.token as string));
    }
  }
  for (let i = 0; i < deletes.length; i += 25) {
    await ddb().send(
      new BatchWriteCommand({
        RequestItems: { [TABLE()]: deletes.slice(i, i + 25).map((Key) => ({ DeleteRequest: { Key } })) },
      }),
    );
  }

  // Give the space back, per uploader.
  const byUser = new Map<string, number>();
  for (const d of doomed) if (d.type === "file" && d.size) byUser.set(d.createdBy, (byUser.get(d.createdBy) ?? 0) + d.size);
  for (const [uid, bytes] of byUser) await addUsedBytes(item.workspaceId, uid, -bytes, { alsoFree: true }).catch((e) => console.error(e));
  return doomed.length;
}

export async function emptyTrash(user: Viewer) {
  let count = 0;
  for (const t of await listTrash(user)) {
    if (canManageTrashed(user, t)) count += (await deleteForever(user, t.id)) ?? 0;
  }
  return count;
}

// What "Empty trash" would give back: the viewer's own trashed files, including inside trashed folders.
export async function emptyableTrashBytes(user: Viewer) {
  let bytes = 0;
  for (const t of await listTrash(user)) {
    if (!canManageTrashed(user, t)) continue;
    if (t.type === "file") bytes += t.size ?? 0;
    else for (const d of await listSubtree(t.rootId, t.path)) if (d.type === "file" && d.trashRootId === t.id) bytes += d.size ?? 0;
  }
  return bytes;
}

export const folderIdsOf = (item: Item) => pathIds(item.path);
