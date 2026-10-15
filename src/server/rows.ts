import "server-only";
import type { BrowserRow } from "@/components/files/FileBrowser";
import type { Item } from "./db/items";
import { listStarIds } from "./db/stars";
import { listMembers, type User } from "./db/users";
import type { AccessRole } from "./permissions";

// Shapes items for the client file browser, resolving owner names and stars.
export async function toRows(
  user: User,
  items: Item[],
  roleOf: (item: Item) => AccessRole,
  locationOf?: (item: Item) => string | undefined,
): Promise<BrowserRow[]> {
  const [members, stars] = await Promise.all([listMembers(), listStarIds(user.id)]);
  const names = new Map(members.map((m) => [m.id, m.name]));
  const starred = new Set(stars);
  return items.map((i) => ({
    id: i.id,
    type: i.type,
    name: i.name,
    size: i.size ?? 0,
    mimeType: i.mimeType,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    ownerId: i.ownerId,
    ownerName: i.ownerId === user.id ? `${user.name.split(" ")[0]} (You)` : (names.get(i.ownerId) ?? "Former member"),
    sharedCount: i.sharedCount ?? 0,
    hasLink: !!i.linkToken,
    starred: starred.has(i.id),
    role: roleOf(i),
    location: locationOf?.(i),
  }));
}
