import { AppShell } from "@/components/shell/AppShell";
import { isPlatformAdmin, requirePageUser } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  // Usage comes with the viewer's workspaces; no extra read needed.
  const team = user.workspaces.find((w) => w.id === user.workspaceId) ?? { usedBytes: 0, quotaBytes: 0 };
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
