import { deleteInvite } from "@/server/db/invites";
import { route } from "@/server/errors";
import { requireAdmin } from "@/server/session";

export const DELETE = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  await requireAdmin();
  await deleteInvite((await params).id);
  return Response.json({ ok: true });
});
