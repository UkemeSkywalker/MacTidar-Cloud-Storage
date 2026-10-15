import { z } from "zod";
import { startPasswordReset } from "@/server/cognito";
import { route } from "@/server/errors";

const body = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address.") });

export const POST = route(async (req) => {
  const { email } = body.parse(await req.json());
  await startPasswordReset(email);
  return Response.json({ ok: true });
});
