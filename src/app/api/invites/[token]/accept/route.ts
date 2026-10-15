import { z } from "zod";
import { passwordSchema } from "@/lib/passwords";
import { createCognitoUser } from "@/server/cognito";
import { deleteInvite, getInviteByToken } from "@/server/db/invites";
import { createUser, findUserByEmail } from "@/server/db/users";
import { addMember } from "@/server/db/workspaces";
import { conflict, notFound, route } from "@/server/errors";
import { setActiveWorkspace, startSession } from "@/server/session";

const body = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(80),
  password: passwordSchema,
});

export const POST = route<{ params: Promise<{ token: string }> }>(async (req, { params }) => {
  const { token } = await params;
  const { name, password } = body.parse(await req.json());
  const invite = await getInviteByToken(token);
  if (!invite) throw notFound("This invitation is invalid or has expired.");
  if (await findUserByEmail(invite.email)) throw conflict("An account with this email already exists. Sign in instead.");

  const id = await createCognitoUser(invite.email, password);
  const user = await createUser({ id, email: invite.email, name });
  await addMember(invite.workspaceId, user.id, invite.role);
  await deleteInvite(invite.id);
  await setActiveWorkspace(invite.workspaceId);
  await startSession(user, true);
  return Response.json({ ok: true });
});
