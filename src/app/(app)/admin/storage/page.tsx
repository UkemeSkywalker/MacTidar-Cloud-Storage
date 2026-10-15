import { getTeamSettings } from "@/server/db/team";
import { listMembers } from "@/server/db/users";
import { requirePageAdmin } from "@/server/session";
import { storageStats } from "@/server/usage";
import { StorageView } from "./StorageView";

export const metadata = { title: "Storage · MacTidar Cloud" };

export default async function StoragePage() {
  await requirePageAdmin();
  const [team, members, stats] = await Promise.all([getTeamSettings(), listMembers(), storageStats()]);
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
