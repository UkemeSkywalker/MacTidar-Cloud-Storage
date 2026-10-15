import { AppShell } from "@/components/shell/AppShell";
import { getTeamSettings } from "@/server/db/team";
import { requirePageUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const team = await getTeamSettings();
  return (
    <AppShell
      user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
      usedBytes={team.usedBytes}
      quotaBytes={team.quotaBytes}
    >
      {children}
    </AppShell>
  );
}
