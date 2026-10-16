import { getUser } from "@/server/db/users";
import { countMembers, listAllWorkspaces } from "@/server/db/workspaces";
import { WorkspacesView } from "./WorkspacesView";

export default async function PlatformWorkspacesPage() {
  const workspaces = await listAllWorkspaces();
  const owners = new Map((await Promise.all([...new Set(workspaces.map((w) => w.ownerId))].map(getUser))).filter(Boolean).map((u) => [u!.id, u!]));
  const members = await Promise.all(workspaces.map((w) => countMembers(w.id)));
  return (
    <WorkspacesView
      rows={workspaces.map((w, i) => ({
        id: w.id,
        name: w.name,
        type: w.type,
        status: w.status,
        usedBytes: w.usedBytes ?? 0,
        quotaBytes: w.quotaBytes,
        createdAt: w.createdAt,
        members: members[i],
        ownerName: owners.get(w.ownerId)?.name ?? "Unknown",
        ownerEmail: owners.get(w.ownerId)?.email ?? "",
      }))}
    />
  );
}
