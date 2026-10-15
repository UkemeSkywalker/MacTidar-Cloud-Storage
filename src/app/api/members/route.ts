import { listMembers } from "@/server/db/users";
import { route } from "@/server/errors";
import { requireUser } from "@/server/session";

export const GET = route(async () => {
  await requireUser();
  const members = await listMembers();
  return Response.json({
    members: members.filter((m) => m.status === "ACTIVE").map((m) => ({ id: m.id, name: m.name, email: m.email })),
  });
});
