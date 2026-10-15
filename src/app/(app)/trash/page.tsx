import { getItems, pathIds } from "@/server/db/items";
import { listMembers } from "@/server/db/users";
import { listTrash } from "@/server/files";
import { requirePageUser } from "@/server/session";
import { TrashView } from "./TrashView";

export const metadata = { title: "Trash · MacTidar Cloud" };

export default async function TrashPage() {
  const user = await requirePageUser();
  const items = await listTrash(user);
  const parents = await getItems(items.flatMap((i) => pathIds(i.path).slice(0, -1)));
  const names = new Map((await listMembers()).map((m) => [m.id, m.name]));
  const location = (path: string) =>
    pathIds(path)
      .slice(0, -1)
      .map((id) => (id.startsWith("root-") ? "My Files" : (parents.get(id)?.name ?? "…")))
      .join(" / ");
  return (
    <TrashView
      meId={user.id}
      rows={items.map((i) => ({
        id: i.id,
        type: i.type,
        name: i.name,
        mimeType: i.mimeType,
        size: i.size ?? 0,
        location: location(i.path),
        deletedById: i.trashedBy ?? user.id,
        deletedByName: names.get(i.trashedBy ?? "") ?? "Unknown",
        trashedAt: i.trashedAt ?? i.updatedAt,
        isOwner: i.ownerId === user.id,
      }))}
    />
  );
}
