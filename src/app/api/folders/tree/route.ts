import { z } from "zod";
import { route } from "@/server/errors";
import { createFolderTree } from "@/server/files";
import { requireUser } from "@/server/session";

const body = z.object({ parentId: z.string().min(1), paths: z.array(z.string().min(1).max(1024)).min(1).max(2000) });

// Creates the folders for an uploaded folder; returns { folders: { path: id } }.
export const POST = route(async (req) => {
  const user = await requireUser();
  const { parentId, paths } = body.parse(await req.json());
  return Response.json({ folders: await createFolderTree(user, parentId, paths) });
});
