import { z } from "zod";
import { notFound, route } from "@/server/errors";
import { requireGuest } from "@/server/guests";
import { itemInLink } from "@/server/linkAccess";
import { startZip } from "@/server/zips";

const body = z.object({ folderId: z.string().min(1).optional() });

export const POST = route<{ params: Promise<{ token: string }> }>(async (req, { params }) => {
  const { token } = await params;
  const guest = await requireGuest(token);
  const { folderId } = body.parse(await req.json());
  const folder = folderId ? await itemInLink(guest.root, folderId) : guest.root;
  if (!folder || folder.type !== "folder") throw notFound();
  return Response.json(await startZip(folder, `guest:${token}`));
});
