import { deleteInvite, getInviteByToken } from "@/server/db/invites";
import { addMember, getMembership } from "@/server/db/workspaces";
import { forbidden, notFound, route } from "@/server/errors";
import { requireUser, setActiveWorkspace } from "@/server/session";

type Ctx = { params: Promise<{ token: string }> };

async function load(token: string) {
  const user = await requireUser();
  const invite = await getInviteByToken(token);
  if (!invite) throw notFound("This invitation is invalid or has expired.");
  if (invite.email !== user.email) throw forbidden(`This invitation is for ${invite.email}. Sign in with that account to accept it.`);
  return { user, invite };
}

// An existing account accepts an invite to another workspace.
export const POST = route<Ctx>(async (_req, { params }) => {
  const { user, invite } = await load((await params).token);
  if (!(await getMembership(invite.workspaceId, user.id))) await addMember(invite.workspaceId, user.id, invite.role);
  await deleteInvite(invite.id);
  await setActiveWorkspace(invite.workspaceId);
  return Response.json({ ok: true });
});

// Decline.
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const { invite } = await load((await params).token);
  await deleteInvite(invite.id);
  return Response.json({ ok: true });
});
