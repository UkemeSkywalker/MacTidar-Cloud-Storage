import { deleteInvite, getInvite } from "@/server/db/invites";
import { notFound, route } from "@/server/errors";
import { inviteMember } from "@/server/invitations";
import { requireAdmin } from "@/server/session";

// Tokens aren't stored, so resending replaces the invite with a fresh one.
export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const admin = await requireAdmin();
  const invite = await getInvite((await params).id);
  if (!invite) throw notFound("This invite no longer exists.");
  const result = await inviteMember(admin, { email: invite.email, role: invite.role });
  await deleteInvite(invite.id);
  return Response.json({ result });
});
