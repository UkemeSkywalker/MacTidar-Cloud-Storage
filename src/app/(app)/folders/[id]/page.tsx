import { FolderPage } from "../FolderPage";

export default async function FolderRoute({ params }: { params: Promise<{ id: string }> }) {
  return <FolderPage folderId={(await params).id} />;
}
