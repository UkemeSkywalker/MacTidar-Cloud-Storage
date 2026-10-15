import { z } from "zod";
import { getTeamSettings, setQuota, updateTeamFields } from "@/server/db/team";
import { badRequest, route } from "@/server/errors";
import { requireAdmin } from "@/server/session";
import { formatBytes } from "@/lib/format";

const GB = 1024 ** 3;
const body = z.object({
  quotaGb: z.number().min(1).max(10_000).optional(),
  maxFileGb: z.number().min(0.1).max(5_000).optional(),
  alerts: z.boolean().optional(),
});

export const PATCH = route(async (req) => {
  const admin = await requireAdmin();
  const { quotaGb, maxFileGb, alerts } = body.parse(await req.json());
  const team = await getTeamSettings(admin.workspaceId);
  if (quotaGb !== undefined) {
    const next = Math.round(quotaGb * GB);
    if (next !== team.quotaBytes && !(await setQuota(admin.workspaceId, team.quotaBytes, next))) {
      throw badRequest(`The limit can't go below what's already used (${formatBytes(team.quotaBytes - team.freeBytes)}).`);
    }
  }
  await updateTeamFields(admin.workspaceId, {
    maxFileBytes: maxFileGb !== undefined ? Math.round(maxFileGb * GB) : undefined,
    alertPercent: alerts === undefined ? undefined : alerts ? 80 : 0,
  });
  return Response.json({ ok: true });
});
