import { z } from "zod";
import { verifyPassword } from "@/server/cognito";
import { getUser } from "@/server/db/users";
import { HttpError, route } from "@/server/errors";
import { startSession } from "@/server/session";

const body = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean().default(true),
});

export const POST = route(async (req) => {
  const { email, password, remember } = body.parse(await req.json());
  const id = await verifyPassword(email, password);
  const user = await getUser(id);
  if (!user || user.status !== "ACTIVE") {
    throw new HttpError(403, "This account is deactivated. Contact your admin.", "disabled");
  }
  await startSession(user, remember);
  return Response.json({ ok: true });
});
