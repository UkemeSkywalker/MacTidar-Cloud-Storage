import { z } from "zod";
import { route } from "@/server/errors";
import { shareOutside, unshareOutside } from "@/server/guests";
import { requireUser } from "@/server/session";

const add = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  note: z.string().trim().max(500).optional(),
});
const remove = z.object({ email: z.string().trim().toLowerCase().email() });

// Share with someone outside the workspace (view-only, by email).
export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const user = await requireUser();
  const { email, note } = add.parse(await req.json());
  return Response.json(await shareOutside(user, (await params).id, email, note || undefined));
});

export const DELETE = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const user = await requireUser();
  const { email } = remove.parse(await req.json());
  await unshareOutside(user, (await params).id, email);
  return Response.json({ ok: true });
});
