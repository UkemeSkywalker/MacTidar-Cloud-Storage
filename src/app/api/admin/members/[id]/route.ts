import { z } from "zod";
import { getMembership, listWorkspaceMembers, updateMembership } from "@/server/db/workspaces";
import { badRequest, notFound, route } from "@/server/errors";
import { requireAdmin } from "@/server/session";

const body = z.object({
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

// Changes a member's role or access within the admin's current workspace.
export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { role, status } = body.parse(await req.json());
  const member = await getMembership(admin.workspaceId, id);
  if (!member) throw notFound("Member not found.");
  if (id === admin.id && (role === "MEMBER" || status === "DISABLED")) {
    throw badRequest("You can't remove your own admin access or deactivate yourself.");
  }
  if ((role === "MEMBER" || status === "DISABLED") && member.role === "ADMIN") {
    const admins = (await listWorkspaceMembers(admin.workspaceId)).filter((m) => m.role === "ADMIN" && m.status === "ACTIVE");
    if (admins.length <= 1) throw badRequest("The workspace needs at least one admin.");
  }
  await updateMembership(admin.workspaceId, id, { role, status });
  return Response.json({ ok: true });
});
