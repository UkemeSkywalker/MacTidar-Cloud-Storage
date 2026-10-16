import "server-only";
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getItem, type Item } from "./db/items";
import { getLink, isExpired, type PublicLink } from "./db/links";
import { secrets } from "./secrets";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashLinkPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 32);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function checkLinkPassword(password: string, stored: string) {
  const [, salt, hash] = stored.split("$");
  const actual = await scrypt(password, Buffer.from(salt, "base64"), 32);
  const expected = Buffer.from(hash, "base64");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const cookieName = (token: string) => `mt_link_${token}`;

// Ties an unlock to the current password, so changing the password re-locks the link.
async function unlockValue(link: PublicLink) {
  const { sessionSecret } = await secrets();
  return createHmac("sha256", sessionSecret).update(`${link.token}:${link.passwordHash ?? ""}`).digest("base64url");
}

export async function setUnlocked(link: PublicLink) {
  (await cookies()).set(cookieName(link.token), await unlockValue(link), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 3600,
  });
}

export async function isUnlocked(link: PublicLink) {
  if (!link.passwordHash) return true;
  const given = (await cookies()).get(cookieName(link.token))?.value;
  if (!given) return false;
  const expected = await unlockValue(link);
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export type LinkState =
  | { state: "missing" }
  | { state: "suspended" }
  | { state: "expired"; link: PublicLink; root: Item | null }
  | { state: "locked"; link: PublicLink; root: Item }
  | { state: "open"; link: PublicLink; root: Item };

export async function resolveLink(token: string): Promise<LinkState> {
  const link = await getLink(token);
  if (!link) return { state: "missing" };
  const root = await getItem(link.itemId);
  if (!root || root.status !== "ACTIVE") return { state: "missing" };
  if (link.suspendedAt) return { state: "suspended" };
  if (isExpired(link)) return { state: "expired", link, root };
  if (!(await isUnlocked(link))) return { state: "locked", link, root };
  return { state: "open", link, root };
}

// An item is reachable through a link if it is the linked item or inside it.
export async function itemInLink(root: Item, itemId: string): Promise<Item | null> {
  if (itemId === root.id) return root;
  const item = await getItem(itemId);
  if (!item || item.status !== "ACTIVE" || item.rootId !== root.rootId || !item.path.startsWith(root.path)) return null;
  return item;
}
