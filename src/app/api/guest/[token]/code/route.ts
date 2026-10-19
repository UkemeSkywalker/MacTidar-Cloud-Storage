import { z } from "zod";
import { route } from "@/server/errors";
import { sendGuestCode } from "@/server/guests";
import { requireHuman } from "@/server/turnstile";

const body = z.object({ turnstile: z.string().max(4096).optional() });

// Emails a one-time code to the invited address (never to an address the visitor types).
export const POST = route<{ params: Promise<{ token: string }> }>(async (req, { params }) => {
  const { turnstile } = body.parse(await req.json());
  await requireHuman(turnstile, req);
  return Response.json(await sendGuestCode((await params).token));
});
