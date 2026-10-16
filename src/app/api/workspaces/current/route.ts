import { z } from "zod";
import { getWorkspace, updateWorkspace } from "@/server/db/workspaces";
import { badRequest, forbidden, route } from "@/server/errors";
import { requireUser } from "@/server/session";

const body = z.object({ sharingEnabled: z.boolean() });

// Personal workspaces: the owner turns sharing (public links) on or off.
export const PATCH = route(async (req) => {
  const user = await requireUser();
  const { sharingEnabled } = body.parse(await req.json());
  const ws = await getWorkspace(user.workspaceId);
  if (!ws || ws.type !== "PERSONAL") throw badRequest("This setting only applies to personal workspaces.");
  if (ws.ownerId !== user.id) throw forbidden();
  await updateWorkspace(ws.id, { sharingEnabled });
  return Response.json({ ok: true });
});
