import { FolderView } from "@/components/files/FolderView";
import { listChildren } from "@/server/db/items";
import { orNotFound } from "@/server/pages";
import { breadcrumb, requireAccess } from "@/server/permissions";
import { recordRecent } from "@/server/recent";
import { toRows } from "@/server/rows";
import { requirePageUser } from "@/server/session";

export async function FolderPage({ folderId }: { folderId: string }) {
  const user = await requirePageUser();
  const { item: folder, role } = await orNotFound(() => requireAccess(user, folderId, "VIEWER"));
  const [{ crumbs, viaShare }, children] = await Promise.all([breadcrumb(user, folder), listChildren(folder.id)]);
  if (folder.parentId) recordRecent(user.id, folder.workspaceId, folder.id, "opened").catch(() => {});
  const rows = await toRows(user, children, () => role);
  return (
    <FolderView
      folder={{ id: folder.id, name: folder.parentId ? folder.name : "My Files", role, path: folder.path }}
      crumbs={crumbs}
      viaShare={viaShare}
      rows={rows}
      meId={user.id}
    />
  );
}

