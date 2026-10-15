"use client";

import { useState } from "react";
import { formatBytes } from "@/lib/format";
import { Icon } from "../Icon";
import { FileIcon } from "./FileIcon";
import type { UploadTask } from "./useUploads";

export function UploadPanel({
  tasks,
  onCancel,
  onRetry,
  onClose,
}: {
  tasks: UploadTask[];
  onCancel: (key: string) => void;
  onRetry: (key: string) => void;
  onClose: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  if (!tasks.length) return null;

  const active = tasks.filter((t) => t.state === "uploading" || t.state === "queued");
  const done = tasks.filter((t) => t.state === "done").length;
  const total = tasks.reduce((a, t) => a + (t.state === "cancelled" ? 0 : t.file.size), 0);
  const loaded = tasks.reduce((a, t) => a + (t.state === "cancelled" ? 0 : t.state === "done" ? t.file.size : t.loaded), 0);
  const pct = total ? Math.round((loaded / total) * 100) : 100;

  return (
    <div className="fixed bottom-4 right-4 z-[80] w-[min(480px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between bg-inverse-surface px-5 py-3.5 text-inverse-on-surface">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${active.length ? "animate-pulse bg-primary-container" : "bg-tertiary-fixed-dim"}`} />
          <span className="font-title-md text-title-md">
            {active.length ? `Uploading ${done + 1 > tasks.length ? tasks.length : done + 1} of ${tasks.length} items` : `${done} upload${done === 1 ? "" : "s"} complete`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button aria-label={collapsed ? "Expand" : "Collapse"} onClick={() => setCollapsed((c) => !c)} className="rounded-lg p-1 hover:bg-white/10">
            <Icon name={collapsed ? "expand_less" : "expand_more"} className="text-[20px]" />
          </button>
          {!active.length && (
            <button aria-label="Close" onClick={onClose} className="rounded-lg p-1 hover:bg-white/10">
              <Icon name="close" className="text-[20px]" />
            </button>
          )}
        </div>
      </div>
      <div className="h-1 bg-surface-container-high">
        <div className="h-full bg-primary-container transition-all" style={{ width: `${pct}%` }} />
      </div>
      {!collapsed && (
        <ul className="max-h-[340px] overflow-y-auto">
          {tasks.map((t) => {
            const p = t.file.size ? Math.round((t.loaded / t.file.size) * 100) : 100;
            const elapsed = t.startedAt ? (Date.now() - t.startedAt) / 1000 : 0;
            const speed = elapsed > 0.5 ? t.loaded / elapsed : 0;
            const left = speed ? Math.max(0, Math.round((t.file.size - t.loaded) / speed)) : null;
            return (
              <li key={t.key} className={`flex items-center gap-3 px-5 py-3 ${t.state === "error" ? "bg-error-container/30" : ""}`}>
                <FileIcon type="file" name={t.file.name} mime={t.file.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-title-md text-title-md text-text-primary">{t.name}</p>
                  {t.state === "uploading" ? (
                    <>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                        <div className="h-full rounded-full bg-primary-container transition-all" style={{ width: `${p}%` }} />
                      </div>
                      <div className="mt-1 flex justify-between font-label-md text-label-md">
                        <span className="text-primary">
                          {p}%{speed ? ` · ${formatBytes(speed)}/s` : ""}
                        </span>
                        {left !== null && <span className="text-text-secondary">{left}s left</span>}
                      </div>
                    </>
                  ) : (
                    <p className="font-body-sm text-body-sm text-text-secondary">
                      {formatBytes(t.file.size)} ·{" "}
                      {t.state === "done" && <span className="font-medium text-tertiary">Completed</span>}
                      {t.state === "queued" && <span>Queued…</span>}
                      {t.state === "cancelled" && <span>Cancelled</span>}
                      {t.state === "error" && (
                        <>
                          <span className="text-danger">{t.error}</span>{" "}
                          <button onClick={() => onRetry(t.key)} className="font-medium text-primary underline">
                            Retry
                          </button>
                        </>
                      )}
                    </p>
                  )}
                </div>
                {t.state === "done" ? (
                  <Icon name="check_circle" className="text-[22px] text-tertiary" />
                ) : t.state === "uploading" || t.state === "queued" ? (
                  <button aria-label="Cancel upload" onClick={() => onCancel(t.key)} className="rounded-lg p-1 text-outline hover:bg-surface-container-low hover:text-text-primary">
                    <Icon name="close" className="text-[20px]" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
