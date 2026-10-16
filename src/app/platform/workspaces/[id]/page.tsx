import { notFound } from "next/navigation";
import { listReports } from "@/server/db/abuse";
import { getUser } from "@/server/db/users";
import { getWorkspace, listWorkspaceMembers } from "@/server/db/workspaces";
import { requirePagePlatformAdmin } from "@/server/session";
import { WorkspaceDetail } from "./WorkspaceDetail";

export default async function PlatformWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePagePlatformAdmin();
  const ws = await getWorkspace((await params).id);
  if (!ws) notFound();
  const [owner, members, reports] = await Promise.all([
    getUser(ws.ownerId),
    listWorkspaceMembers(ws.id),
    Promise.all((["OPEN", "RESOLVED", "DISMISSED"] as const).map(listReports)).then((all) => all.flat().filter((r) => r.workspaceId === ws.id)),
  ]);
  return (
    <WorkspaceDetail
      ws={{
        id: ws.id,
        name: ws.name,
        type: ws.type,
        status: ws.status,
        createdAt: ws.createdAt,
        usedBytes: ws.usedBytes ?? 0,
        quotaBytes: ws.quotaBytes,
        sharing: ws.type === "COMPANY" ? ws.externalSharing : !!ws.sharingEnabled,
      }}
      isMine={admin.workspaces.some((w) => w.id === ws.id)}
      owner={owner ? { id: owner.id, name: owner.name, email: owner.email, createdAt: owner.createdAt } : null}
      members={members
        .map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role, usedBytes: m.usedBytes ?? 0, lastActiveAt: m.lastActiveAt, active: m.status === "ACTIVE" && m.userStatus === "ACTIVE" }))
        .sort((a, b) => b.usedBytes - a.usedBytes)}
      reports={reports
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((r) => ({ id: r.id, itemName: r.itemName, reason: r.reason, status: r.status, createdAt: r.createdAt, resolution: r.resolution }))}
    />
  );
}
