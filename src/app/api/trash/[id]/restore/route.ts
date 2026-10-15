import { route } from "@/server/errors";
import { restoreItem } from "@/server/files";
import { requireUser } from "@/server/session";

export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  await restoreItem(user, (await params).id);
  return Response.json({ ok: true });
});
