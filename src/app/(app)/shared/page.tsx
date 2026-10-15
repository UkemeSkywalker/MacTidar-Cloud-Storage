import { getItems } from "@/server/db/items";
import { sharedWithUser } from "@/server/db/shares";
import { listMembers } from "@/server/db/users";
import { toRows } from "@/server/rows";
import { requirePageUser } from "@/server/session";
import { SharedView } from "./SharedView";

export const metadata = { title: "Shared with me · MacTidar Cloud" };

export default async function SharedPage() {
  const user = await requirePageUser();
  const shares = await sharedWithUser(user.id);
  const items = await getItems(shares.map((s) => s.itemId));
  const live = shares.filter((s) => items.get(s.itemId)?.status === "ACTIVE");
  const roleOf = new Map(live.map((s) => [s.itemId, s.role]));
  const rows = await toRows(
    user,
    live.map((s) => items.get(s.itemId)!),
    (i) => roleOf.get(i.id) ?? "VIEWER",
  );
  const names = new Map((await listMembers()).map((m) => [m.id, m.name]));
  const meta = Object.fromEntries(live.map((s) => [s.itemId, { sharedBy: names.get(s.grantedBy) ?? "A teammate", sharedById: s.grantedBy, sharedAt: s.createdAt }]));
  return <SharedView rows={rows} meta={meta} meId={user.id} />;
}
