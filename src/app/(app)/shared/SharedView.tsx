"use client";

import { useMemo, useState } from "react";
import { FileBrowser, type BrowserRow } from "@/components/files/FileBrowser";
import { Icon } from "@/components/Icon";

type Meta = Record<string, { sharedBy: string; sharedById: string; sharedAt: string }>;

export function SharedView({ rows, meta, meId }: { rows: BrowserRow[]; meta: Meta; meId: string }) {
  const [filter, setFilter] = useState<"all" | "folder" | "file">("all");
  const [person, setPerson] = useState("all");
  const people = useMemo(() => [...new Map(Object.values(meta).map((m) => [m.sharedById, m.sharedBy])).entries()], [meta]);
  const shown = rows
    .filter((r) => (filter === "all" || r.type === filter) && (person === "all" || meta[r.id]?.sharedById === person))
    .map((r) => ({ ...r, location: `Shared by ${meta[r.id]?.sharedBy}` }));
  const count = (t: "folder" | "file") => rows.filter((r) => r.type === t).length;

  const chip = (key: typeof filter, label: string, n: number) => (
    <button
      onClick={() => setFilter(key)}
      className={`flex h-10 items-center gap-2 rounded-full px-4 font-title-md text-title-md transition-colors ${filter === key ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:text-text-primary"}`}
    >
      {key !== "all" && <Icon name={key === "folder" ? "folder" : "description"} className="text-[18px]" />}
      {label}
      <span className={`rounded-full px-2 font-label-md text-label-md ${filter === key ? "bg-white/20" : "bg-surface-container-high"}`}>{n}</span>
    </button>
  );

  return (
    <FileBrowser
      rows={shown}
      meId={meId}
      showLocation
      header={
        <>
          <p className="mb-1 flex items-center gap-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">
            Workspace collaboration <span className="h-1.5 w-1.5 rounded-full bg-primary" /> <span className="normal-case tracking-normal">{rows.length} items shared</span>
          </p>
          <h1 className="font-headline-lg text-headline-lg text-text-primary">Shared with me</h1>
          <p className="mb-5 font-body-md text-body-md text-text-secondary">Files and folders teammates have shared directly with you.</p>
          <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-surface p-3 shadow-sm">
            {chip("all", "All", rows.length)}
            {chip("folder", "Folders", count("folder"))}
            {chip("file", "Files", count("file"))}
            <select value={person} onChange={(e) => setPerson(e.target.value)} className="ml-auto h-10 rounded-full bg-surface-container-low px-4 font-title-md text-title-md">
              <option value="all">All collaborators</option>
              {people.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </>
      }
      emptyState={
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-fixed text-primary-container">
            <Icon name="group" className="text-[32px]" />
          </div>
          <p className="font-headline-sm text-headline-sm text-text-primary">Nothing shared with you yet</p>
          <p className="mt-1 font-body-md text-body-md text-text-secondary">When a teammate shares a file or folder with you, it shows up here.</p>
        </>
      }
    />
  );
}
