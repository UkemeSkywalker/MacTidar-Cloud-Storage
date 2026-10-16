"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { card, PageHeader, StatusPill, TypePill, WsBadge } from "@/components/platform/PlatformShell";
import { formatBytes, formatDate } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  type: "PERSONAL" | "COMPANY";
  status: "ACTIVE" | "SUSPENDED";
  usedBytes: number;
  quotaBytes: number;
  createdAt: string;
  members: number;
  ownerName: string;
  ownerEmail: string;
};

const SORTS = {
  storage: { label: "Storage used", fn: (a: Row, b: Row) => b.usedBytes - a.usedBytes },
  newest: { label: "Newest", fn: (a: Row, b: Row) => b.createdAt.localeCompare(a.createdAt) },
  members: { label: "Members", fn: (a: Row, b: Row) => b.members - a.members },
  name: { label: "Name", fn: (a: Row, b: Row) => a.name.localeCompare(b.name) },
};

export function WorkspacesView({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"ALL" | Row["type"]>("ALL");
  const [status, setStatus] = useState<"ALL" | Row["status"]>("ALL");
  const [sort, setSort] = useState<keyof typeof SORTS>("storage");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => (type === "ALL" || r.type === type) && (status === "ALL" || r.status === status))
      .filter((r) => !needle || [r.name, r.id, r.ownerName, r.ownerEmail].some((v) => v.toLowerCase().includes(needle)))
      .sort(SORTS[sort].fn);
  }, [rows, q, type, status, sort]);

  const count = (f: (r: Row) => boolean) => rows.filter(f).length;
  const suspended = count((r) => r.status === "SUSPENDED");

  const seg = <T extends string>(value: T, set: (v: T) => void, options: [T, string][]) => (
    <div className="flex flex-wrap gap-1 rounded-full bg-surface-container-low p-1">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => set(v)} className={`rounded-full px-3 py-1 font-label-md text-label-md ${value === v ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader crumb={<>Platform <Icon name="chevron_right" className="text-[16px]" /> Workspaces</>} title={<>Workspaces <span className="font-body-md text-body-md font-normal text-text-secondary">{rows.length} registered</span></>}>
        <div className="flex gap-3">
          <div className={`${card} flex items-center gap-3 px-4 py-3`}>
            <Icon name="verified" className="text-[22px] text-tertiary" />
            <div>
              <p className="font-title-md text-title-md">{rows.length - suspended}</p>
              <p className="font-label-sm text-label-sm text-text-secondary">Active</p>
            </div>
          </div>
          <div className={`${card} flex items-center gap-3 px-4 py-3`}>
            <Icon name="gpp_bad" className="text-[22px] text-danger" />
            <div>
              <p className="font-title-md text-title-md">{suspended}</p>
              <p className="font-label-sm text-label-sm text-text-secondary">Suspended</p>
            </div>
          </div>
        </div>
      </PageHeader>

      <div className={`${card} mb-space-md space-y-3 p-4`}>
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by workspace name, ID, or owner…" className="h-10 w-full rounded-lg bg-surface-container-low pl-10 pr-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/20" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {seg(type, setType, [["ALL", `All (${rows.length})`], ["PERSONAL", `Personal (${count((r) => r.type === "PERSONAL")})`], ["COMPANY", `Company (${count((r) => r.type === "COMPANY")})`]])}
          {seg(status, setStatus, [["ALL", "Any status"], ["ACTIVE", "Active"], ["SUSPENDED", `Suspended (${suspended})`]])}
          <label className="ml-auto flex items-center gap-2 font-label-md text-label-md text-text-secondary">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} className="rounded-lg bg-surface-container-low px-2 py-1.5 font-title-md text-label-md text-text-primary">
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        {shown.length === 0 && <p className="p-8 text-center font-body-md text-body-md text-text-secondary">No workspaces match.</p>}
        <ul>
          {shown.map((r) => {
            const pct = r.quotaBytes ? Math.min(100, (r.usedBytes / r.quotaBytes) * 100) : 0;
            return (
              <li key={r.id} className={`border-b border-border last:border-0 ${r.status === "SUSPENDED" ? "bg-error-container/20" : ""}`}>
                <Link href={`/platform/workspaces/${r.id}`} className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 px-4 py-3 hover:bg-surface-container-low/60 md:grid-cols-[auto_minmax(0,2fr)_90px_minmax(0,1.6fr)_90px_170px_90px]">
                  <WsBadge name={r.name} type={r.type} suspended={r.status === "SUSPENDED"} />
                  <span className="min-w-0">
                    <span className="block truncate font-title-md text-title-md text-text-primary">{r.name}</span>
                    <span className="block truncate font-body-sm text-body-sm text-text-secondary">Created {formatDate(r.createdAt)}</span>
                  </span>
                  <span className="col-start-2 flex flex-wrap items-center gap-2 md:col-start-auto">
                    <TypePill type={r.type} />
                    <span className="md:hidden"><StatusPill status={r.status} /></span>
                  </span>
                  <span className="col-start-2 min-w-0 md:col-start-auto">
                    <span className="block truncate font-body-md text-body-md text-text-primary">{r.ownerName}</span>
                    <span className="block truncate font-body-sm text-body-sm text-text-secondary">{r.ownerEmail}</span>
                  </span>
                  <span className="col-start-2 flex items-center gap-1 font-body-sm text-body-sm text-text-secondary md:col-start-auto">
                    <Icon name={r.members > 1 ? "group" : "person"} className="text-[18px]" /> {r.members} member{r.members === 1 ? "" : "s"}
                  </span>
                  <span className="col-start-2 md:col-start-auto">
                    <span className="mb-1 flex justify-between font-label-md text-label-md text-text-secondary">
                      <span className={pct >= 90 ? "text-danger" : pct >= 75 ? "text-warning" : ""}>{formatBytes(r.usedBytes)}</span>
                      <span>{formatBytes(r.quotaBytes, 0)}</span>
                    </span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                      <span className={`block h-full rounded-full ${pct >= 90 ? "bg-danger" : pct >= 75 ? "bg-warning" : "bg-primary-container"}`} style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                  <span className="hidden justify-end md:flex"><StatusPill status={r.status} /></span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
