import { listInvites } from "@/server/db/invites";
import { getTeamSettings } from "@/server/db/team";
import { listMembers } from "@/server/db/users";
import { requirePageAdmin } from "@/server/session";
import { MembersView } from "./MembersView";

export const metadata = { title: "Members · MacTidar Cloud" };

export default async function MembersPage() {
  const admin = await requirePageAdmin();
  const [members, invites, team] = await Promise.all([listMembers(), listInvites(), getTeamSettings()]);
  members.sort((a, b) => (a.id === admin.id ? -1 : b.id === admin.id ? 1 : a.name.localeCompare(b.name)));
  return (
    <MembersView
      meId={admin.id}
      members={members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
        usedBytes: m.usedBytes ?? 0,
        lastActiveAt: m.lastActiveAt,
      }))}
      invites={invites.map((i) => ({ id: i.id, email: i.email, role: i.role, createdAt: i.createdAt }))}
      teamUsedBytes={team.usedBytes}
      quotaBytes={team.quotaBytes}
    />
  );
}
