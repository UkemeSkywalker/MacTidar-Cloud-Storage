import { toRows } from "@/server/rows";
import { requirePageUser } from "@/server/session";
import { searchItems, visibleItems } from "@/server/views";
import { SearchView } from "./SearchView";

export const metadata = { title: "Search · MacTidar Cloud" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requirePageUser();
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const { items, roleOf, location } = await visibleItems(user, await searchItems(user.workspaceId, q));
  return <SearchView q={q} meId={user.id} rows={await toRows(user, items, roleOf, location)} />;
}
