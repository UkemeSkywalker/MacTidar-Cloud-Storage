import { z } from "zod";
import { passwordSchema } from "@/lib/passwords";
import { signUp } from "@/server/cognito";
import { route } from "@/server/errors";
import { requireHuman } from "@/server/turnstile";

const body = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: passwordSchema,
  turnstile: z.string().max(4096).optional(),
  agree: z.literal(true, { message: "Please accept the Terms of Service and Privacy Policy." }),
});

export const POST = route(async (req) => {
  const { name, email, password, turnstile } = body.parse(await req.json());
  await requireHuman(turnstile, req);
  await signUp(email, password, name);
  return Response.json({ ok: true });
});
