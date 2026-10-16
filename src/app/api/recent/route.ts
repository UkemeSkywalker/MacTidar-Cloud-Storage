import { route } from "@/server/errors";
import { clearRecent } from "@/server/recent";
import { requireUser } from "@/server/session";

export const DELETE = route(async () => {
  const user = await requireUser();
  await clearRecent(user.workspaceId, user.id);
  return Response.json({ ok: true });
});
