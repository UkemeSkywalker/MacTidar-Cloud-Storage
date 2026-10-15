import { z } from "zod";
import { route } from "@/server/errors";
import { recordRecent } from "@/server/recent";
import { requireUser } from "@/server/session";
import { completeUpload } from "@/server/uploads";
import { checkUsageAlert } from "@/server/usage";

const body = z.object({
  parts: z.array(z.object({ partNumber: z.number().int().positive(), etag: z.string().min(1) })).optional(),
});

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const user = await requireUser();
  const { parts } = body.parse(await req.json());
  const item = await completeUpload(user, (await params).id, parts);
  recordRecent(user.id, item.workspaceId, item.id, "uploaded").catch(() => {});
  await checkUsageAlert(item.workspaceId).catch((e) => console.error(e));
  return Response.json({ id: item.id, name: item.name });
});
