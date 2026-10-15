import "server-only";
import { config } from "./config";
import { createInvite, type Invite } from "./db/invites";
import type { Role } from "./db/users";
import type { Viewer } from "./session";
import { inviteEmail, sendEmail } from "./email";

export type InviteResult = { email: string; sent: boolean; link: string };

// Creates an invite and emails it. The link is returned too, because SES may be
// in sandbox mode and unable to reach new addresses yet.
export async function inviteMember(
  admin: Viewer,
  input: { email: string; role: Role; message?: string },
): Promise<InviteResult> {
  const { token } = await createInvite({
    workspaceId: admin.workspaceId,
    email: input.email,
    role: input.role,
    invitedBy: admin.id,
    invitedByName: admin.name,
  });
  const link = `${config().APP_URL}/invite/${token}`;
  const mail = inviteEmail({ inviterName: admin.name, link, message: input.message });
  const sent = await sendEmail(input.email, mail.subject, mail.text, mail.html);
  return { email: input.email, sent, link };
}

export type { Invite };
