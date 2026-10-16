"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { btn, Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { card, StatusPill, TypePill, WsBadge } from "@/components/platform/PlatformShell";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";
import { formatBytes, formatDate, timeAgo } from "@/lib/format";

const GB = 1024 ** 3;
const REASON: Record<string, string> = { COPYRIGHT: "Copyright", MALWARE: "Malware / phishing", SPAM: "Spam", ILLEGAL: "Illegal / harmful", OTHER: "Other" };

export function WorkspaceDetail({
  ws,
  isMine,
  owner,
  members,
  reports,
}: {
  ws: { id: string; name: string; type: "PERSONAL" | "COMPANY"; status: "ACTIVE" | "SUSPENDED"; createdAt: string; usedBytes: number; quotaBytes: number; sharing: boolean };
  isMine: boolean;
  owner: { id: string; name: string; email: string; createdAt: string } | null;
  members: { id: string; name: string; email: string; role: string; usedBytes: number; lastActiveAt?: string; active: boolean }[];
  reports: { id: string; itemName: string; reason: string; status: string; createdAt: string; resolution?: string }[];
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState(String(Math.round(ws.quotaBytes / GB)));
  const suspended = ws.status === "SUSPENDED";
  const pct = ws.quotaBytes ? Math.min(100, (ws.usedBytes / ws.quotaBytes) * 100) : 0;
  const openReports = reports.filter((r) => r.status === "OPEN").length;

  async function patch(body: Record<string, unknown>, done: string) {
    setBusy(true);
    try {
      await api(`/api/platform/workspaces/${ws.id}`, { method: "PATCH", body });
      toast(done);
      setConfirm(false);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-space-md flex items-center gap-2 font-body-md text-body-md text-text-secondary">
        <Link href="/platform/workspaces" aria-label="Back" className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface shadow-sm hover:bg-surface-container-low">
          <Icon name="arrow_back" className="text-[18px]" />
        </Link>
        <Link href="/platform/workspaces" className="hover:text-text-primary">Workspaces</Link> / <span className="font-title-md text-text-primary">{ws.name}</span>
      </div>

      <section className={`${card} mb-space-md flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between`}>
        <div className="flex items-center gap-4">
          <span className="scale-125"><WsBadge name={ws.name} type={ws.type} suspended={suspended} /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg text-text-primary">{ws.name}</h1>
              <TypePill type={ws.type} />
              <StatusPill status={ws.status} />
            </div>
            <p className="mt-1 font-body-sm text-body-sm text-text-secondary">
              <span className="font-mono">{ws.id}</span> · created {formatDate(ws.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {owner && (
            <a href={`mailto:${owner.email}`} className={btn.secondary}>
              <Icon name="mail" className="text-[18px]" /> Email owner
            </a>
          )}
          {suspended ? (
            <button className={btn.primary} disabled={busy} onClick={() => patch({ status: "ACTIVE" }, `${ws.name} reinstated`)}>
              <Icon name="lock_open" className="text-[18px]" /> Reinstate workspace
            </button>
          ) : (
            <button className="inline-flex h-10 items-center gap-2 rounded-full bg-error-container px-5 font-title-md text-title-md text-danger hover:bg-[#fecaca] disabled:opacity-50" disabled={isMine} title={isMine ? "You belong to this workspace" : undefined} onClick={() => setConfirm(true)}>
              <Icon name="block" className="text-[18px]" /> Suspend workspace
            </button>
          )}
        </div>
      </section>

      {suspended && (
        <div className="mb-space-md flex items-start gap-3 rounded-xl bg-error-container/50 p-4 font-body-md text-body-md text-danger">
          <Icon name="gpp_bad" className="text-[20px]" /> This workspace is suspended. Members can&apos;t open it and all of its public links are switched off.
        </div>
      )}

      <div className="mb-space-md grid grid-cols-1 gap-space-md md:grid-cols-3">
        <div className={`${card} p-5`}>
          <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">Owner</p>
          {owner ? (
            <div className="flex items-center gap-3">
              <Avatar name={owner.name} id={owner.id} size="h-10 w-10 text-[14px]" />
              <div className="min-w-0">
                <p className="truncate font-title-md text-title-md text-text-primary">{owner.name}</p>
                <p className="truncate font-body-sm text-body-sm text-text-secondary">{owner.email}</p>
                <p className="font-body-sm text-body-sm text-text-secondary">Joined {formatDate(owner.createdAt)}</p>
              </div>
            </div>
          ) : (
            <p className="font-body-md text-body-md text-text-secondary">Owner account not found.</p>
          )}
        </div>
        <div className={`${card} p-5`}>
          <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">Storage</p>
          <p className="mb-2 text-[26px] font-semibold leading-none">
            {formatBytes(ws.usedBytes)} <span className="font-body-md text-body-md font-normal text-text-secondary">of {formatBytes(ws.quotaBytes, 0)}</span>
          </p>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
            <div className={`h-full rounded-full ${pct >= 90 ? "bg-danger" : pct >= 75 ? "bg-warning" : "bg-primary-container"}`} style={{ width: `${pct}%` }} />
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              patch({ quotaGb: Number(quota) }, `Quota set to ${quota} GB`);
            }}
          >
            <label className="font-body-sm text-body-sm text-text-secondary" htmlFor="quota">Quota</label>
            <input id="quota" type="number" min={1} max={10000} value={quota} onChange={(e) => setQuota(e.target.value)} className="h-9 w-20 rounded-lg bg-surface-container-low px-2 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/20" />
            <span className="font-body-sm text-body-sm text-text-secondary">GB</span>
            <button className="ml-auto rounded-full px-3 py-1.5 font-title-md text-label-md text-primary hover:bg-primary-soft disabled:opacity-40" disabled={busy || Number(quota) * GB === ws.quotaBytes || !Number(quota)}>
              Save
            </button>
          </form>
        </div>
        <div className={`${card} p-5`}>
          <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">At a glance</p>
          <ul className="space-y-2 font-body-md text-body-md">
            <li className="flex justify-between"><span className="text-text-secondary">Members</span><span>{members.length}</span></li>
            <li className="flex justify-between">
              <span className="text-text-secondary">{ws.type === "COMPANY" ? "Outside sharing" : "Sharing"}</span>
              <span>{ws.sharing ? "On" : "Off"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-text-secondary">Abuse reports</span>
              <span className={openReports ? "text-danger" : ""}>{reports.length ? `${reports.length} (${openReports} open)` : "None"}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-md xl:grid-cols-3">
        <section className={`${card} xl:col-span-2`}>
          <h2 className="p-5 pb-3 font-headline-sm text-headline-sm text-text-primary">Members</h2>
          <ul>
            {members.map((m) => (
              <li key={m.id} className={`flex items-center gap-3 border-t border-border px-5 py-3 ${m.active ? "" : "opacity-60"}`}>
                <Avatar name={m.name} id={m.id} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-title-md text-title-md text-text-primary">{m.name}</span>
                    {m.role === "ADMIN" && <span className="rounded bg-primary-soft px-1.5 font-label-sm text-label-sm text-primary">Admin</span>}
                    {!m.active && <span className="rounded bg-surface-container-high px-1.5 font-label-sm text-label-sm">Deactivated</span>}
                  </span>
                  <span className="block truncate font-body-sm text-body-sm text-text-secondary">{m.email}</span>
                </span>
                <span className="hidden text-right font-body-sm text-body-sm text-text-secondary sm:block">
                  {formatBytes(m.usedBytes)}
                  <span className="block">Active {timeAgo(m.lastActiveAt).toLowerCase()}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className={card}>
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-headline-sm text-headline-sm text-text-primary">Abuse reports</h2>
            {openReports > 0 && <Link href="/platform/abuse" className="font-title-md text-label-md text-primary hover:underline">Review</Link>}
          </div>
          {reports.length === 0 ? (
            <p className="flex items-center gap-2 px-5 pb-5 font-body-md text-body-md text-text-secondary">
              <Icon name="verified_user" className="text-[20px] text-tertiary" /> Clean record
            </p>
          ) : (
            <ul>
              {reports.map((r) => (
                <li key={r.id} className="border-t border-border px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-title-md text-title-md text-text-primary">{r.itemName}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 font-label-sm text-label-sm ${r.status === "OPEN" ? "bg-error-container text-danger" : "bg-surface-container-high text-on-surface-variant"}`}>{r.status.toLowerCase()}</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    {REASON[r.reason]} · {timeAgo(r.createdAt)}
                    {r.resolution ? ` · ${r.resolution}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Suspend ${ws.name}?`}
        icon={<div className="flex h-11 w-11 items-center justify-center rounded-full bg-error-container text-danger"><Icon name="block" className="text-[22px]" /></div>}
        footer={
          <>
            <button className={btn.secondary} onClick={() => setConfirm(false)}>Cancel</button>
            <button className={btn.danger} disabled={busy} onClick={() => patch({ status: "SUSPENDED" }, `${ws.name} suspended`)}>{busy ? "Suspending…" : "Suspend workspace"}</button>
          </>
        }
      >
        <ul className="list-disc space-y-1 pl-5 font-body-md text-body-md text-text-secondary">
          <li>{members.length} member{members.length === 1 ? "" : "s"} lose access straight away.</li>
          <li>Every public link in this workspace stops working.</li>
          <li>Nothing is deleted. You can reinstate it at any time.</li>
          <li>The owner gets an email telling them it was suspended.</li>
        </ul>
      </Dialog>
    </>
  );
}
