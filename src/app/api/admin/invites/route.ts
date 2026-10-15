import { z } from "zod";
import { findMemberByEmail } from "@/server/db/users";
import { listInvites } from "@/server/db/invites";
import { conflict, route } from "@/server/errors";
import { inviteMember } from "@/server/invitations";
import { requireAdmin } from "@/server/session";

const body = z.object({
  emails: z.array(z.string().trim().toLowerCase().email("One of the email addresses isn't valid.")).min(1).max(20),
  role: z.enum(["ADMIN", "MEMBER"]),
  message: z.string().trim().max(250).optional(),
});

export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const { emails, role, message } = body.parse(await req.json());
  const unique = [...new Set(emails)];

  const pending = new Set((await listInvites()).map((i) => i.email));
  for (const email of unique) {
    if (await findMemberByEmail(email)) throw conflict(`${email} is already a member.`);
    if (pending.has(email)) throw conflict(`${email} already has a pending invite. Use "Resend invite" instead.`);
  }

  const results = [];
  for (const email of unique) results.push(await inviteMember(admin, { email, role, message }));
  return Response.json({ results });
});
