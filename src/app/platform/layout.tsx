import { PlatformShell } from "@/components/platform/PlatformShell";
import { listReports } from "@/server/db/abuse";
import { requirePagePlatformAdmin } from "@/server/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Platform admin · MacTidar Cloud" };

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePagePlatformAdmin();
  const open = await listReports("OPEN");
  return (
    <PlatformShell user={{ id: admin.id, name: admin.name, email: admin.email }} openReports={open.length}>
      {children}
    </PlatformShell>
  );
}
