import { FolderPage } from "../folders/FolderPage";
import { requirePageUser } from "@/server/session";

export const metadata = { title: "My Files · MacTidar Cloud" };

export default async function FilesPage() {
  const user = await requirePageUser();
  return <FolderPage folderId={user.rootFolderId} />;
}
