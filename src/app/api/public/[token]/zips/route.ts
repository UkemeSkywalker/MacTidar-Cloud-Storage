import { z } from "zod";
import { forbidden, notFound, route } from "@/server/errors";
import { itemInLink, resolveLink } from "@/server/linkAccess";
import { startZip } from "@/server/zips";

const body = z.object({ folderId: z.string().min(1).optional() });

export const POST = route<{ params: Promise<{ token: string }> }>(async (req, { params }) => {
  const { token } = await params;
  const resolved = await resolveLink(token);
  if (resolved.state !== "open") throw notFound("This shared link is no longer available.");
  if (!resolved.link.allowDownload) throw forbidden("Downloads are turned off for this link.");
  const { folderId } = body.parse(await req.json());
  const folder = folderId ? await itemInLink(resolved.root, folderId) : resolved.root;
  if (!folder) throw notFound();
  return Response.json(await startZip(folder, `link:${token}`));
});
