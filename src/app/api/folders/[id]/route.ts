import { listChildren } from "@/server/db/items";
import { route } from "@/server/errors";
import { breadcrumb, requireAccess } from "@/server/permissions";
import { requireUser } from "@/server/session";

// Folder info + its sub-folders, used by the "Move to…" picker.
export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  const { item } = await requireAccess(user, (await params).id, "VIEWER");
  const [{ crumbs }, children] = await Promise.all([breadcrumb(user, item), listChildren(item.id)]);
  return Response.json({
    folder: { id: item.id, name: item.name, path: item.path },
    crumbs,
    folders: children.filter((c) => c.type === "folder").map((c) => ({ id: c.id, name: c.name })),
  });
});
