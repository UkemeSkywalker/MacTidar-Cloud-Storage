import { listAllUsers } from "@/server/db/users";
import { listUserWorkspaces } from "@/server/db/workspaces";
import { isPlatformAdmin } from "@/server/session";
import { UsersView } from "./UsersView";

export default async function PlatformUsersPage() {
  const users = await listAllUsers();
  const memberships = await Promise.all(users.map((u) => listUserWorkspaces(u.id)));
  return (
    <UsersView
      rows={users.map((u, i) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt,
        staff: isPlatformAdmin(u),
        workspaces: memberships[i].map((m) => ({ id: m.workspace.id, name: m.workspace.name, type: m.workspace.type, role: m.membership.role })),
      }))}
    />
  );
}
