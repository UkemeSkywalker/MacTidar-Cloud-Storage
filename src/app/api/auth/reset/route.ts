import { z } from "zod";
import { passwordSchema } from "@/lib/passwords";
import { confirmPasswordReset } from "@/server/cognito";
import { route } from "@/server/errors";

const body = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
  password: passwordSchema,
});

export const POST = route(async (req) => {
  const { email, code, password } = body.parse(await req.json());
  await confirmPasswordReset(email, code, password);
  return Response.json({ ok: true });
});
