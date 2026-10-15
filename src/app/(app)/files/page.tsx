import { Icon } from "@/components/Icon";
import { requirePageUser } from "@/server/session";

export default async function FilesPage() {
  const user = await requirePageUser();
  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="mb-6 font-headline-lg text-headline-lg text-text-primary">My Files</h1>
      <div className="flex flex-col items-center rounded-xl bg-surface p-16 text-center shadow-sm">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-fixed text-primary-container">
          <Icon name="cloud_upload" className="text-[32px]" />
        </div>
        <p className="font-headline-sm text-headline-sm text-text-primary">Welcome, {user.name.split(" ")[0]}</p>
        <p className="mt-1 font-body-md text-body-md text-text-secondary">File uploads and folders arrive in the next update.</p>
      </div>
    </div>
  );
}
