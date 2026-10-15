import { route } from "@/server/errors";
import { deleteForever } from "@/server/files";
import { requireUser } from "@/server/session";

export const DELETE = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  await deleteForever(user, (await params).id);
  return Response.json({ ok: true });
});
