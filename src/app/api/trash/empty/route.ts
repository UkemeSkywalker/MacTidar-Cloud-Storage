import { route } from "@/server/errors";
import { emptyTrash } from "@/server/files";
import { requireUser } from "@/server/session";

export const POST = route(async () => {
  const user = await requireUser();
  return Response.json({ deleted: await emptyTrash(user) });
});
