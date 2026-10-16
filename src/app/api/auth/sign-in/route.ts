import { z } from "zod";
import { ensurePersonalWorkspace, provisionAccount } from "@/server/accounts";
import { verifyPassword } from "@/server/cognito";
import { listUserWorkspaces } from "@/server/db/workspaces";
import { HttpError, route } from "@/server/errors";
import { setActiveWorkspace, startSession } from "@/server/session";

const body = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean().default(true),
});

export const POST = route(async (req) => {
  const { email, password, remember } = body.parse(await req.json());
  const id = await verifyPassword(email, password);
  // First sign-in after self sign-up creates the profile; everyone gets a personal workspace.
  const { user, isNew } = await provisionAccount(id);
  if (user.status !== "ACTIVE") throw new HttpError(403, "This account is deactivated. Contact support.", "disabled");
  const personal = await ensurePersonalWorkspace(user);
  const active = (await listUserWorkspaces(user.id)).filter((w) => w.membership.status === "ACTIVE" && w.workspace.status === "ACTIVE");
  if (!active.length) throw new HttpError(403, "Your account isn't part of an active workspace. Contact support.", "no_workspace");
  if (isNew) await setActiveWorkspace(personal.workspace.id);
  await startSession(user, remember);
  return Response.json({ ok: true, redirect: isNew ? "/onboarding" : null });
});
