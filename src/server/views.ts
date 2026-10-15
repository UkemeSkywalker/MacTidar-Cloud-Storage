import "server-only";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getItems, pathIds, type Item } from "./db/items";
import { ddb, strip, TABLE } from "./db/table";
import type { User } from "./db/users";
import { effectiveRole, sharesOnPath, type AccessRole } from "./permissions";

// Keeps the active items the user can see, with their role and a readable location.
export async function visibleItems(user: User, items: Item[]) {
  const live = items.filter((i) => i.status === "ACTIVE" && i.parentId);
  const roles = new Map<string, AccessRole>();
  const startIndex = new Map<string, number>();
  await Promise.all(
    live.map(async (i) => {
      const role = await effectiveRole(user, i);
      if (!role) return;
      roles.set(i.id, role);
      if (i.ownerId !== user.id) {
        const shares = await sharesOnPath(user.id, i);
        startIndex.set(i.id, Math.max(0, pathIds(i.path).findIndex((id) => shares.has(id))));
      }
    }),
  );
  const visible = live.filter((i) => roles.has(i.id));
  const folders = await getItems(visible.flatMap((i) => pathIds(i.path).slice(0, -1)));
  const location = (i: Item) => {
    const ids = pathIds(i.path).slice(0, -1);
    if (i.ownerId === user.id) return ids.map((id) => (id.startsWith("root-") ? "My Files" : (folders.get(id)?.name ?? "…"))).join(" / ");
    const from = startIndex.get(i.id) ?? 0;
    return ["Shared with me", ...ids.slice(from).map((id) => folders.get(id)?.name ?? "…")].join(" / ");
  };
  return { items: visible, roleOf: (i: Item) => roles.get(i.id)!, location };
}

// Name search. A full scan is fine at this team's size (see docs/architecture.md §5.2).
export async function searchItems(query: string): Promise<Item[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: Item[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb().send(
      new ScanCommand({
        TableName: TABLE(),
        FilterExpression: "SK = :meta AND begins_with(PK, :item) AND #s = :active AND contains(nameLower, :q)",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":meta": "META", ":item": "ITEM#", ":active": "ACTIVE", ":q": q },
        ExclusiveStartKey: start,
      }),
    );
    out.push(...(res.Items ?? []).map((i) => strip(i) as Item));
    start = res.LastEvaluatedKey;
  } while (start && out.length < 500);
  return out;
}
