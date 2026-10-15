import { z } from "zod";
import { route } from "@/server/errors";
import { renameItem } from "@/server/files";
import { recordRecent } from "@/server/recent";
import { requireUser } from "@/server/session";

const body = z.object({ name: z.string() });

export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const user = await requireUser();
  const { name } = body.parse(await req.json());
  const id = (await params).id;
  await renameItem(user, id, name);
  recordRecent(user.id, user.workspaceId, id, "renamed").catch(() => {});
  return Response.json({ ok: true });
});
