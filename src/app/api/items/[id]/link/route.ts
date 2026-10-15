import { z } from "zod";
import { route } from "@/server/errors";
import { requireUser } from "@/server/session";
import { removeLink, saveLink } from "@/server/sharing";

type Ctx = { params: Promise<{ id: string }> };
const body = z.object({
  allowDownload: z.boolean(),
  // undefined = keep, null = remove
  password: z.string().max(200).nullable().optional(),
  expiresInDays: z.number().int().min(1).max(3650).nullable().optional(),
});

export const PUT = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  return Response.json({ link: await saveLink(user, (await params).id, body.parse(await req.json())) });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  await removeLink(user, (await params).id);
  return Response.json({ ok: true });
});
