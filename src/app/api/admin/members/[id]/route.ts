import { z } from "zod";
import { setCognitoUserEnabled } from "@/server/cognito";
import { bumpSessionVersion, getUser, listMembers, updateUser } from "@/server/db/users";
import { badRequest, notFound, route } from "@/server/errors";
import { requireAdmin } from "@/server/session";

const body = z.object({
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { role, status } = body.parse(await req.json());
  const member = await getUser(id);
  if (!member) throw notFound("Member not found.");
  if (member.id === admin.id && (role === "MEMBER" || status === "DISABLED")) {
    throw badRequest("You can't remove your own admin access or deactivate yourself.");
  }
  if (role === "MEMBER" && member.role === "ADMIN") {
    const admins = (await listMembers()).filter((m) => m.role === "ADMIN" && m.status === "ACTIVE");
    if (admins.length <= 1) throw badRequest("The team needs at least one admin.");
  }

  if (status && status !== member.status) {
    await setCognitoUserEnabled(member.id, status === "ACTIVE");
    if (status === "DISABLED") await bumpSessionVersion(member.id);
  }
  await updateUser(member.id, { role, status });
  return Response.json({ ok: true });
});
