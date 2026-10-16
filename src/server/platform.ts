import "server-only";
import { config } from "./config";
import { listReports, setReportStatus, type AbuseReport, type AbuseStatus } from "./db/abuse";
import { getItem } from "./db/items";
import { getLink, setLinkSuspended } from "./db/links";
import { getUser, listAllUsers } from "./db/users";
import { getWorkspace, listAllWorkspaces, updateWorkspace } from "./db/workspaces";
import { sendEmail } from "./email";
import { badRequest, notFound } from "./errors";
import { removeItemAsPlatform } from "./files";
import type { Viewer } from "./session";

const DAY = 86400_000;

export async function platformOverview() {
  const [users, workspaces, open] = await Promise.all([listAllUsers(), listAllWorkspaces(), listReports("OPEN")]);
  const since = (days: number) => Date.now() - days * DAY;
  const byType = (t: "PERSONAL" | "COMPANY") => workspaces.filter((w) => w.type === t);

  // Sign-ups per day for the last 30 days (oldest first).
  const signups = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(Date.now() - (29 - i) * DAY).toISOString().slice(0, 10);
    return { day, count: users.filter((u) => u.createdAt?.slice(0, 10) === day).length };
  });

  return {
    users: {
      total: users.length,
      newThisWeek: users.filter((u) => new Date(u.createdAt).getTime() >= since(7)).length,
      active30d: users.filter((u) => u.lastActiveAt && new Date(u.lastActiveAt).getTime() >= since(30)).length,
      disabled: users.filter((u) => u.status !== "ACTIVE").length,
    },
    workspaces: {
      total: workspaces.length,
      personal: byType("PERSONAL").length,
      company: byType("COMPANY").length,
      newThisMonth: workspaces.filter((w) => new Date(w.createdAt).getTime() >= since(30)).length,
      suspended: workspaces.filter((w) => w.status === "SUSPENDED").length,
    },
    storage: {
      usedBytes: workspaces.reduce((s, w) => s + (w.usedBytes ?? 0), 0),
      quotaBytes: workspaces.reduce((s, w) => s + (w.quotaBytes ?? 0), 0),
      personalBytes: byType("PERSONAL").reduce((s, w) => s + (w.usedBytes ?? 0), 0),
      companyBytes: byType("COMPANY").reduce((s, w) => s + (w.usedBytes ?? 0), 0),
    },
    openReports: open.length,
    autoDisabled: new Set(open.map((r) => r.token)).size,
    signups,
    topWorkspaces: [...workspaces].sort((a, b) => (b.usedBytes ?? 0) - (a.usedBytes ?? 0)).slice(0, 5),
  };
}

export async function reportsByStatus(status: AbuseStatus) {
  const reports = await listReports(status);
  // Attach the current link and workspace state so reviewers see what's live.
  const tokens = [...new Set(reports.map((r) => r.token))];
  const wsIds = [...new Set(reports.map((r) => r.workspaceId))];
  const [links, workspaces, owners, items] = await Promise.all([
    Promise.all(tokens.map(getLink)),
    Promise.all(wsIds.map(getWorkspace)),
    Promise.all([...new Set(reports.map((r) => r.ownerId))].map(getUser)),
    Promise.all([...new Set(reports.map((r) => r.itemId))].map(getItem)),
  ]);
  const linkBy = new Map(links.filter(Boolean).map((l) => [l!.token, l!]));
  const wsBy = new Map(workspaces.filter(Boolean).map((w) => [w!.id, w!]));
  const ownerBy = new Map(owners.filter(Boolean).map((u) => [u!.id, u!]));
  const itemBy = new Map(items.filter(Boolean).map((i) => [i!.id, i!]));
  const countByToken = new Map<string, number>();
  for (const r of reports) countByToken.set(r.token, (countByToken.get(r.token) ?? 0) + 1);
  return reports.map((r) => {
    const link = linkBy.get(r.token);
    const ws = wsBy.get(r.workspaceId);
    const owner = ownerBy.get(r.ownerId);
    const item = itemBy.get(r.itemId);
    return {
      ...r,
      reportsForLink: countByToken.get(r.token) ?? 1,
      linkState: !link ? "deleted" : link.suspendedAt ? "disabled" : "active",
      linkSuspendedReason: link?.suspendedReason,
      itemState: !item ? "deleted" : item.status === "ACTIVE" ? "active" : "trashed",
      itemType: item?.type,
      itemSize: item?.size ?? 0,
      workspaceName: ws?.name ?? "Deleted workspace",
      workspaceType: ws?.type,
      workspaceStatus: ws?.status,
      ownerName: owner?.name,
      ownerEmail: owner?.email,
    };
  });
}

export type AbuseAction = "disable_link" | "delete_item" | "suspend_workspace" | "dismiss";

const RESOLUTION: Record<AbuseAction, string> = {
  disable_link: "Link disabled",
  delete_item: "Content removed",
  suspend_workspace: "Workspace suspended",
  dismiss: "Dismissed, no action needed",
};

// Acts on a report. Every open report for the same link is closed with it.
export async function actOnReport(admin: Viewer, report: AbuseReport, action: AbuseAction) {
  const link = await getLink(report.token);
  const item = await getItem(report.itemId);
  const owner = await getUser(report.ownerId);

  if (action === "disable_link") {
    if (!link) throw badRequest("This link was already deleted.");
    await setLinkSuspended(link.token, `Disabled by MacTidar after review (${report.reason.toLowerCase()})`);
  } else if (action === "delete_item") {
    if (!item) throw badRequest("This file was already deleted.");
    await removeItemAsPlatform(admin, item);
  } else if (action === "suspend_workspace") {
    const ws = await getWorkspace(report.workspaceId);
    if (!ws) throw notFound("This workspace no longer exists.");
    await suspendWorkspace(admin, ws.id, true);
  } else if (link?.suspendedAt) {
    // Dismissing a false report turns an automatically disabled link back on.
    await setLinkSuspended(link.token, null);
  }

  const status = action === "dismiss" ? "DISMISSED" : "RESOLVED";
  const open = (await listReports("OPEN")).filter((r) => r.token === report.token || r.id === report.id);
  await Promise.all(open.map((r) => setReportStatus(r.id, status, `${RESOLUTION[action]} by ${admin.email}`)));

  if (owner && action !== "dismiss" && action !== "suspend_workspace") {
    const what = action === "disable_link" ? `The public link to "${report.itemName}" has been disabled` : `"${report.itemName}" has been removed from your workspace`;
    notify(owner.email, `${what}`, [
      `Hi ${owner.name.split(" ")[0]},`,
      ``,
      `${what} after we received reports that it breaks our Terms of Service (${report.reason.toLowerCase()}).`,
      ``,
      `If you think this is a mistake, reply to this email or write to admin@mactidar.com.`,
      ``,
      `MacTidar Cloud`,
    ]);
  }
  return { closed: open.length };
}

export async function suspendWorkspace(admin: Viewer, workspaceId: string, suspend: boolean) {
  const ws = await getWorkspace(workspaceId);
  if (!ws) throw notFound("This workspace no longer exists.");
  if (suspend && admin.workspaces.some((w) => w.id === ws.id)) throw badRequest("You can't suspend a workspace you belong to.");
  await updateWorkspace(ws.id, { status: suspend ? "SUSPENDED" : "ACTIVE" });
  const owner = await getUser(ws.ownerId);
  if (owner) {
    notify(
      owner.email,
      suspend ? `Your workspace "${ws.name}" has been suspended` : `Your workspace "${ws.name}" is active again`,
      suspend
        ? [`Hi ${owner.name.split(" ")[0]},`, ``, `We've suspended "${ws.name}" on MacTidar Cloud because of a breach of our Terms of Service. Members can't open it and its public links are switched off.`, ``, `If you think this is a mistake, reply to this email or write to admin@mactidar.com.`, ``, `MacTidar Cloud`]
        : [`Hi ${owner.name.split(" ")[0]},`, ``, `"${ws.name}" is active again. You and your members can sign in as usual: ${config().APP_URL}/sign-in`, ``, `MacTidar Cloud`],
    );
  }
}

function notify(to: string, subject: string, lines: string[]) {
  const text = lines.join("\n");
  const html = `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111827">${lines
    .map((l) => (l ? `<p style="margin:0 0 4px">${l.replace(/[<>&]/g, "")}</p>` : "<br>"))
    .join("")}</div>`;
  sendEmail(to, subject, text, html).catch((e) => console.error(e));
}
