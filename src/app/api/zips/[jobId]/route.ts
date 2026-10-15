import { route } from "@/server/errors";
import { requireUser } from "@/server/session";
import { zipStatus } from "@/server/zips";

export const GET = route<{ params: Promise<{ jobId: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  return Response.json(await zipStatus((await params).jobId, user.id));
});
