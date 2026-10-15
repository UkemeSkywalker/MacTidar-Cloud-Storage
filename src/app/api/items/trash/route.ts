import { z } from "zod";
import { route } from "@/server/errors";
import { trashItems } from "@/server/files";
import { requireUser } from "@/server/session";

const body = z.object({ ids: z.array(z.string().min(1)).min(1).max(200) });

export const POST = route(async (req) => {
  const user = await requireUser();
  const { ids } = body.parse(await req.json());
  await trashItems(user, ids);
  return Response.json({ ok: true });
});
