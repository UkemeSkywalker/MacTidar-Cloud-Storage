import { notFound, route } from "@/server/errors";
import { resolveLink } from "@/server/linkAccess";
import { zipStatus } from "@/server/zips";

export const GET = route<{ params: Promise<{ token: string; jobId: string }> }>(async (_req, { params }) => {
  const { token, jobId } = await params;
  if ((await resolveLink(token)).state !== "open") throw notFound("This shared link is no longer available.");
  return Response.json(await zipStatus(jobId, `link:${token}`));
});
