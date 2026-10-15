import { z } from "zod";
import { verifyPassword } from "@/server/cognito";
import { getUser } from "@/server/db/users";
import { listUserWorkspaces } from "@/server/db/workspaces";
import { HttpError, route } from "@/server/errors";
import { startSession } from "@/server/session";

const body = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean().default(true),
});

export const POST = route(async (req) => {
  const { email, password, remember } = body.parse(await req.json());
  const id = await verifyPassword(email, password);
  const user = await getUser(id);
  if (!user || user.status !== "ACTIVE") {
    throw new HttpError(403, "This account is deactivated. Contact your admin.", "disabled");
  }
  const workspaces = (await listUserWorkspaces(user.id)).filter((w) => w.membership.status === "ACTIVE" && w.workspace.status === "ACTIVE");
  if (!workspaces.length) {
    throw new HttpError(403, "Your account isn't part of an active workspace. Contact your admin.", "no_workspace");
  }
  await startSession(user, remember);
  return Response.json({ ok: true });
});
