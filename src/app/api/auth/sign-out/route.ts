import { route } from "@/server/errors";
import { endSession } from "@/server/session";

export const POST = route(async () => {
  await endSession();
  return Response.json({ ok: true });
});
