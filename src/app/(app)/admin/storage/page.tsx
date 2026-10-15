import { getTeamSettings } from "@/server/db/team";
import { listWorkspaceMembers } from "@/server/db/workspaces";
import { requirePageAdmin } from "@/server/session";
import { storageStats } from "@/server/usage";
import { StorageView } from "./StorageView";

export const metadata = { title: "Storage · MacTidar Cloud" };

export default async function StoragePage() {
  const admin = await requirePageAdmin();
  const [team, members, stats] = await Promise.all([
    getTeamSettings(admin.workspaceId),
    listWorkspaceMembers(admin.workspaceId),
    storageStats(admin.workspaceId),
  ]);
  return (
    <StorageView
      team={team}
      stats={stats}
      members={members
        .map((m) => ({ id: m.id, name: m.name, role: m.role, usedBytes: m.usedBytes ?? 0 }))
        .sort((a, b) => b.usedBytes - a.usedBytes)}
    />
  );
}
