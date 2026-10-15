import { getItems } from "@/server/db/items";
import { listStarIds } from "@/server/db/stars";
import { toRows } from "@/server/rows";
import { requirePageUser } from "@/server/session";
import { visibleItems } from "@/server/views";
import { StarredView } from "./StarredView";

export const metadata = { title: "Starred · MacTidar Cloud" };

export default async function StarredPage() {
  const user = await requirePageUser();
  const items = await getItems(await listStarIds(user.id));
  const { items: visible, roleOf, location } = await visibleItems(user, [...items.values()]);
  return <StarredView meId={user.id} rows={await toRows(user, visible, roleOf, location)} />;
}
