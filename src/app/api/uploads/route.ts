import { z } from "zod";
import { route } from "@/server/errors";
import { requireUser } from "@/server/session";
import { startUpload } from "@/server/uploads";

const body = z.object({
  parentId: z.string().min(1),
  name: z.string().min(1),
  size: z.number().int().nonnegative(),
  type: z.string().max(200).default(""),
});

export const POST = route(async (req) => {
  const user = await requireUser();
  return Response.json(await startUpload(user, body.parse(await req.json())));
});
