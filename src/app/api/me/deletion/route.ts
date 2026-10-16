import { z } from "zod";
import { deleteAccount, planAccountDeletion } from "@/server/accountDeletion";
import { verifyPassword } from "@/server/cognito";
import { badRequest, conflict, HttpError, route } from "@/server/errors";
import { endSession, requireUser } from "@/server/session";

// What deleting the account would do (shown before confirming).
export const GET = route(async () => {
  const user = await requireUser();
  return Response.json(await planAccountDeletion(user));
});

const body = z.object({ email: z.string().trim().toLowerCase(), password: z.string().min(1, "Enter your password.") });

export const POST = route(async (req) => {
  const user = await requireUser();
  const { email, password } = body.parse(await req.json());
  if (email !== user.email) throw badRequest("Type your email address exactly to confirm.");
  try {
    await verifyPassword(user.email, password);
  } catch (err) {
    if (err instanceof HttpError && err.status === 401) throw badRequest("Your password is incorrect.");
    throw err;
  }
  const plan = await planAccountDeletion(user);
  if (plan.blockers.length) {
    throw conflict(`Make someone else an admin of ${plan.blockers.map((b) => b.name).join(", ")} first.`, "needs_admin");
  }
  await deleteAccount(user);
  await endSession();
  return Response.json({ ok: true });
});
