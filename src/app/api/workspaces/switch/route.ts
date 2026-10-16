import { z } from "zod";
import { getMembership, getWorkspace } from "@/server/db/workspaces";
import { notFound, route } from "@/server/errors";
import { requireUser, setActiveWorkspace } from "@/server/session";

const body = z.object({ workspaceId: z.string().min(1) });

export const POST = route(async (req) => {
  const user = await requireUser();
  const { workspaceId } = body.parse(await req.json());
  const [ws, membership] = await Promise.all([getWorkspace(workspaceId), getMembership(workspaceId, user.id)]);
  if (!ws || ws.status !== "ACTIVE" || membership?.status !== "ACTIVE") throw notFound("You're not a member of that workspace.");
  await setActiveWorkspace(workspaceId);
  return Response.json({ ok: true });
});
