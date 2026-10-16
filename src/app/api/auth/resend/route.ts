import { z } from "zod";
import { resendSignUpCode } from "@/server/cognito";
import { route } from "@/server/errors";

const body = z.object({ email: z.string().trim().toLowerCase().email() });

export const POST = route(async (req) => {
  await resendSignUpCode(body.parse(await req.json()).email);
  return Response.json({ ok: true });
});
