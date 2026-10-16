"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { btn, Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { card, PageHeader } from "@/components/platform/PlatformShell";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";
import { formatBytes, timeAgo } from "@/lib/format";
import type { reportsByStatus } from "@/server/platform";

type Report = Awaited<ReturnType<typeof reportsByStatus>>[number];
type Action = "disable_link" | "delete_item" | "suspend_workspace" | "dismiss";

const REASON: Record<string, { label: string; icon: string; tone: string }> = {
  COPYRIGHT: { label: "Copyright infringement", icon: "copyright", tone: "bg-error-container text-danger" },
  MALWARE: { label: "Malware or phishing", icon: "bug_report", tone: "bg-error-container text-danger" },
  ILLEGAL: { label: "Illegal or harmful", icon: "gavel", tone: "bg-error-container text-danger" },
  SPAM: { label: "Spam", icon: "campaign", tone: "bg-[#fef3c7] text-[#92400e]" },
  OTHER: { label: "Something else", icon: "help", tone: "bg-surface-container-high text-on-surface-variant" },
};

const CONFIRM: Record<Action, { title: string; body: string; button: string; done: string }> = {
  disable_link: { title: "Disable this link?", body: "The public link stops working for everyone. The file stays in the owner's workspace. The owner is emailed.", button: "Disable link", done: "Link disabled" },
  delete_item: { title: "Delete this content?", body: "The reported file or folder is deleted permanently, including everything inside it. This can't be undone. The owner is emailed.", button: "Delete permanently", done: "Content deleted" },
  suspend_workspace: { title: "Suspend the whole workspace?", body: "Every member loses access and all of the workspace's public links stop working. Nothing is deleted and you can reinstate it later.", button: "Suspend workspace", done: "Workspace suspended" },
  dismiss: { title: "Dismiss these reports?", body: "Use this when the content is fine. If the link was disabled automatically, it's switched back on.", button: "Dismiss", done: "Reports dismissed" },
};

export function AbuseQueue({ tab, counts, reports }: { tab: "open" | "resolved" | "dismissed"; counts: Record<string, number>; reports: Report[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [reason, setReason] = useState("ALL");
  const [pending, setPending] = useState<{ report: Report; action: Action } | null>(null);
  const [busy, setBusy] = useState(false);

  // One card per link; extra reports for the same link are shown inside it.
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = reports
      .filter((r) => reason === "ALL" || r.reason === reason)
      .filter((r) => !needle || [r.itemName, r.token, r.workspaceName, r.ownerEmail ?? "", r.reporterEmail ?? "", r.details ?? ""].some((v) => v.toLowerCase().includes(needle)));
    const map = new Map<string, Report[]>();
    for (const r of filtered) map.set(r.token, [...(map.get(r.token) ?? []), r]);
    return [...map.values()];
  }, [reports, q, reason]);

  async function run() {
    if (!pending) return;
    setBusy(true);
    try {
      await api(`/api/platform/abuse/${pending.report.id}`, { body: { action: pending.action } });
      toast(CONFIRM[pending.action].done);
      setPending(null);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader crumb={<>Trust &amp; safety <Icon name="chevron_right" className="text-[16px]" /> Abuse reports</>} title="Abuse reports" subtitle="Reports from people viewing public links. A link reported by 3 people is disabled automatically until you review it.">
        <div className={`${card} flex items-center gap-3 px-4 py-3`}>
          <Icon name="shield" className="text-[22px] text-danger" />
          <div>
            <p className="font-title-md text-title-md">Auto-disable on</p>
            <p className="font-label-sm text-label-sm text-text-secondary">After 3 reports per link</p>
          </div>
        </div>
      </PageHeader>

      <div className="mb-space-md flex gap-1 overflow-x-auto rounded-full bg-surface-container-low p-1 sm:w-fit">
        {(["open", "resolved", "dismissed"] as const).map((t) => (
          <Link key={t} href={`/platform/abuse?tab=${t}`} className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 font-title-md text-title-md capitalize ${tab === t ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
            {t}
            <span className={`rounded-full px-1.5 font-label-sm text-label-sm ${t === "open" && counts.open ? "bg-danger text-white" : "bg-surface-container-high text-on-surface-variant"}`}>{counts[t]}</span>
          </Link>
        ))}
      </div>

      <div className={`${card} mb-space-md flex flex-col gap-3 p-4 lg:flex-row lg:items-center`}>
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search file names, workspaces, emails or details…" className="h-10 w-full rounded-lg bg-surface-container-low pl-10 pr-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/20" />
        </div>
        <div className="flex flex-wrap gap-1">
          {["ALL", ...Object.keys(REASON)].map((r) => (
            <button key={r} onClick={() => setReason(r)} className={`rounded-full px-3 py-1 font-label-md text-label-md ${reason === r ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-text-secondary hover:text-text-primary"}`}>
              {r === "ALL" ? "All" : REASON[r].label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 && (
        <div className={`${card} flex flex-col items-center p-12 text-center`}>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant">
            <Icon name="verified_user" className="text-[32px]" />
          </div>
          <p className="font-headline-sm text-headline-sm text-text-primary">{tab === "open" ? "Nothing to review" : `No ${tab} reports`}</p>
          <p className="font-body-md text-body-md text-text-secondary">{tab === "open" ? "New reports show up here and are emailed to admin@mactidar.com." : "Reports you act on are kept here for your records."}</p>
        </div>
      )}

      <div className="space-y-space-md">
        {groups.map((g) => (
          <ReportCard key={g[0].token} reports={g} open={tab === "open"} onAction={(action) => setPending({ report: g[0], action })} />
        ))}
      </div>

      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending ? CONFIRM[pending.action].title : ""}
        footer={
          pending && (
            <>
              <button className={btn.secondary} onClick={() => setPending(null)}>Cancel</button>
              <button className={pending.action === "dismiss" ? btn.primary : btn.danger} disabled={busy} onClick={run}>
                {busy ? "Working…" : CONFIRM[pending.action].button}
              </button>
            </>
          )
        }
      >
        {pending && (
          <>
            <p className="mb-3 font-body-md text-body-md text-text-secondary">{CONFIRM[pending.action].body}</p>
            <p className="rounded-lg bg-surface-container-low p-3 font-body-md text-body-md">
              <span className="font-title-md">{pending.report.itemName}</span> in {pending.report.workspaceName}
            </p>
          </>
        )}
      </Dialog>
    </>
  );
}

function ReportCard({ reports, open, onAction }: { reports: Report[]; open: boolean; onAction: (a: Action) => void }) {
  const r = reports[0];
  const [expanded, setExpanded] = useState(true);
  const reasons = [...new Set(reports.map((x) => x.reason))];
  const urgent = reports.length >= 3 || reasons.includes("MALWARE") || reasons.includes("ILLEGAL");

  return (
    <article className={`${card} overflow-hidden ${open && urgent ? "border-t-4 border-danger" : ""}`}>
      <button onClick={() => setExpanded((e) => !e)} className="flex w-full flex-wrap items-center gap-2 px-5 pt-4 text-left">
        {reasons.map((reason) => (
          <span key={reason} className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-label-md text-label-md ${REASON[reason].tone}`}>
            <Icon name={REASON[reason].icon} className="text-[14px]" /> {REASON[reason].label}
          </span>
        ))}
        {open && urgent && <span className="rounded-full bg-danger px-2 py-0.5 font-label-md text-label-md text-white">Urgent</span>}
        <span className="font-body-sm text-body-sm text-text-secondary">
          · {reports.length} report{reports.length === 1 ? "" : "s"} · latest {timeAgo(r.createdAt).toLowerCase()}
        </span>
        <Icon name={expanded ? "expand_less" : "expand_more"} className="ml-auto text-[20px] text-on-surface-variant" />
      </button>

      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <Fact icon={r.itemType === "folder" ? "folder" : "description"} label="Reported item" value={r.itemName} sub={r.itemState === "active" ? (r.itemType === "folder" ? "Folder" : formatBytes(r.itemSize)) : r.itemState === "deleted" ? "Deleted" : "In trash"} danger={r.itemState !== "active"} />
        <Fact
          icon="link"
          label="Public link"
          value={`/s/${r.token}`}
          mono
          sub={r.linkState === "disabled" ? (r.linkSuspendedReason ?? "Disabled") : r.linkState === "deleted" ? "Link deleted" : "Active"}
          danger={r.linkState !== "active"}
        />
        <Fact icon="domain" label="Workspace" value={r.workspaceName} sub={`${r.ownerName ?? "Unknown"} · ${r.ownerEmail ?? ""}${r.workspaceStatus === "SUSPENDED" ? " · suspended" : ""}`} href={`/platform/workspaces/${r.workspaceId}`} danger={r.workspaceStatus === "SUSPENDED"} />
        <Fact icon="person" label="Reported by" value={reports.map((x) => x.reporterEmail).filter(Boolean).join(", ") || "Anonymous"} sub={`${reports.length} report${reports.length === 1 ? "" : "s"}`} />
      </div>

      {expanded && (
        <div className="space-y-2 px-5 pb-4">
          {reports.map((x) => (
            <div key={x.id} className="rounded-xl bg-surface-container-low p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2 font-label-md text-label-md text-text-secondary">
                <span className="font-semibold text-text-primary">{REASON[x.reason].label}</span>· {timeAgo(x.createdAt)}
                {x.reporterEmail && <>· {x.reporterEmail}</>}
                <span className="ml-auto font-mono">{x.id.slice(-8).toUpperCase()}</span>
              </div>
              <p className={`font-body-md text-body-md ${x.details ? "text-text-primary" : "italic text-text-secondary"}`}>{x.details ? `"${x.details}"` : "No details given."}</p>
              {x.resolution && <p className="mt-1 font-body-sm text-body-sm text-text-secondary">{x.resolution} · {timeAgo(x.resolvedAt)}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
        {r.linkState !== "deleted" && r.itemState === "active" && (
          <a href={`/s/${r.token}`} target="_blank" rel="noreferrer" className={btn.secondary}>
            <Icon name="visibility" className="text-[18px]" /> Review content
          </a>
        )}
        {open && (
          <>
            <span className="flex-1" />
            {r.linkState === "active" && (
              <button onClick={() => onAction("disable_link")} className="inline-flex h-10 items-center gap-2 rounded-full px-4 font-title-md text-title-md text-[#b45309] hover:bg-[#fef3c7]">
                <Icon name="link_off" className="text-[18px]" /> Disable link
              </button>
            )}
            {r.linkState === "disabled" && (
              <button onClick={() => onAction("disable_link")} className="inline-flex h-10 items-center gap-2 rounded-full px-4 font-title-md text-title-md text-[#b45309] hover:bg-[#fef3c7]">
                <Icon name="lock" className="text-[18px]" /> Keep link disabled
              </button>
            )}
            {r.workspaceStatus === "ACTIVE" && (
              <button onClick={() => onAction("suspend_workspace")} className="inline-flex h-10 items-center gap-2 rounded-full bg-error-container px-4 font-title-md text-title-md text-danger hover:bg-[#fecaca]">
                <Icon name="block" className="text-[18px]" /> Suspend workspace
              </button>
            )}
            {r.itemState !== "deleted" && (
              <button onClick={() => onAction("delete_item")} className={btn.danger}>
                <Icon name="delete_forever" className="text-[18px]" /> Delete content
              </button>
            )}
            <button onClick={() => onAction("dismiss")} className={btn.text}>
              <Icon name="close" className="text-[18px]" /> Dismiss
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function Fact({ icon, label, value, sub, danger, mono, href }: { icon: string; label: string; value: string; sub?: string; danger?: boolean; mono?: boolean; href?: string }) {
  const v = <span className={`block truncate font-title-md text-title-md text-text-primary ${mono ? "font-mono text-[13px]" : ""}`}>{value}</span>;
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-surface-container-low p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-on-surface-variant shadow-sm">
        <Icon name={icon} className="text-[20px]" />
      </span>
      <span className="min-w-0">
        <span className="block font-label-sm text-label-sm uppercase tracking-wider text-text-secondary">{label}</span>
        {href ? <Link href={href} className="hover:underline">{v}</Link> : v}
        {sub && <span className={`block truncate font-body-sm text-body-sm ${danger ? "text-danger" : "text-text-secondary"}`}>{sub}</span>}
      </span>
    </div>
  );
}
