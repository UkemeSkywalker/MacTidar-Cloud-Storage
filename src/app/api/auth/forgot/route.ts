import { z } from "zod";
import { startPasswordReset } from "@/server/cognito";
import { route } from "@/server/errors";
import { requireHuman } from "@/server/turnstile";

const body = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address."), turnstile: z.string().max(4096).optional() });

export const POST = route(async (req) => {
  const { email, turnstile } = body.parse(await req.json());
  await requireHuman(turnstile, req);
  await startPasswordReset(email);
  return Response.json({ ok: true });
});
