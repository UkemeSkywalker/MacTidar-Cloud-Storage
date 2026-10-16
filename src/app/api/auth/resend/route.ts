import { z } from "zod";
import { resendSignUpCode } from "@/server/cognito";
import { route } from "@/server/errors";
import { requireHuman } from "@/server/turnstile";

const body = z.object({ email: z.string().trim().toLowerCase().email(), turnstile: z.string().max(4096).optional() });

export const POST = route(async (req) => {
  const { email, turnstile } = body.parse(await req.json());
  await requireHuman(turnstile, req);
  await resendSignUpCode(email);
  return Response.json({ ok: true });
});
