import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { config } from "./config";
import { getItem, type Item } from "./db/items";
import {
  clearGuestCode,
  countGuestCodeAttempt,
  createGuestShare,
  deleteGuestShare,
  getGuestCode,
  getGuestShare,
  getGuestShareFor,
  listGuestShares,
  saveGuestCode,
  type GuestShare,
} from "./db/guests";
import { findUserByEmail, getUser } from "./db/users";
import { getMembership, getWorkspace, type Workspace } from "./db/workspaces";
import { sendEmail } from "./email";
import { badRequest, forbidden, HttpError, notFound } from "./errors";
import { requireAccess } from "./permissions";
import { secrets } from "./secrets";
import { currentUser, type Viewer } from "./session";

// ---------- Policy: may this workspace (and this member) share outside?

export type OutsidePolicy =
  | { allowed: true; allowedDomains: string[] }
  | { allowed: false; reason: "admin_off" | "member_off" | "personal_off" | "suspended" };

// Company: the admin allows it, then each member turns it on for themselves.
// Personal: the owner's "Turn on sharing" switch covers it.
export async function outsidePolicy(ws: Workspace, userId: string): Promise<OutsidePolicy> {
  if (ws.status !== "ACTIVE") return { allowed: false, reason: "suspended" };
  if (ws.type === "PERSONAL") return ws.sharingEnabled ? { allowed: true, allowedDomains: [] } : { allowed: false, reason: "personal_off" };
  if (!ws.externalSharing) return { allowed: false, reason: "admin_off" };
  const m = await getMembership(ws.id, userId);
  if (!m || m.status !== "ACTIVE" || !m.outsideSharing) return { allowed: false, reason: "member_off" };
  return { allowed: true, allowedDomains: ws.allowedDomains ?? [] };
}

const domainOf = (email: string) => email.split("@")[1]?.toLowerCase() ?? "";
const domainAllowed = (email: string, allowed: string[]) => !allowed.length || allowed.includes(domainOf(email));

const BLOCKED: Record<Exclude<OutsidePolicy, { allowed: true }>["reason"], string> = {
  admin_off: "Sharing outside this workspace is turned off by your workspace admin.",
  member_off: "Turn on sharing outside this workspace for yourself first.",
  personal_off: "Turn on sharing for your personal workspace first.",
  suspended: "This workspace is suspended.",
};

// ---------- Sharing with outside people

export async function outsidePeople(itemId: string) {
  const shares = await listGuestShares(itemId);
  const sharers = new Map((await Promise.all([...new Set(shares.map((s) => s.sharedBy))].map(getUser))).filter(Boolean).map((u) => [u!.id, u!.name]));
  return shares.map((s) => ({ email: s.email, sharedByName: sharers.get(s.sharedBy) ?? "A former member", createdAt: s.createdAt }));
}

export async function shareOutside(user: Viewer, itemId: string, rawEmail: string, note?: string) {
  const email = rawEmail.trim().toLowerCase();
  const { item } = await requireAccess(user, itemId, "EDITOR");
  if (!item.parentId) throw badRequest("Share the folders inside instead of the top-level folder itself.");
  const ws = await getWorkspace(item.workspaceId);
  if (!ws) throw notFound();
  const policy = await outsidePolicy(ws, user.id);
  if (!policy.allowed) throw forbidden(BLOCKED[policy.reason]);
  if (!domainAllowed(email, policy.allowedDomains)) {
    throw forbidden(`Your workspace only allows sharing with ${policy.allowedDomains.map((d) => `@${d}`).join(", ")} addresses.`);
  }
  if (email === user.email) throw badRequest("That's your own email address.");
  const existingUser = await findUserByEmail(email);
  if (existingUser && (await getMembership(ws.id, existingUser.id))?.status === "ACTIVE") {
    throw badRequest(ws.type === "COMPANY" ? `${email} is already in ${ws.name} and can see everything in Team Files.` : `${email} is already in this workspace.`);
  }
  const share = (await getGuestShareFor(item.id, email)) ?? (await createGuestShare({ itemId: item.id, workspaceId: ws.id, email, sharedBy: user.id }));
  const sent = await sendEmail(email, ...guestInviteEmail({ from: user.name, item, link: `${config().APP_URL}/g/${share.token}`, note }));
  return { email, emailed: sent };
}

export async function unshareOutside(user: Viewer, itemId: string, email: string) {
  await requireAccess(user, itemId, "EDITOR");
  await deleteGuestShare(itemId, email.trim().toLowerCase());
}

// ---------- Guest access

const GUEST_COOKIE = "mt_guest";
const GUEST_DAYS = 7;

async function sign(data: string) {
  const { sessionSecret } = await secrets();
  return createHmac("sha256", sessionSecret).update(`guest:${data}`).digest("base64url");
}

async function guestEmail(): Promise<string | null> {
  const raw = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!raw) return null;
  const [data, sig] = raw.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(await sign(data));
  if (expected.length !== Buffer.from(sig).length || !timingSafeEqual(expected, Buffer.from(sig))) return null;
  const { email, exp } = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as { email: string; exp: number };
  return exp * 1000 > Date.now() ? email : null;
}

async function startGuestSession(email: string) {
  const data = Buffer.from(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + GUEST_DAYS * 86400 })).toString("base64url");
  (await cookies()).set(GUEST_COOKIE, `${data}.${await sign(data)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_DAYS * 86400,
  });
}

export type GuestState =
  | { state: "missing" }
  | { state: "blocked" }
  | { state: "verify"; share: GuestShare; item: Item; sharerName: string }
  | { state: "open"; share: GuestShare; root: Item; sharerName: string; viewer: string; signedIn: boolean };

// Whether `token` currently grants access, and to whom. Re-checked on every
// request, so turning sharing off or deleting the item takes effect at once.
export async function resolveGuest(token: string): Promise<GuestState> {
  const share = await getGuestShare(token);
  if (!share) return { state: "missing" };
  const [item, ws, sharer] = await Promise.all([getItem(share.itemId), getWorkspace(share.workspaceId), getUser(share.sharedBy)]);
  if (!item || item.status !== "ACTIVE" || !ws) return { state: "missing" };
  const policy = await outsidePolicy(ws, share.sharedBy);
  if (!policy.allowed || !domainAllowed(share.email, policy.allowedDomains)) return { state: "blocked" };
  const sharerName = sharer?.name ?? "Someone";
  // Signed in to MacTidar with the invited address: no code needed.
  const user = await currentUser();
  if (user && user.email === share.email) return { state: "open", share, root: item, sharerName, viewer: share.email, signedIn: true };
  if ((await guestEmail()) === share.email) return { state: "open", share, root: item, sharerName, viewer: share.email, signedIn: false };
  return { state: "verify", share, item, sharerName };
}

export async function requireGuest(token: string) {
  const g = await resolveGuest(token);
  if (g.state !== "open") throw notFound("This share isn't available.");
  return g;
}

const codeHash = async (email: string, code: string) => sign(`code:${email}:${code}`);

export async function sendGuestCode(token: string) {
  const share = await getGuestShare(token);
  if (!share) throw notFound("This share isn't available.");
  const live = await getGuestCode(share.email);
  if (live && Date.now() - new Date(live.sentAt).getTime() < 45_000) throw new HttpError(429, "We just sent a code. Wait a moment before asking for another.", "too_soon");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await saveGuestCode(share.email, await codeHash(share.email, code));
  const ok = await sendEmail(share.email, ...guestCodeEmail(code));
  if (!ok) throw new HttpError(502, "We couldn't send the code. Please try again.", "email_failed");
  return { email: share.email };
}

export async function verifyGuestCode(token: string, code: string) {
  const share = await getGuestShare(token);
  if (!share) throw notFound("This share isn't available.");
  const live = await getGuestCode(share.email);
  if (!live) throw badRequest("That code has expired. Ask for a new one.", "expired");
  if (live.attempts >= 5) throw new HttpError(429, "Too many wrong codes. Ask for a new one.", "too_many");
  const expected = Buffer.from(live.codeHash);
  const given = Buffer.from(await codeHash(share.email, code.trim()));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    await countGuestCodeAttempt(share.email);
    throw badRequest("That code isn't right. Check the email and try again.", "wrong_code");
  }
  await clearGuestCode(share.email);
  await startGuestSession(share.email);
}

// ---------- Emails

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function guestInviteEmail({ from, item, link, note }: { from: string; item: Item; link: string; note?: string }): [string, string, string] {
  const what = item.type === "folder" ? "a folder" : "a file";
  const subject = `${from} shared "${item.name}" with you`;
  const text = [
    `${from} shared ${what} with you on MacTidar Cloud: ${item.name}`,
    note ? `\n"${note}"\n` : "",
    `Open it: ${link}`,
    "",
    "You'll confirm your email with a one-time code. You don't need an account.",
    "Only you can open this link, so please don't forward this email.",
  ].join("\n");
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#111827">
  <p style="font-size:16px"><b>${esc(from)}</b> shared ${what} with you</p>
  <p style="font-size:18px;font-weight:600">${esc(item.name)}</p>
  ${note ? `<p style="color:#6B7280;border-left:3px solid #E5E7EB;padding-left:12px">${esc(note)}</p>` : ""}
  <p><a href="${link}" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Open in MacTidar Cloud</a></p>
  <p style="color:#6B7280;font-size:13px">You'll confirm your email with a one-time code. You don't need an account. Only you can open this link, so please don't forward this email.</p>
</div>`;
  return [subject, text, html];
}

function guestCodeEmail(code: string): [string, string, string] {
  const subject = `Your MacTidar Cloud code: ${code}`;
  const text = `Your code is ${code}. It expires in 10 minutes. If you didn't ask for it, you can ignore this email.`;
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#111827">
  <p style="font-size:16px">Your MacTidar Cloud code is</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:6px">${code}</p>
  <p style="color:#6B7280;font-size:13px">It expires in 10 minutes. If you didn't ask for it, you can ignore this email.</p>
</div>`;
  return [subject, text, html];
}
