"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { downloadUrl, RowMenu, type BrowserRow } from "@/components/files/FileBrowser";
import { FileIcon, fileKind } from "@/components/files/FileIcon";
import { Preview } from "@/components/files/Preview";
import { Icon } from "@/components/Icon";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";
import { formatBytes, formatDate, timeAgo } from "@/lib/format";

type Entry = BrowserRow & { action: string; at: string };

const FILTERS = [
  { key: "all", label: "All Types", kinds: null },
  { key: "docs", label: "Docs & PDFs", kinds: ["pdf", "doc", "text", "slides"] },
  { key: "media", label: "Media", kinds: ["image", "video", "audio"] },
  { key: "sheets", label: "Spreadsheets", kinds: ["sheet"] },
] as const;

const ACTION: Record<string, { label: string; tone: string; dot: string }> = {
  uploaded: { label: "You uploaded", tone: "bg-tertiary-fixed text-on-tertiary-fixed-variant", dot: "bg-file-video" },
  opened: { label: "You opened", tone: "bg-surface-container-high text-on-surface-variant", dot: "bg-primary-container" },
  downloaded: { label: "You downloaded", tone: "bg-surface-container-high text-on-surface-variant", dot: "bg-primary-container" },
  shared: { label: "Shared with you", tone: "bg-primary-fixed text-primary", dot: "bg-file-image" },
  renamed: { label: "You renamed", tone: "bg-surface-container-high text-on-surface-variant", dot: "bg-warning" },
  moved: { label: "You moved", tone: "bg-surface-container-high text-on-surface-variant", dot: "bg-warning" },
};

function group(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(today) - start(d)) / 86400_000);
  if (days === 0) return { key: "today", label: "Today", icon: "today" };
  if (days === 1) return { key: "yesterday", label: "Yesterday", icon: "history" };
  if (days < 7) return { key: "week", label: "Earlier this week", icon: "date_range" };
  return { key: "older", label: "Older", icon: "calendar_month" };
}

export function RecentView({ entries, meId }: { entries: Entry[]; meId: string }) {
  void meId;
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [preview, setPreview] = useState<number | null>(null);
  const [stars, setStars] = useState<Record<string, boolean>>({});
  const kinds = FILTERS.find((f) => f.key === filter)!.kinds as readonly string[] | null;
  const shown = entries
    .map((e) => (e.id in stars ? { ...e, starred: stars[e.id] } : e))
    .filter((e) => !kinds || kinds.includes(fileKind(e.type, e.name, e.mimeType)));
  const files = shown.filter((e) => e.type === "file");
  const jump = files.slice(0, 4);

  const open = (e: Entry) => (e.type === "folder" ? router.push(`/folders/${e.id}`) : setPreview(files.findIndex((f) => f.id === e.id)));
  async function star(e: Entry) {
    const next = !e.starred;
    setStars((s) => ({ ...s, [e.id]: next }));
    await api(`/api/items/${e.id}/star`, { method: next ? "PUT" : "DELETE" }).catch(() => setStars((s) => ({ ...s, [e.id]: !next })));
  }

  const groups: { key: string; label: string; icon: string; items: Entry[] }[] = [];
  for (const e of shown) {
    const g = group(e.at);
    let bucket = groups.find((x) => x.key === g.key);
    if (!bucket) groups.push((bucket = { ...g, items: [] }));
    bucket.items.push(e);
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">
            Workspace stream <span className="h-1 w-1 rounded-full bg-outline" /> <span className="normal-case tracking-normal">Last 30 days</span>
          </p>
          <h1 className="font-headline-lg text-[28px] text-text-primary">Recent</h1>
          <p className="font-body-md text-body-md text-text-secondary">Files and folders you recently opened, uploaded, or were given.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-surface p-1 shadow-sm">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-4 py-2 font-title-md text-title-md ${filter === f.key ? "bg-primary-soft text-primary" : "text-on-surface-variant hover:text-text-primary"}`}
            >
              {f.label}
            </button>
          ))}
          <button aria-label="Refresh" onClick={() => router.refresh()} className="ml-1 rounded-lg p-2 text-on-surface-variant hover:text-text-primary">
            <Icon name="sync" className="text-[20px]" />
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-surface px-6 py-16 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-fixed text-primary-container">
            <Icon name="schedule" className="text-[32px]" />
          </div>
          <p className="font-headline-sm text-headline-sm text-text-primary">No recent activity yet</p>
          <p className="mt-1 font-body-md text-body-md text-text-secondary">Files you open or upload will show up here.</p>
          <Link href="/files" className="mt-4 font-title-md text-title-md text-primary hover:underline">
            Go to My Files →
          </Link>
        </div>
      ) : (
        <>
          {jump.length > 0 && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-headline-sm text-[18px] text-text-primary">
                  <Icon name="bolt" className="text-[22px] text-primary" /> Jump back in
                  <span className="rounded-full bg-primary-fixed px-2 font-label-md text-label-md text-primary">{jump.length} files</span>
                </h2>
                <span className="font-body-sm text-body-sm text-text-secondary">Sorted by last interaction</span>
              </div>
              <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {jump.map((e) => {
                  const isImage = e.mimeType?.startsWith("image/") && !/svg/.test(e.mimeType);
                  const ext = e.name.includes(".") ? e.name.split(".").pop()!.toUpperCase() : "FILE";
                  const a = ACTION[e.action] ?? ACTION.opened;
                  return (
                    <div key={e.id} className="overflow-hidden rounded-2xl bg-surface shadow-sm transition-shadow hover:shadow-md">
                      <button onClick={() => open(e)} className="relative flex aspect-[16/10] w-full items-center justify-center bg-surface-container-low">
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={downloadUrl(e, true)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <FileIcon type="file" name={e.name} mime={e.mimeType} size="xl" />
                        )}
                        <span className="absolute left-3 top-3 rounded-md bg-surface px-2 py-0.5 font-label-md text-label-md shadow-sm">{ext}</span>
                        <span className="absolute bottom-3 right-3 rounded-md bg-inverse-surface/80 px-2 py-0.5 font-label-md text-label-md text-white">{formatBytes(e.size)}</span>
                      </button>
                      <div className="p-4">
                        <p className="truncate font-title-md text-[15px] text-text-primary">{e.name}</p>
                        <p className="mb-3 truncate font-body-md text-body-md text-text-secondary">{e.location}</p>
                        <p className="flex items-center gap-2 font-body-sm text-body-sm text-text-secondary">
                          <span className={`h-2 w-2 rounded-full ${a.dot}`} /> {a.label.replace("You ", "").replace(/^\w/, (c) => c.toUpperCase())} {timeAgo(e.at).toLowerCase()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-headline-sm text-[18px] text-text-primary">
              <Icon name="history" className="text-[22px]" /> Activity Timeline
            </h2>
            <span className="font-body-sm text-body-sm text-text-secondary">{shown.length} events logged</span>
          </div>
          <div className="overflow-x-auto rounded-xl bg-surface shadow-sm">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-surface-container-low/60">
                <tr className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">
                  <th className="px-5 py-4 font-medium">Name</th>
                  <th className="px-3 py-4 font-medium">Location</th>
                  <th className="px-3 py-4 font-medium">Activity</th>
                  <th className="px-5 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              {groups.map((g) => (
                <tbody key={g.key}>
                  <tr className="bg-surface-container-low/40">
                    <td colSpan={4} className="px-5 py-2.5">
                      <span className="flex items-center gap-2 font-label-md text-label-md uppercase tracking-wider text-primary">
                        <Icon name={g.icon} className="text-[18px]" /> {g.label}
                        <span className="normal-case tracking-normal text-text-secondary">· {g.items.length} activities</span>
                      </span>
                    </td>
                  </tr>
                  {g.items.map((e) => {
                    const a = ACTION[e.action] ?? ACTION.opened;
                    return (
                      <tr key={e.id} className="border-t border-border hover:bg-surface-container-low/60">
                        <td className="px-5 py-3">
                          <button onClick={() => open(e)} className="flex items-center gap-3 text-left">
                            <FileIcon type={e.type} name={e.name} mime={e.mimeType} />
                            <span className="font-title-md text-[15px] text-text-primary">{e.name}</span>
                          </button>
                        </td>
                        <td className="px-3 py-3 font-body-md text-body-md text-text-secondary">
                          <span className="flex items-center gap-1.5">
                            <Icon name="folder" className="text-[18px]" /> {e.location}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-2">
                            <span className={`rounded-md px-2 py-0.5 font-label-md text-label-md ${a.tone}`}>{a.label}</span>
                            <span className="font-body-md text-body-md text-text-secondary">{group(e.at).key === "today" ? timeAgo(e.at) : formatDate(e.at)}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button aria-label={e.starred ? "Unstar" : "Star"} onClick={() => star(e)} className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low">
                              <Icon name="star" fill={e.starred} className={`text-[20px] ${e.starred ? "text-[#f59e0b]" : ""}`} />
                            </button>
                            <RowMenu
                              items={[
                                { label: "Open", icon: "open_in_new", onClick: () => open(e) },
                                ...(e.type === "file" ? [{ label: "Download", icon: "download", onClick: () => (window.location.href = downloadUrl(e)) }] : []),
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl bg-surface p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed text-primary-container">
              <Icon name="manage_history" className="text-[24px]" />
            </div>
            <div className="flex-1">
              <p className="font-title-md text-[15px] text-text-primary">Recent tracking is enabled</p>
              <p className="font-body-md text-body-md text-text-secondary">Only you can see your recent activity. Entries clear automatically after 30 days.</p>
            </div>
            <button
              onClick={async () => {
                await api("/api/recent", { method: "DELETE" });
                toast("Recent history cleared");
                router.refresh();
              }}
              className="rounded-full px-4 py-2 font-title-md text-title-md text-on-surface-variant hover:bg-surface-container-low"
            >
              Clear Recent History
            </button>
          </div>
        </>
      )}

      {preview !== null && files[preview] && (
        <Preview
          rows={files}
          index={preview}
          location={files[preview].location ?? ""}
          onIndex={setPreview}
          onClose={() => setPreview(null)}
          downloadUrl={downloadUrl}
          onStar={(r) => star(r as Entry)}
        />
      )}
    </div>
  );
}
