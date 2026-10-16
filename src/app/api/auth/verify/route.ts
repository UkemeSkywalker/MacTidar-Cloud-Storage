import { z } from "zod";
import { confirmSignUp } from "@/server/cognito";
import { route } from "@/server/errors";

const body = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const POST = route(async (req) => {
  const { email, code } = body.parse(await req.json());
  await confirmSignUp(email, code);
  return Response.json({ ok: true });
});
