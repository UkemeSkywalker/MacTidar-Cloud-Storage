"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { btn, Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { card, PageHeader, StatusPill } from "@/components/platform/PlatformShell";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  lastActiveAt?: string;
  staff: boolean;
  workspaces: { id: string; name: string; type: "PERSONAL" | "COMPANY"; role: string }[];
};

export function UsersView({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | Row["status"]>("ALL");
  const [target, setTarget] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => status === "ALL" || r.status === status)
      .filter((r) => !needle || [r.name, r.email, r.id].some((v) => v.toLowerCase().includes(needle)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [rows, q, status]);

  async function setUserStatus(r: Row, next: Row["status"]) {
    setBusy(true);
    try {
      await api(`/api/platform/users/${r.id}`, { method: "PATCH", body: { status: next } });
      toast(next === "DISABLED" ? `${r.name} disabled and signed out` : `${r.name} re-enabled`);
      setTarget(null);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  const disabled = rows.filter((r) => r.status === "DISABLED").length;

  return (
    <>
      <PageHeader crumb={<>Platform <Icon name="chevron_right" className="text-[16px]" /> Users</>} title={<>Users <span className="font-body-md text-body-md font-normal text-text-secondary">{rows.length} accounts</span></>} subtitle="Everyone with a MacTidar Cloud account. Disabling an account signs it out everywhere and blocks sign-in." />

      <div className={`${card} mb-space-md flex flex-col gap-3 p-4 md:flex-row md:items-center`}>
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className="h-10 w-full rounded-lg bg-surface-container-low pl-10 pr-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/20" />
        </div>
        <div className="flex gap-1 rounded-full bg-surface-container-low p-1">
          {([["ALL", `All (${rows.length})`], ["ACTIVE", "Active"], ["DISABLED", `Disabled (${disabled})`]] as const).map(([v, label]) => (
            <button key={v} onClick={() => setStatus(v)} className={`rounded-full px-3 py-1 font-label-md text-label-md ${status === v ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        {shown.length === 0 && <p className="p-8 text-center font-body-md text-body-md text-text-secondary">No users match.</p>}
        <ul>
          {shown.map((r) => (
            <li key={r.id} className={`grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3 last:border-0 md:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,2fr)_140px_90px_auto] ${r.status === "DISABLED" ? "bg-surface-container-low/60" : ""}`}>
              <Avatar name={r.name} id={r.id} />
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate font-title-md text-title-md text-text-primary">{r.name}</span>
                  {r.staff && <span className="rounded bg-[#f3e8ff] px-1.5 font-label-sm text-label-sm text-file-image">Staff</span>}
                </span>
                <span className="block truncate font-body-sm text-body-sm text-text-secondary">{r.email}</span>
              </span>
              <span className="col-span-3 col-start-2 flex flex-wrap gap-1 md:col-span-1 md:col-start-auto">
                {r.workspaces.map((w) => (
                  <Link key={w.id} href={`/platform/workspaces/${w.id}`} className={`rounded-full px-2 py-0.5 font-label-md text-label-md hover:underline ${w.type === "COMPANY" ? "bg-primary-soft text-primary" : "bg-[#f3e8ff] text-file-image"}`}>
                    {w.name}
                    {w.type === "COMPANY" && w.role === "ADMIN" ? " · admin" : ""}
                  </Link>
                ))}
              </span>
              <span className="col-span-2 col-start-2 font-body-sm text-body-sm text-text-secondary md:col-span-1 md:col-start-auto">
                Joined {formatDate(r.createdAt)}
                <span className="block">Active {timeAgo(r.lastActiveAt).toLowerCase()}</span>
              </span>
              <span className="hidden md:block"><StatusPill status={r.status} /></span>
              <span className="col-start-3 row-start-1 flex justify-end md:col-start-auto md:row-start-auto">
                {!r.staff &&
                  (r.status === "ACTIVE" ? (
                    <button onClick={() => setTarget(r)} className="rounded-full px-3 py-1.5 font-title-md text-label-md text-danger hover:bg-error-container">Disable</button>
                  ) : (
                    <button disabled={busy} onClick={() => setUserStatus(r, "ACTIVE")} className="rounded-full px-3 py-1.5 font-title-md text-label-md text-primary hover:bg-primary-soft">Enable</button>
                  ))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Dialog
        open={!!target}
        onClose={() => setTarget(null)}
        title={`Disable ${target?.name}?`}
        icon={<div className="flex h-11 w-11 items-center justify-center rounded-full bg-error-container text-danger"><Icon name="person_off" className="text-[22px]" /></div>}
        footer={
          <>
            <button className={btn.secondary} onClick={() => setTarget(null)}>Cancel</button>
            <button className={btn.danger} disabled={busy} onClick={() => target && setUserStatus(target, "DISABLED")}>{busy ? "Disabling…" : "Disable account"}</button>
          </>
        }
      >
        <p className="font-body-md text-body-md text-text-secondary">
          {target?.email} will be signed out everywhere and won&apos;t be able to sign in. Their files and workspaces stay as they are. You can enable the account again later.
        </p>
      </Dialog>
    </>
  );
}
