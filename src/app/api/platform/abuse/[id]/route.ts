import { z } from "zod";
import { getReport } from "@/server/db/abuse";
import { notFound, route } from "@/server/errors";
import { actOnReport } from "@/server/platform";
import { requirePlatformAdmin } from "@/server/session";

const body = z.object({ action: z.enum(["disable_link", "delete_item", "suspend_workspace", "dismiss"]) });

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await requirePlatformAdmin();
  const { action } = body.parse(await req.json());
  const report = await getReport((await params).id);
  if (!report) throw notFound("This report no longer exists.");
  return Response.json(await actOnReport(admin, report, action));
});
