import { z } from "zod";
import { route } from "@/server/errors";
import { requireAccess } from "@/server/permissions";
import { requireUser } from "@/server/session";
import { startZip } from "@/server/zips";

const body = z.object({ folderId: z.string().min(1) });

export const POST = route(async (req) => {
  const user = await requireUser();
  const { item } = await requireAccess(user, body.parse(await req.json()).folderId, "VIEWER");
  return Response.json(await startZip(item, user.id));
});
