import { setStar } from "@/server/db/stars";
import { route } from "@/server/errors";
import { requireAccess } from "@/server/permissions";
import { requireUser } from "@/server/session";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { item } = await requireAccess(user, (await params).id, "VIEWER");
  await setStar(user.id, item.id, true);
  return Response.json({ ok: true });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  await setStar(user.id, (await params).id, false);
  return Response.json({ ok: true });
});
