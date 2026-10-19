import { route } from "@/server/errors";
import { requireGuest } from "@/server/guests";
import { zipStatus } from "@/server/zips";

export const GET = route<{ params: Promise<{ token: string; jobId: string }> }>(async (_req, { params }) => {
  const { token, jobId } = await params;
  await requireGuest(token);
  return Response.json(await zipStatus(jobId, `guest:${token}`));
});
