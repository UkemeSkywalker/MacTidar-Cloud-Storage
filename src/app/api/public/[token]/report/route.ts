import { createHmac } from "node:crypto";
import { z } from "zod";
import { config } from "@/server/config";
import { claimReportSlot, createReport, openReportsForLink } from "@/server/db/abuse";
import { getItem } from "@/server/db/items";
import { getLink, setLinkSuspended } from "@/server/db/links";
import { sendEmail } from "@/server/email";
import { HttpError, notFound, route } from "@/server/errors";
import { secrets } from "@/server/secrets";

const AUTO_DISABLE_AFTER = 3;

const body = z.object({
  reason: z.enum(["COPYRIGHT", "MALWARE", "SPAM", "ILLEGAL", "OTHER"]),
  details: z.string().trim().max(500).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email or leave it empty.").optional().or(z.literal("")),
  website: z.string().optional(), // honeypot: real people never fill this hidden field
});

const LABEL: Record<string, string> = {
  COPYRIGHT: "Copyright infringement",
  MALWARE: "Malware or phishing",
  SPAM: "Spam",
  ILLEGAL: "Illegal or harmful content",
  OTHER: "Something else",
};

// Anyone viewing a public link can report it.
export const POST = route<{ params: Promise<{ token: string }> }>(async (req, { params }) => {
  const { token } = await params;
  const input = body.parse(await req.json());
  if (input.website) return Response.json({ ok: true }); // silently drop bots
  const link = await getLink(token);
  const item = link ? await getItem(link.itemId) : null;
  if (!link || !item) throw notFound("This link no longer exists.");

  // CloudFront sets the viewer address itself; the first x-forwarded-for entry is client-controlled.
  const viewer = req.headers.get("cloudfront-viewer-address")?.replace(/:\d+$/, "");
  const ip = viewer || (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const { sessionSecret } = await secrets();
  const fingerprint = createHmac("sha256", sessionSecret).update(`${ip}|${token}`).digest("hex").slice(0, 32);
  if (!(await claimReportSlot(fingerprint))) throw new HttpError(429, "You've already reported this link. Our team will review it.", "duplicate");

  const report = await createReport({
    token,
    itemId: item.id,
    itemName: item.name,
    workspaceId: item.workspaceId,
    ownerId: item.ownerId,
    reason: input.reason,
    details: input.details || undefined,
    reporterEmail: input.email || undefined,
  });

  const count = await openReportsForLink(token);
  const disabled = count >= AUTO_DISABLE_AFTER && !link.suspendedAt;
  if (disabled) await setLinkSuspended(token, `Disabled automatically after ${count} reports`);

  sendEmail(
    "admin@mactidar.com",
    `${disabled ? "[Link disabled] " : ""}Abuse report: ${LABEL[input.reason]} — ${item.name}`,
    [
      `A public link was reported on MacTidar Cloud.`,
      ``,
      `Reason: ${LABEL[input.reason]}`,
      `Item: ${item.name}`,
      `Link: ${config().APP_URL}/s/${token}`,
      `Details: ${input.details || "—"}`,
      `Reporter email: ${input.email || "—"}`,
      `Open reports for this link: ${count}${disabled ? " — the link has been disabled automatically." : ""}`,
      ``,
      `Review it in the admin console: ${config().APP_URL}/platform/abuse`,
    ].join("\n"),
    `<pre style="font-family:Inter,Arial,sans-serif;white-space:pre-wrap">Report ${report.id}</pre>`.replace(
      `Report ${report.id}`,
      [`Reason: ${LABEL[input.reason]}`, `Item: ${item.name}`, `Link: ${config().APP_URL}/s/${token}`, `Details: ${(input.details || "—").replace(/[<>&]/g, "")}`, `Open reports: ${count}${disabled ? " (link disabled)" : ""}`].join("\n"),
    ),
  ).catch(() => {});

  return Response.json({ ok: true });
});
