import { listWorkspaceMembers } from "@/server/db/workspaces";
import { route } from "@/server/errors";
import { requireUser } from "@/server/session";

export const GET = route(async () => {
  const user = await requireUser();
  const members = await listWorkspaceMembers(user.workspaceId);
  return Response.json({
    members: members.filter((m) => m.status === "ACTIVE" && m.userStatus === "ACTIVE").map((m) => ({ id: m.id, name: m.name, email: m.email })),
  });
});
