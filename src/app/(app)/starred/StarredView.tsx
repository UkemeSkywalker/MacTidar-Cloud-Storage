"use client";

import { FileBrowser, type BrowserRow } from "@/components/files/FileBrowser";
import { fileKind } from "@/components/files/FileIcon";
import { Icon } from "@/components/Icon";
import { formatBytes } from "@/lib/format";

export function StarredView({ rows, meId }: { rows: BrowserRow[]; meId: string }) {
  const kinds = rows.map((r) => fileKind(r.type, r.name, r.mimeType));
  const stat = (icon: string, tone: string, label: string, value: string) => (
    <div className="flex items-center gap-4 rounded-xl bg-surface p-5 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
        <Icon name={icon} className="text-[24px]" />
      </div>
      <div>
        <p className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">{label}</p>
        <p className="font-headline-sm text-headline-sm text-text-primary">{value}</p>
      </div>
    </div>
  );
  return (
    <FileBrowser
      rows={rows}
      meId={meId}
      showLocation
      header={
        <>
          <h1 className="flex items-center gap-3 font-headline-lg text-[28px] text-text-primary">
            <Icon name="star" className="text-[30px] text-[#f59e0b]" /> Starred
          </h1>
          <p className="mb-6 font-body-md text-body-md text-text-secondary">Your pinned and favourite files and folders for instant access.</p>
          {rows.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stat("folder", "bg-primary-fixed/70 text-primary-container", "Folders", `${kinds.filter((k) => k === "folder").length} pinned`)}
              {stat("description", "bg-error-container/60 text-file-pdf", "Documents", `${kinds.filter((k) => ["pdf", "doc", "sheet", "slides", "text"].includes(k)).length} documents`)}
              {stat("perm_media", "bg-[#f3e8ff] text-file-image", "Media", `${kinds.filter((k) => ["image", "video", "audio"].includes(k)).length} rich assets`)}
              {stat("data_usage", "bg-surface-container-high text-primary", "Total starred", formatBytes(rows.reduce((a, r) => a + r.size, 0)))}
            </div>
          )}
        </>
      }
      emptyState={
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fef3c7] text-[#f59e0b]">
            <Icon name="star" className="text-[32px]" />
          </div>
          <p className="font-headline-sm text-headline-sm text-text-primary">Star files to find them here quickly</p>
          <p className="mt-1 font-body-md text-body-md text-text-secondary">Use the star button on any file or folder.</p>
        </>
      }
    />
  );
}
