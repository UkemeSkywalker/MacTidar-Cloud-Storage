import "server-only";
import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, keys, TABLE } from "./db/table";
import { getItem, getItems, pathIds, type Item } from "./db/items";
import type { User } from "./db/users";
import type { Viewer } from "./session";
import { forbidden, notFound } from "./errors";

export type AccessRole = "VIEWER" | "EDITOR" | "OWNER";
const RANK: Record<AccessRole, number> = { VIEWER: 1, EDITOR: 2, OWNER: 3 };

export const atLeast = (role: AccessRole | null, min: AccessRole) => !!role && RANK[role] >= RANK[min];

// Direct shares for the user on each id in the item's path (the item and its ancestors).
export async function sharesOnPath(userId: string, item: Item): Promise<Map<string, AccessRole>> {
  const ids = pathIds(item.path);
  const res = await ddb().send(
    new BatchGetCommand({ RequestItems: { [TABLE()]: { Keys: ids.map((id) => keys.share(id, userId)) } } }),
  );
  const out = new Map<string, AccessRole>();
  for (const s of res.Responses?.[TABLE()] ?? []) out.set((s.PK as string).slice(5), s.role as AccessRole);
  return out;
}

type Who = User & { workspaceId?: string; teamRootId?: string };

// Everything under a company workspace's Team Files is editable by every member.
export const inTeamFiles = (user: Who, item: Item) => !!user.teamRootId && item.rootId === user.teamRootId && item.workspaceId === user.workspaceId;

export async function effectiveRole(user: Who, item: Item): Promise<AccessRole | null> {
  if (item.ownerId === user.id) return "OWNER";
  let best: AccessRole | null = inTeamFiles(user, item) ? "EDITOR" : null;
  for (const role of (await sharesOnPath(user.id, item)).values()) {
    if (!best || RANK[role] > RANK[best]) best = role;
  }
  return best;
}

// Loads an item and checks the user has at least `min` access. Trashed items
// are only reachable through the trash routes.
export async function requireAccess(user: Viewer, id: string, min: AccessRole, { allowTrashed = false } = {}) {
  const item = await getItem(id);
  if (!item || item.status === "UPLOADING" || (item.status === "TRASHED" && !allowTrashed)) throw notFound("This item doesn't exist or was deleted.");
  // Workspace isolation: items from other workspaces don't exist for this viewer.
  if (item.workspaceId !== user.workspaceId) throw notFound("This item doesn't exist or was deleted.");
  const role = await effectiveRole(user, item);
  if (!role) throw notFound("This item doesn't exist or was deleted.");
  if (!atLeast(role, min)) {
    throw forbidden(min === "OWNER" ? "Only the owner can do this." : "You have view-only access to this item.");
  }
  return { item, role };
}

export type Crumb = { id: string; name: string };

// Breadcrumb from the top-most folder the user can see down to the item.
export async function breadcrumb(user: Who, item: Item): Promise<{ crumbs: Crumb[]; viaShare: boolean }> {
  const ids = pathIds(item.path);
  let startIndex = 0;
  let viaShare = false;
  if (item.ownerId !== user.id && !inTeamFiles(user, item)) {
    const shares = await sharesOnPath(user.id, item);
    startIndex = Math.max(0, ids.findIndex((id) => shares.has(id)));
    viaShare = true;
  }
  const visible = ids.slice(startIndex);
  const items = await getItems(visible);
  return {
    crumbs: visible.map((id) => ({ id, name: items.get(id)?.name ?? "…" })),
    viaShare,
  };
}
