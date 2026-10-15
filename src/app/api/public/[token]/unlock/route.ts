import { z } from "zod";
import { getLink, isExpired, isLocked, recordFailedAttempt } from "@/server/db/links";
import { HttpError, notFound, route } from "@/server/errors";
import { checkLinkPassword, setUnlocked } from "@/server/linkAccess";

const body = z.object({ password: z.string().min(1, "Enter the password.").max(200) });

export const POST = route<{ params: Promise<{ token: string }> }>(async (req, { params }) => {
  const link = await getLink((await params).token);
  if (!link || isExpired(link)) throw notFound("This shared link is no longer available.");
  if (!link.passwordHash) return Response.json({ ok: true });
  if (isLocked(link)) throw new HttpError(429, "Too many wrong attempts. Try again in 15 minutes.", "locked");
  const { password } = body.parse(await req.json());
  if (!(await checkLinkPassword(password, link.passwordHash))) {
    const nowLocked = await recordFailedAttempt(link);
    throw new HttpError(
      nowLocked ? 429 : 401,
      nowLocked ? "Too many wrong attempts. Try again in 15 minutes." : "Incorrect password. Please try again or contact the owner.",
      "bad_password",
    );
  }
  await setUnlocked(link);
  return Response.json({ ok: true });
});
