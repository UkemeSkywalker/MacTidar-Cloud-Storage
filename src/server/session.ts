import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { config } from "./config";
import { getUser, updateUser, type User } from "./db/users";
import { listUserWorkspaces, type Role, type WorkspaceType } from "./db/workspaces";
import { forbidden, unauthorized } from "./errors";
import { secrets } from "./secrets";

export const SESSION_COOKIE = "mt_session";
export const WORKSPACE_COOKIE = "mt_ws";
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

// The signed-in user plus their membership in the active workspace.
export type Viewer = User & {
  workspaceId: string;
  workspaceName: string;
  workspaceType: WorkspaceType;
  role: Role;
  rootFolderId: string;
  // Set in company workspaces: everything under it is editable by every member.
  teamRootId?: string;
  usedBytes: number;
  workspaces: { id: string; name: string; type: WorkspaceType; role: Role; usedBytes: number; quotaBytes: number }[];
};

// The signed-in, active viewer for this request, or null. Cached per request.
export const currentUser = cache(async (): Promise<Viewer | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await decode(token);
  if (!payload) return null;
  // Both keyed by the user id, so fetch them together (each round trip to the data region counts).
  const [user, memberships] = await Promise.all([getUser(payload.uid), listUserWorkspaces(payload.uid)]);
  if (!user || user.status !== "ACTIVE" || user.sessionVersion !== payload.ver) return null;

  const all = memberships.filter((w) => w.membership.status === "ACTIVE" && w.workspace.status === "ACTIVE");
  if (!all.length) return null;
  const wanted = jar.get(WORKSPACE_COOKIE)?.value;
  const active = all.find((w) => w.workspace.id === wanted) ?? all[0];
  return {
    ...user,
    workspaceId: active.workspace.id,
    workspaceName: active.workspace.name,
    workspaceType: active.workspace.type,
    role: active.membership.role,
    rootFolderId: active.membership.rootFolderId,
    teamRootId: active.workspace.teamRootId,
    usedBytes: active.membership.usedBytes ?? 0,
    workspaces: all.map((w) => ({
      id: w.workspace.id,
      name: w.workspace.name,
      type: w.workspace.type,
      role: w.membership.role,
      usedBytes: w.workspace.usedBytes,
      quotaBytes: w.workspace.quotaBytes,
    })),
  };
});

export async function setActiveWorkspace(workspaceId: string) {
  (await cookies()).set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 86400,
  });
}

// For pages: redirect to sign-in when signed out.
export async function requirePageUser(): Promise<Viewer> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requirePageAdmin(): Promise<Viewer> {
  const user = await requirePageUser();
  if (user.role !== "ADMIN") redirect("/files");
  return user;
}

// Platform staff (config PLATFORM_ADMINS) can open /platform.
export function isPlatformAdmin(user: Pick<User, "email">) {
  const allowed = config().PLATFORM_ADMINS.split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(user.email.toLowerCase());
}

export async function requirePagePlatformAdmin(): Promise<Viewer> {
  const user = await requirePageUser();
  if (!isPlatformAdmin(user)) redirect("/files");
  return user;
}

export async function requirePlatformAdmin(): Promise<Viewer> {
  const user = await requireUser();
  if (!isPlatformAdmin(user)) throw forbidden("Only platform admins can do this.");
  return user;
}

// For API routes: throw 401/403 instead of redirecting.
export async function requireUser(): Promise<Viewer> {
  const user = await currentUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(): Promise<Viewer> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw forbidden("Only admins can do this.");
  return user;
}
