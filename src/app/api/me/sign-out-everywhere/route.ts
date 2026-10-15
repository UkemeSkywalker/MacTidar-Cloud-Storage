import { bumpSessionVersion, getUser } from "@/server/db/users";
import { route } from "@/server/errors";
import { requireUser, startSession } from "@/server/session";

// Ends every other session, then signs this browser back in.
export const POST = route(async () => {
  const user = await requireUser();
  await bumpSessionVersion(user.id);
  const fresh = await getUser(user.id);
  if (fresh) await startSession(fresh, true);
  return Response.json({ ok: true });
});
