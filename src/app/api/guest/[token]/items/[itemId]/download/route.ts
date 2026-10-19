import { notFound, route } from "@/server/errors";
import { requireGuest } from "@/server/guests";
import { itemInLink } from "@/server/linkAccess";
import { presignGet } from "@/server/storage";

// Downloads/previews for a verified guest, limited to the shared item.
export const GET = route<{ params: Promise<{ token: string; itemId: string }> }>(async (req, { params }) => {
  const { token, itemId } = await params;
  const guest = await requireGuest(token);
  const item = await itemInLink(guest.root, itemId);
  if (!item || item.type !== "file" || !item.s3Key) throw notFound();
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  return Response.redirect(await presignGet(item.s3Key, item.name, item.mimeType, inline), 302);
});
