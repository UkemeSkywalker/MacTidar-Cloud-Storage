import { z } from "zod";
import { updateUser } from "@/server/db/users";
import { route } from "@/server/errors";
import { requireUser } from "@/server/session";

const body = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80).optional(),
  notifyShares: z.boolean().optional(),
});

export const PATCH = route(async (req) => {
  const user = await requireUser();
  await updateUser(user.id, body.parse(await req.json()));
  return Response.json({ ok: true });
});
