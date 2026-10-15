import { z } from "zod";
import { route } from "@/server/errors";
import { createFolder } from "@/server/files";
import { requireUser } from "@/server/session";

const body = z.object({ parentId: z.string().min(1), name: z.string() });

export const POST = route(async (req) => {
  const user = await requireUser();
  const { parentId, name } = body.parse(await req.json());
  return Response.json(await createFolder(user, parentId, name));
});
