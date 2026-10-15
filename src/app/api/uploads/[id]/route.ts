import { route } from "@/server/errors";
import { requireUser } from "@/server/session";
import { cancelUpload } from "@/server/uploads";

export const DELETE = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  await cancelUpload(user, (await params).id);
  return Response.json({ ok: true });
});
