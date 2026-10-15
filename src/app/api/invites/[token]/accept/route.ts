import { z } from "zod";
import { passwordSchema } from "@/lib/passwords";
import { createCognitoUser } from "@/server/cognito";
import { deleteInvite, getInviteByToken } from "@/server/db/invites";
import { createUser, findMemberByEmail } from "@/server/db/users";
import { conflict, notFound, route } from "@/server/errors";
import { startSession } from "@/server/session";

const body = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(80),
  password: passwordSchema,
});

export const POST = route<{ params: Promise<{ token: string }> }>(async (req, { params }) => {
  const { token } = await params;
  const { name, password } = body.parse(await req.json());
  const invite = await getInviteByToken(token);
  if (!invite) throw notFound("This invitation is invalid or has expired.");
  if (await findMemberByEmail(invite.email)) throw conflict("An account with this email already exists. Sign in instead.");

  const id = await createCognitoUser(invite.email, password);
  const user = await createUser({ id, email: invite.email, name, role: invite.role });
  await deleteInvite(invite.id);
  await startSession(user, true);
  return Response.json({ ok: true });
});
