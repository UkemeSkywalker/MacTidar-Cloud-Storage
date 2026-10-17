import { AppShell } from "@/components/shell/AppShell";
import { getTeamSettings } from "@/server/db/team";
import { isPlatformAdmin, requirePageUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const team = await getTeamSettings(user.workspaceId);
  return (
    <AppShell
      user={{ id: user.id, name: user.name, email: user.email, role: user.role, platformAdmin: isPlatformAdmin(user) }}
      workspace={{ id: user.workspaceId, name: user.workspaceName, type: user.workspaceType, teamFiles: !!user.teamRootId }}
      workspaces={user.workspaces}
      usedBytes={team.usedBytes}
      quotaBytes={team.quotaBytes}
    >
      {children}
    </AppShell>
  );
}
