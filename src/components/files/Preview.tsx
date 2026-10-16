"use client";

import { useEffect, useState } from "react";
import { formatBytes, formatDate } from "@/lib/format";
import { Avatar } from "../Avatar";
import { Icon } from "../Icon";
import { fileKind, FileIcon, kindLabel } from "./FileIcon";
import type { Row } from "./types";

// Full-screen preview with prev/next, zoom and a details panel.
export function Preview({
  rows,
  index,
  location,
  onIndex,
  onClose,
  downloadUrl,
  onShare,
  onStar,
  canShare,
  canDownload = true,
}: {
  rows: Row[];
  index: number;
  location: string;
  onIndex: (i: number) => void;
  onClose: () => void;
  downloadUrl: (row: Row, inline?: boolean) => string;
  onShare?: (row: Row) => void;
  onStar?: (row: Row) => void;
  canShare?: boolean;
  canDownload?: boolean;
}) {
  const row = rows[index];
  const [zoom, setZoom] = useState(100);
  const [details, setDetails] = useState(true);
  const [text, setText] = useState<string | null>(null);
  const kind = fileKind("file", row.name, row.mimeType);
  const src = downloadUrl(row, true);

  useEffect(() => {
    setZoom(100);
    setText(null);
    if (kind === "text") {
      fetch(src)
        .then((r) => r.text())
        .then((t) => setText(t.slice(0, 200_000)))
        .catch(() => setText("Couldn't load this file."));
    }
  }, [row.id, kind, src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < rows.length - 1) onIndex(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, rows.length, onClose, onIndex]);

  const ext = row.name.includes(".") ? row.name.split(".").pop()!.toUpperCase() : "";
  const roundBtn = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:h-10 sm:w-10";

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-overlay-dark text-white">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-3 sm:h-20 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <button aria-label="Back" onClick={onClose} className={roundBtn}>
            <Icon name="arrow_back" className="text-[22px]" />
          </button>
          <span className="hidden sm:block">
            <FileIcon type="file" name={row.name} mime={row.mimeType} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-headline-sm text-[15px] sm:text-headline-sm">{row.name}</span>
              {ext && <span className="hidden rounded bg-white/15 px-1.5 font-label-sm text-label-sm sm:inline">{ext}</span>}
            </div>
            <p className="hidden truncate font-body-sm text-body-sm text-white/60 sm:block">{location}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {canShare && onShare && (
            <button onClick={() => onShare(row)} aria-label="Share" className="flex h-9 items-center gap-2 rounded-full bg-primary-container px-2.5 font-title-md text-title-md hover:bg-primary sm:h-10 sm:px-5">
              <Icon name="share" className="text-[18px]" /> <span className="hidden sm:inline">Share</span>
            </button>
          )}
          {canDownload && (
            <a aria-label="Download" href={downloadUrl(row)} className={roundBtn}>
              <Icon name="download" className="text-[20px]" />
            </a>
          )}
          {onStar && (
            <button aria-label={row.starred ? "Unstar" : "Star"} onClick={() => onStar(row)} className={roundBtn}>
              <Icon name="star" fill={row.starred} className={`text-[20px] ${row.starred ? "text-[#facc15]" : ""}`} />
            </button>
          )}
          <button aria-label="Details" onClick={() => setDetails((d) => !d)} className={`${roundBtn} hidden md:flex ${details ? "bg-white/25" : ""}`}>
            <Icon name="info" className="text-[20px]" />
          </button>
          <button aria-label="Close" onClick={onClose} className={roundBtn}>
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-auto p-6">
          {index > 0 && (
            <button aria-label="Previous" onClick={() => onIndex(index - 1)} className={`${roundBtn} absolute left-6 top-1/2 z-10 h-14 w-14 -translate-y-1/2`}>
              <Icon name="chevron_left" className="text-[28px]" />
            </button>
          )}
          {index < rows.length - 1 && (
            <button aria-label="Next" onClick={() => onIndex(index + 1)} className={`${roundBtn} absolute right-6 top-1/2 z-10 h-14 w-14 -translate-y-1/2`}>
              <Icon name="chevron_right" className="text-[28px]" />
            </button>
          )}
          {kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={row.name} style={{ transform: `scale(${zoom / 100})` }} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl transition-transform" />
          )}
          {kind === "video" && <video src={src} controls autoPlay className="max-h-full max-w-full rounded-lg shadow-2xl" />}
          {kind === "audio" && (
            <div className="flex flex-col items-center gap-6">
              <FileIcon type="file" name={row.name} mime={row.mimeType} size="xl" />
              <audio src={src} controls autoPlay />
            </div>
          )}
          {kind === "pdf" && <iframe title={row.name} src={src} className="h-full w-full max-w-[1000px] rounded-lg bg-white" />}
          {kind === "text" && (
            <pre className="h-full w-full max-w-[1000px] overflow-auto whitespace-pre-wrap rounded-lg bg-white p-6 font-mono text-[13px] text-text-primary">
              {text ?? "Loading…"}
            </pre>
          )}
          {!["image", "video", "audio", "pdf", "text"].includes(kind) && (
            <div className="flex flex-col items-center gap-4 text-center">
              <FileIcon type="file" name={row.name} mime={row.mimeType} size="xl" />
              <p className="font-headline-sm text-headline-sm">No preview available</p>
              <p className="font-body-md text-body-md text-white/60">Download the file to open it on your device.</p>
              {canDownload && <a href={downloadUrl(row)} className="mt-2 flex h-10 items-center gap-2 rounded-full bg-primary-container px-5 font-title-md text-title-md hover:bg-primary">
                <Icon name="download" className="text-[18px]" /> Download ({formatBytes(row.size)})
              </a>}
            </div>
          )}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/10 px-5 py-2.5 backdrop-blur">
            {kind === "image" && (
              <>
                <button aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(25, z - 25))}>
                  <Icon name="remove" className="text-[22px]" />
                </button>
                <span className="w-12 text-center font-title-md text-title-md">{zoom}%</span>
                <button aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(400, z + 25))}>
                  <Icon name="add" className="text-[22px]" />
                </button>
                <span className="h-5 w-px bg-white/25" />
              </>
            )}
            <span className="font-body-md text-body-md text-white/80">
              {index + 1} of {rows.length} files
            </span>
          </div>
        </div>
        {details && (
          <aside className="hidden w-[400px] shrink-0 overflow-y-auto bg-surface p-6 text-text-primary md:block">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-headline-sm text-headline-sm">
                <Icon name="description" className="text-[22px] text-primary" /> File details
              </h3>
              <button aria-label="Close details" onClick={() => setDetails(false)} className="text-outline hover:text-text-primary">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">Properties</p>
            <dl className="mb-6 space-y-3 rounded-xl bg-surface-container-low p-4 font-body-md text-body-md">
              {[
                ["Type", `${kindLabel("file", row.name, row.mimeType)}${row.mimeType ? ` (${row.mimeType})` : ""}`],
                ["Size", `${formatBytes(row.size)} (${row.size.toLocaleString()} B)`],
                ["Location", location],
                ["Created", formatDate(row.createdAt)],
                ["Modified", formatDate(row.updatedAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-text-secondary">{k}</dt>
                  <dd className="break-all text-right">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-secondary">Owner</dt>
                <dd className="flex items-center gap-2">
                  <Avatar name={row.ownerName} id={row.ownerId} size="h-6 w-6 text-[10px]" /> {row.ownerName}
                </dd>
              </div>
            </dl>
            <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">Sharing</p>
            <div className="rounded-xl bg-surface-container-low p-4 font-body-md text-body-md">
              <p className="flex items-center gap-2">
                <Icon name={row.sharedCount ? "group" : "lock"} className="text-[18px] text-on-surface-variant" />
                {row.sharedCount ? `Shared with ${row.sharedCount} teammate${row.sharedCount > 1 ? "s" : ""}` : "Not shared directly"}
              </p>
              {row.hasLink && (
                <p className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-tertiary" /> Public link is active
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
