import { getTeamSettings } from "@/server/db/team";
import { route } from "@/server/errors";
import { emptyableTrashBytes } from "@/server/files";
import { requireUser } from "@/server/session";
import { largestFiles } from "@/server/usage";

// Numbers for the storage-full dialog.
export const GET = route(async () => {
  const user = await requireUser();
  const [team, trashBytes, largest] = await Promise.all([getTeamSettings(user.workspaceId), emptyableTrashBytes(user), largestFiles(user.workspaceId, user.id)]);
  return Response.json({
    workspaceName: user.workspaceName,
    workspaceType: user.workspaceType,
    isAdmin: user.role === "ADMIN",
    rootFolderId: user.rootFolderId,
    usedBytes: team.usedBytes,
    quotaBytes: team.quotaBytes,
    freeBytes: team.freeBytes,
    trashBytes,
    largest,
  });
});
