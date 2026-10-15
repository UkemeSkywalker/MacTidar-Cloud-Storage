"use client";

import { useState } from "react";
import { FileBrowser, type BrowserRow } from "@/components/files/FileBrowser";
import { fileKind } from "@/components/files/FileIcon";
import { Icon } from "@/components/Icon";

const TYPES = [
  { key: "pdf", label: "PDFs", dot: "bg-file-pdf", match: ["pdf"] },
  { key: "docs", label: "Docs", dot: "bg-file-doc", match: ["doc", "text", "slides"] },
  { key: "sheet", label: "Sheets", dot: "bg-file-sheet", match: ["sheet"] },
  { key: "media", label: "Images & video", dot: "bg-file-image", match: ["image", "video", "audio"] },
  { key: "folder", label: "Folders", dot: "bg-file-folder", match: ["folder"] },
  { key: "archive", label: "Archives", dot: "bg-file-archive", match: ["archive"] },
];

export function SearchView({ q, rows, meId }: { q: string; rows: BrowserRow[]; meId: string }) {
  const [type, setType] = useState<string | null>(null);
  const [mine, setMine] = useState(false);
  const [recent, setRecent] = useState(false);
  const kindOf = (r: BrowserRow) => fileKind(r.type, r.name, r.mimeType);
  const cutoff = Date.now() - 30 * 86400_000;
  const shown = rows.filter(
    (r) =>
      (!type || TYPES.find((t) => t.key === type)!.match.includes(kindOf(r))) &&
      (!mine || r.ownerId === meId) &&
      (!recent || new Date(r.updatedAt).getTime() >= cutoff),
  );
  const chip = (active: boolean, onClick: () => void, children: React.ReactNode) => (
    <button
      onClick={onClick}
      className={`flex h-9 items-center gap-2 rounded-full px-3.5 font-title-md text-title-md transition-colors ${active ? "bg-primary-fixed text-primary" : "bg-surface-container-low text-on-surface-variant hover:text-text-primary"}`}
    >
      {children}
    </button>
  );

  return (
    <FileBrowser
      rows={shown}
      meId={meId}
      showLocation
      highlight={q}
      header={
        <>
          <p className="mb-1 flex items-center gap-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">
            <Icon name="travel_explore" className="text-[18px]" /> Global search results
          </p>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <h1 className="font-headline-lg text-[28px] text-text-primary">
              {q ? (
                <>
                  Results for <span className="text-primary-container">&ldquo;{q}&rdquo;</span>
                </>
              ) : (
                "Search"
              )}
            </h1>
            {q && (
              <span className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 font-label-md text-label-md text-on-surface-variant">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {rows.length} matching files &amp; folders
              </span>
            )}
          </div>
          {rows.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-surface p-4 shadow-sm">
              <span className="mr-1 font-label-md text-label-md uppercase tracking-wider text-text-secondary">Quick picks:</span>
              {TYPES.map((t) => {
                const n = rows.filter((r) => t.match.includes(kindOf(r))).length;
                if (!n) return null;
                return (
                  <span key={t.key}>
                    {chip(type === t.key, () => setType(type === t.key ? null : t.key), (
                      <>
                        <span className={`h-2 w-2 rounded-full ${t.dot}`} /> {t.label} <span className="font-label-md text-label-md text-text-secondary">{n}</span>
                      </>
                    ))}
                  </span>
                );
              })}
              {chip(mine, () => setMine(!mine), (
                <>
                  <Icon name="person" className="text-[16px]" /> Owned by me
                </>
              ))}
              {chip(recent, () => setRecent(!recent), (
                <>
                  <Icon name="schedule" className="text-[16px]" /> Last 30 days
                </>
              ))}
              {(type || mine || recent) && (
                <button onClick={() => { setType(null); setMine(false); setRecent(false); }} className="ml-auto flex items-center gap-1 font-body-md text-body-md text-text-secondary hover:text-text-primary">
                  <Icon name="restart_alt" className="text-[18px]" /> Reset filters
                </button>
              )}
            </div>
          )}
        </>
      }
      emptyState={
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high">
            <Icon name="search_off" className="text-[32px] text-outline" />
          </div>
          <p className="font-headline-sm text-headline-sm text-text-primary">{q ? `No results for "${q}"` : "Type in the search bar to find files"}</p>
          <p className="mt-1 font-body-md text-body-md text-text-secondary">Search matches file and folder names you have access to.</p>
        </>
      }
    />
  );
}
