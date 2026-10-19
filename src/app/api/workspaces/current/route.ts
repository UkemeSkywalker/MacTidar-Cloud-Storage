import { z } from "zod";
import { getWorkspace, updateWorkspace } from "@/server/db/workspaces";
import { badRequest, forbidden, route } from "@/server/errors";
import { requireUser } from "@/server/session";

const domain = z
  .string()
  .trim()
  .toLowerCase()
  .transform((d) => d.replace(/^@/, ""))
  .pipe(z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/, "Enter domains like designcorp.com."));

const body = z.object({
  // Personal workspaces: the owner's sharing switch (public links and outside people).
  sharingEnabled: z.boolean().optional(),
  // Company workspaces: the admin's outside-sharing switch and optional domain allowlist.
  externalSharing: z.boolean().optional(),
  allowedDomains: z.array(domain).max(50).optional(),
});

export const PATCH = route(async (req) => {
  const user = await requireUser();
  const input = body.parse(await req.json());
  const ws = await getWorkspace(user.workspaceId);
  if (!ws) throw badRequest("Workspace not found.");
  if (input.sharingEnabled !== undefined) {
    if (ws.type !== "PERSONAL") throw badRequest("This setting only applies to personal workspaces.");
    if (ws.ownerId !== user.id) throw forbidden();
    await updateWorkspace(ws.id, { sharingEnabled: input.sharingEnabled });
  }
  if (input.externalSharing !== undefined || input.allowedDomains !== undefined) {
    if (ws.type !== "COMPANY") throw badRequest("This setting only applies to company workspaces.");
    if (user.role !== "ADMIN") throw forbidden("Only workspace admins can change this.");
    await updateWorkspace(ws.id, {
      externalSharing: input.externalSharing,
      allowedDomains: input.allowedDomains ? [...new Set(input.allowedDomains)] : undefined,
    });
  }
  return Response.json({ ok: true });
});
