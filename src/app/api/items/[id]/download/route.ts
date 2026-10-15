import { badRequest, route } from "@/server/errors";
import { requireAccess } from "@/server/permissions";
import { recordRecent } from "@/server/recent";
import { requireUser } from "@/server/session";
import { presignGet } from "@/server/storage";

// Redirects to a short-lived S3 URL. ?inline=1 opens it in the browser (previews).
export const GET = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const user = await requireUser();
  const { item } = await requireAccess(user, (await params).id, "VIEWER");
  if (item.type !== "file" || !item.s3Key) throw badRequest("Folders can't be downloaded directly.");
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  recordRecent(user.id, item.id, inline ? "opened" : "downloaded").catch(() => {});
  return Response.redirect(await presignGet(item.s3Key, item.name, item.mimeType, inline), 302);
});
