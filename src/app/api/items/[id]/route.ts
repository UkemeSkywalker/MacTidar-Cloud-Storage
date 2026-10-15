import { z } from "zod";
import { route } from "@/server/errors";
import { renameItem } from "@/server/files";
import { requireUser } from "@/server/session";

const body = z.object({ name: z.string() });

export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const user = await requireUser();
  const { name } = body.parse(await req.json());
  await renameItem(user, (await params).id, name);
  return Response.json({ ok: true });
});
