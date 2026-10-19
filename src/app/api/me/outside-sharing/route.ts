import { z } from "zod";
import { getWorkspace, updateMembership } from "@/server/db/workspaces";
import { badRequest, forbidden, route } from "@/server/errors";
import { requireUser } from "@/server/session";

const body = z.object({ enabled: z.boolean() });

// A company member's own opt-in to sharing outside the workspace.
export const PATCH = route(async (req) => {
  const user = await requireUser();
  const { enabled } = body.parse(await req.json());
  const ws = await getWorkspace(user.workspaceId);
  if (!ws || ws.type !== "COMPANY") throw badRequest("This setting only applies to company workspaces.");
  if (enabled && !ws.externalSharing) throw forbidden("Your workspace admin hasn't allowed sharing outside this workspace.");
  await updateMembership(ws.id, user.id, { outsideSharing: enabled });
  return Response.json({ ok: true });
});
