import { z } from "zod";
import { route } from "@/server/errors";
import { requireUser } from "@/server/session";
import { shareWith, unshare } from "@/server/sharing";

type Ctx = { params: Promise<{ id: string; userId: string }> };
const body = z.object({ role: z.enum(["VIEWER", "EDITOR"]) });

export const PUT = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id, userId } = await params;
  await shareWith(user, id, userId, body.parse(await req.json()).role);
  return Response.json({ ok: true });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id, userId } = await params;
  await unshare(user, id, userId);
  return Response.json({ ok: true });
});
