import { z } from "zod";
import { route } from "@/server/errors";
import { moveItems } from "@/server/files";
import { requireUser } from "@/server/session";

const body = z.object({ ids: z.array(z.string().min(1)).min(1).max(200), targetId: z.string().min(1) });

export const POST = route(async (req) => {
  const user = await requireUser();
  const { ids, targetId } = body.parse(await req.json());
  return Response.json({ moved: await moveItems(user, ids, targetId) });
});
