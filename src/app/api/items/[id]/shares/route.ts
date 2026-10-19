import { route } from "@/server/errors";
import { requireUser } from "@/server/session";
import { accessList } from "@/server/sharing";
import { getWorkspace } from "@/server/db/workspaces";
import { outsidePeople, outsidePolicy } from "@/server/guests";

export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  const { item, workspace, myRole, entries, members, link } = await accessList(user, (await params).id);
  const ws = await getWorkspace(item.workspaceId);
  const policy = ws ? await outsidePolicy(ws, user.id) : null;
  return Response.json({
    item: { id: item.id, name: item.name, type: item.type, size: item.size ?? 0 },
    workspace,
    myRole,
    entries,
    members,
    link,
    outside: {
      allowed: !!policy?.allowed,
      reason: policy && !policy.allowed ? policy.reason : null,
      allowedDomains: policy?.allowed ? policy.allowedDomains : [],
      isAdmin: user.role === "ADMIN",
      people: await outsidePeople(item.id),
    },
  });
});
