import "server-only";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { fileKind } from "@/components/files/FileIcon";
import { ddb, TABLE } from "./db/table";
import { getTeamSettings, updateTeamFields } from "./db/team";
import { listWorkspaceMembers } from "./db/workspaces";
import { config } from "./config";
import { sendEmail } from "./email";
import { formatBytes } from "@/lib/format";

const GROUPS = {
  video: ["video", "audio"],
  image: ["image"],
  docs: ["pdf", "doc", "sheet", "slides", "text", "code"],
  archive: ["archive"],
} as const;

// Team-wide numbers for the admin Storage page (one scan; fine at this size).
export async function storageStats(workspaceId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const byType = { video: 0, image: 0, docs: 0, archive: 0, other: 0 };
  let files = 0, uploadsThisMonth = 0, bytesThisMonth = 0, uploadsThisWeek = 0, links = 0, expiringLinks = 0, trashBytes = 0;
  const soon = Math.floor(Date.now() / 1000) + 72 * 3600;
  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb().send(
      new ScanCommand({
        TableName: TABLE(),
        FilterExpression: "workspaceId = :ws AND ((SK = :meta AND #t = :file) OR begins_with(PK, :link))",
        ExpressionAttributeNames: { "#t": "type", "#s": "status", "#n": "name" },
        ExpressionAttributeValues: { ":meta": "META", ":file": "file", ":link": "LINK#", ":ws": workspaceId },
        ProjectionExpression: "PK, #t, #s, #n, mimeType, size, createdAt, expiresAt",
        ExclusiveStartKey: start,
      }),
    );
    for (const it of res.Items ?? []) {
      if ((it.PK as string).startsWith("LINK#")) {
        const exp = it.expiresAt as number | undefined;
        if (!exp || exp > Date.now() / 1000) {
          links++;
          if (exp && exp < soon) expiringLinks++;
        }
        continue;
      }
      if (it.status === "TRASHED") {
        trashBytes += it.size ?? 0;
        continue;
      }
      if (it.status !== "ACTIVE") continue;
      files++;
      const kind = fileKind("file", it.name, it.mimeType);
      const group = (Object.keys(GROUPS) as (keyof typeof GROUPS)[]).find((g) => (GROUPS[g] as readonly string[]).includes(kind)) ?? "other";
      byType[group] += it.size ?? 0;
      if (it.createdAt >= monthStart) {
        uploadsThisMonth++;
        bytesThisMonth += it.size ?? 0;
      }
      if (it.createdAt >= weekAgo) uploadsThisWeek++;
    }
    start = res.LastEvaluatedKey;
  } while (start);
  return { files, byType, uploadsThisMonth, bytesThisMonth, uploadsThisWeek, links, expiringLinks, trashBytes };
}

// Emails admins once when team usage crosses the alert threshold.
export async function checkUsageAlert(workspaceId: string) {
  const team = await getTeamSettings(workspaceId);
  if (!team.alertPercent || team.alertSentAt) return;
  const pct = (team.usedBytes / team.quotaBytes) * 100;
  if (pct < team.alertPercent) return;
  await updateTeamFields(workspaceId, { alertSentAt: new Date().toISOString() });
  const admins = (await listWorkspaceMembers(workspaceId)).filter((m) => m.role === "ADMIN" && m.status === "ACTIVE");
  for (const a of admins) {
    await sendEmail(
      a.email,
      `MacTidar Cloud storage is ${Math.round(pct)}% full`,
      `Your team has used ${formatBytes(team.usedBytes)} of ${formatBytes(team.quotaBytes, 0)} (${Math.round(pct)}%).\n\nIncrease the limit or clean up files: ${config().APP_URL}/admin/storage`,
      `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#111827">
        <p style="font-size:18px;font-weight:600">Team storage is ${Math.round(pct)}% full</p>
        <p>Your team has used <b>${formatBytes(team.usedBytes)}</b> of ${formatBytes(team.quotaBytes, 0)}.</p>
        <p><a href="${config().APP_URL}/admin/storage" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Manage storage</a></p>
      </div>`,
    );
  }
}

// The viewer's largest active files in their current workspace, for the storage-full dialog.
export async function largestFiles(workspaceId: string, ownerId: string, limit = 5) {
  const files: { id: string; name: string; size: number; parentId: string | null; mimeType?: string }[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb().send(
      new ScanCommand({
        TableName: TABLE(),
        FilterExpression: "workspaceId = :ws AND ownerId = :o AND SK = :meta AND #t = :file AND #s = :active",
        ExpressionAttributeNames: { "#t": "type", "#s": "status", "#n": "name" },
        ExpressionAttributeValues: { ":ws": workspaceId, ":o": ownerId, ":meta": "META", ":file": "file", ":active": "ACTIVE" },
        ProjectionExpression: "id, #n, size, parentId, mimeType",
        ExclusiveStartKey: start,
      }),
    );
    for (const it of res.Items ?? []) files.push({ id: it.id, name: it.name, size: it.size ?? 0, parentId: it.parentId ?? null, mimeType: it.mimeType });
    start = res.LastEvaluatedKey;
  } while (start);
  return files.sort((a, b) => b.size - a.size).slice(0, limit);
}
