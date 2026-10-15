import "server-only";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import { aws } from "./aws";
import { config } from "./config";

// Returns false instead of throwing, so callers can fall back (e.g. show a copyable link).
export async function sendEmail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  try {
    await aws().ses.send(
      new SendEmailCommand({
        FromEmailAddress: `MacTidar Cloud <${config().SES_FROM_EMAIL}>`,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject },
            Body: { Text: { Data: text }, Html: { Data: html } },
          },
        },
      }),
    );
    return true;
  } catch (err) {
    console.error("sendEmail failed", err);
    return false;
  }
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function inviteEmail(input: { inviterName: string; link: string; message?: string }) {
  const subject = `${input.inviterName} invited you to MacTidar Cloud`;
  const text = [
    `${input.inviterName} invited you to join the MacTidar team on MacTidar Cloud.`,
    input.message ? `\n"${input.message}"\n` : "",
    `Set your password and join: ${input.link}`,
    "",
    "This invite expires in 7 days.",
  ].join("\n");
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#111827">
  <p style="font-size:18px;font-weight:600">${escape(input.inviterName)} invited you to join the MacTidar team</p>
  ${input.message ? `<p style="color:#6B7280;border-left:3px solid #E5E7EB;padding-left:12px">${escape(input.message)}</p>` : ""}
  <p><a href="${input.link}" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Accept invitation</a></p>
  <p style="color:#6B7280;font-size:13px">This invite expires in 7 days. If the button doesn't work, paste this link into your browser:<br>${input.link}</p>
</div>`;
  return { subject, text, html };
}
