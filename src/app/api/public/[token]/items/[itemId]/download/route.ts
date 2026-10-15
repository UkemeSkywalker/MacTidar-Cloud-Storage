import { forbidden, notFound, route } from "@/server/errors";
import { itemInLink, resolveLink } from "@/server/linkAccess";
import { presignGet } from "@/server/storage";

// Downloads/previews for people outside the team, scoped to the linked item.
export const GET = route<{ params: Promise<{ token: string; itemId: string }> }>(async (req, { params }) => {
  const { token, itemId } = await params;
  const resolved = await resolveLink(token);
  if (resolved.state !== "open") throw notFound("This shared link is no longer available.");
  const item = await itemInLink(resolved.root, itemId);
  if (!item || item.type !== "file" || !item.s3Key) throw notFound();
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  if (!inline && !resolved.link.allowDownload) throw forbidden("Downloads are turned off for this link.");
  return Response.redirect(await presignGet(item.s3Key, item.name, item.mimeType, inline), 302);
});
