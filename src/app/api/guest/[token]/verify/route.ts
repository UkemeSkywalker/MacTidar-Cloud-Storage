import { z } from "zod";
import { route } from "@/server/errors";
import { verifyGuestCode } from "@/server/guests";

const body = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.") });

export const POST = route<{ params: Promise<{ token: string }> }>(async (req, { params }) => {
  const { code } = body.parse(await req.json());
  await verifyGuestCode((await params).token, code);
  return Response.json({ ok: true });
});
