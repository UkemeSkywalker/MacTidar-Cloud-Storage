import { z } from "zod";
import { passwordSchema } from "@/lib/passwords";
import { setPassword, verifyPassword } from "@/server/cognito";
import { HttpError, route } from "@/server/errors";
import { requireUser } from "@/server/session";

const body = z.object({ current: z.string().min(1, "Enter your current password."), next: passwordSchema });

export const POST = route(async (req) => {
  const user = await requireUser();
  const { current, next } = body.parse(await req.json());
  try {
    await verifyPassword(user.email, current);
  } catch (err) {
    if (err instanceof HttpError && err.status === 401) throw new HttpError(400, "Your current password is incorrect.");
    throw err;
  }
  await setPassword(user.id, next);
  return Response.json({ ok: true });
});
