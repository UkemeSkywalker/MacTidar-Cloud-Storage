import { getItems } from "@/server/db/items";
import { listRecent } from "@/server/recent";
import { toRows } from "@/server/rows";
import { requirePageUser } from "@/server/session";
import { visibleItems } from "@/server/views";
import { RecentView } from "./RecentView";

export const metadata = { title: "Recent · MacTidar Cloud" };

export default async function RecentPage() {
  const user = await requirePageUser();
  const recent = await listRecent(user.id, 100);
  const items = await getItems(recent.map((r) => r.itemId));
  const { items: visible, roleOf, location } = await visibleItems(user, [...items.values()]);
  const rows = new Map((await toRows(user, visible, roleOf, location)).map((r) => [r.id, r]));
  const entries = recent.filter((r) => rows.has(r.itemId)).map((r) => ({ ...rows.get(r.itemId)!, action: r.action, at: r.at }));
  return <RecentView entries={entries} meId={user.id} />;
}
