import { route } from "@/server/errors";
import { requireUser } from "@/server/session";
import { accessList } from "@/server/sharing";

export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await requireUser();
  const { item, myRole, entries, members, link } = await accessList(user, (await params).id);
  return Response.json({
    item: { id: item.id, name: item.name, type: item.type, size: item.size ?? 0 },
    myRole,
    entries,
    members,
    link,
  });
});
