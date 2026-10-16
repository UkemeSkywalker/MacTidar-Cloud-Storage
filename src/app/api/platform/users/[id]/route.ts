import { z } from "zod";
import { bumpSessionVersion, getUser, updateUser } from "@/server/db/users";
import { badRequest, notFound, route } from "@/server/errors";
import { isPlatformAdmin, requirePlatformAdmin } from "@/server/session";

const body = z.object({ status: z.enum(["ACTIVE", "DISABLED"]) });

export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  await requirePlatformAdmin();
  const { status } = body.parse(await req.json());
  const user = await getUser((await params).id);
  if (!user) throw notFound("This user no longer exists.");
  if (isPlatformAdmin(user)) throw badRequest("Platform admin accounts can't be disabled here.");
  await updateUser(user.id, { status });
  // Disabling signs them out everywhere.
  if (status === "DISABLED") await bumpSessionVersion(user.id);
  return Response.json({ ok: true });
});
