import { z } from "zod";
import { getWorkspace, GB } from "@/server/db/workspaces";
import { setQuota } from "@/server/db/team";
import { badRequest, notFound, route } from "@/server/errors";
import { suspendWorkspace } from "@/server/platform";
import { requirePlatformAdmin } from "@/server/session";

const body = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  quotaGb: z.number().int().min(1).max(10_000).optional(),
});

export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await requirePlatformAdmin();
  const { status, quotaGb } = body.parse(await req.json());
  const ws = await getWorkspace((await params).id);
  if (!ws) throw notFound("This workspace no longer exists.");
  if (quotaGb !== undefined && quotaGb * GB !== ws.quotaBytes) {
    if (!(await setQuota(ws.id, ws.quotaBytes, quotaGb * GB))) throw badRequest("The quota can't be lower than what this workspace already uses.");
  }
  if (status && status !== ws.status) await suspendWorkspace(admin, ws.id, status === "SUSPENDED");
  return Response.json({ ok: true });
});
