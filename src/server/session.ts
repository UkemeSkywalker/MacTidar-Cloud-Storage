import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getUser, updateUser, type User } from "./db/users";
import { forbidden, unauthorized } from "./errors";
import { secrets } from "./secrets";

export const SESSION_COOKIE = "mt_session";
const REMEMBER_DAYS = 30;
const SHORT_HOURS = 12;

type Payload = { uid: string; ver: number; exp: number };

async function sign(data: string) {
  const { sessionSecret } = await secrets();
  return createHmac("sha256", sessionSecret).update(data).digest("base64url");
}

async function encode(payload: Payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${await sign(data)}`;
}

async function decode(token: string): Promise<Payload | null> {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(await sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as Payload;
  return payload.exp * 1000 > Date.now() ? payload : null;
}

export async function startSession(user: User, remember: boolean) {
  const ms = remember ? REMEMBER_DAYS * 86400_000 : SHORT_HOURS * 3600_000;
  const token = await encode({ uid: user.id, ver: user.sessionVersion, exp: Math.floor((Date.now() + ms) / 1000) });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Without "remember me" the cookie ends with the browser session.
    ...(remember ? { maxAge: ms / 1000 } : {}),
  });
  updateUser(user.id, { lastActiveAt: new Date().toISOString() }).catch(() => {});
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

// The signed-in, active user for this request, or null. Cached per request.
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await decode(token);
  if (!payload) return null;
  const user = await getUser(payload.uid);
  if (!user || user.status !== "ACTIVE" || user.sessionVersion !== payload.ver) return null;
  return user;
});

// For pages: redirect to sign-in when signed out.
export async function requirePageUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requirePageAdmin(): Promise<User> {
  const user = await requirePageUser();
  if (user.role !== "ADMIN") redirect("/files");
  return user;
}

// For API routes: throw 401/403 instead of redirecting.
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw forbidden("Only admins can do this.");
  return user;
}
