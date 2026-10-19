"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileIcon, kindLabel } from "@/components/files/FileIcon";
import { Preview } from "@/components/files/Preview";
import type { Row } from "@/components/files/types";
import { Icon } from "@/components/Icon";
import { Toaster } from "@/components/toast";
import { formatBytes, formatDate } from "@/lib/format";
import { downloadFolderZip, guestZip, linkZip } from "@/lib/zipDownload";

export function PublicBrowser({
  token,
  mode = "link",
  sharerName,
  root,
  folder,
  items,
  allowDownload,
  expiresAt,
}: {
  token: string;
  /** "link" = public link (/s/…); "guest" = shared with a verified outside person (/g/…). */
  mode?: "link" | "guest";
  sharerName: string;
  root: { id: string; name: string; type: "folder" | "file"; size: number; mimeType?: string };
  folder: { id: string; name: string; isRoot: boolean } | null;
  items: Row[];
  allowDownload: boolean;
  expiresAt: string | null;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "updatedAt" | "size">("name");
  const [preview, setPreview] = useState<number | null>(null);
  const api = mode === "guest" ? `/api/guest/${token}` : `/api/public/${token}`;
  const page = mode === "guest" ? `/g/${token}` : `/s/${token}`;
  const url = (row: { id: string }, inline = false) => `${api}/items/${row.id}/download${inline ? "?inline=1" : ""}`;

  const shown = useMemo(
    () =>
      items
        .filter((i) => i.name.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) =>
          a.type !== b.type ? (a.type === "folder" ? -1 : 1) : sort === "name" ? a.name.localeCompare(b.name) : sort === "size" ? b.size - a.size : b.updatedAt.localeCompare(a.updatedAt),
        ),
    [items, q, sort],
  );
  const files = shown.filter((i) => i.type === "file");
  const total = files.reduce((a, f) => a + f.size, 0);

  const downloadAll = () =>
    files.forEach((f, i) =>
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = url(f);
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 500),
    );

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-8 flex flex-wrap items-center gap-6 rounded-2xl bg-surface p-8 shadow-sm">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary-fixed/70">
          <Icon name={root.type === "folder" ? "folder" : "description"} className="text-[48px] text-primary-container" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 flex items-center gap-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">
            Shared {root.type} <span className="h-1 w-1 rounded-full bg-outline" />
            <span className="normal-case tracking-normal">{sharerName} shared a {root.type} with you</span>
          </p>
          <h1 className="mb-3 truncate text-[30px] font-semibold text-text-primary">{root.name}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-primary-fixed/70 px-3 py-1 font-body-md text-body-md text-primary">
              <Icon name="inventory_2" className="text-[16px]" /> {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(total)}
            </span>
            {expiresAt && (
              <span className="flex items-center gap-1.5 rounded-full bg-[#fef3c7] px-3 py-1 font-body-md text-body-md text-warning">
                <Icon name="schedule" className="text-[16px]" /> Link expires on {new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {!allowDownload && (
              <span className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 font-body-md text-body-md text-on-surface-variant">
                <Icon name="visibility" className="text-[16px]" /> View only
              </span>
            )}
          </div>
        </div>
        {allowDownload && root.type === "file" && (
          <button onClick={downloadAll} className="flex h-12 items-center gap-2 rounded-full bg-primary-container px-6 font-title-md text-[15px] text-on-primary shadow-md hover:bg-primary">
            <Icon name="cloud_download" className="text-[22px]" /> Download
          </button>
        )}
        {allowDownload && root.type === "folder" && items.length > 0 && (
          <button
            onClick={() => downloadFolderZip(folder && !folder.isRoot ? folder.name : root.name, (mode === "guest" ? guestZip(token) : linkZip(token)), folder && !folder.isRoot ? folder.id : undefined)}
            className="flex h-12 items-center gap-2 rounded-full bg-primary-container px-6 font-title-md text-[15px] text-on-primary shadow-md hover:bg-primary"
          >
            <Icon name="cloud_download" className="text-[22px]" /> Download all (.zip)
          </button>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-headline-sm text-[18px]">
          {folder && !folder.isRoot && (
            <>
              <Link href={page} className="text-text-secondary hover:text-text-primary">
                {root.name}
              </Link>
              <Icon name="chevron_right" className="text-[20px] text-outline" />
            </>
          )}
          <span className="text-text-primary">{folder ? (folder.isRoot ? "Files in this folder" : folder.name) : "Shared file"}</span>
          <span className="rounded-full bg-surface-container-high px-2 font-label-md text-label-md text-on-surface-variant">{shown.length}</span>
        </div>
        {root.type === "folder" && (
          <div className="flex gap-3">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files..." className="h-11 w-64 rounded-xl bg-surface pl-10 pr-3 font-body-md text-body-md shadow-sm focus:outline-none" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-11 rounded-xl bg-surface px-3 font-body-md text-body-md shadow-sm">
              <option value="name">Sort: Name</option>
              <option value="updatedAt">Sort: Newest</option>
              <option value="size">Sort: Largest</option>
            </select>
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl bg-surface p-12 text-center font-body-md text-body-md text-text-secondary shadow-sm">This folder is empty.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((item) => {
            const isImage = item.type === "file" && item.mimeType?.startsWith("image/") && !/svg/.test(item.mimeType);
            const ext = item.name.includes(".") ? item.name.split(".").pop()!.toUpperCase() : "";
            const card = (
              <>
                <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-surface-container-low">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url(item, true)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <FileIcon type={item.type} name={item.name} mime={item.mimeType} size="xl" />
                  )}
                  {item.type === "file" && ext && (
                    <span className="absolute left-3 top-3 rounded-md bg-surface px-2 py-0.5 font-label-md text-label-md text-text-primary shadow-sm">{ext}</span>
                  )}
                </div>
                <p className="mt-4 truncate font-title-md text-[15px] text-text-primary">{item.name}</p>
                <p className="truncate font-body-md text-body-md text-text-secondary">
                  {item.type === "folder" ? "Folder" : `${kindLabel(item.type, item.name, item.mimeType)} · ${formatBytes(item.size)}`} · Modified {formatDate(item.updatedAt)}
                </p>
              </>
            );
            return item.type === "folder" ? (
              <Link key={item.id} href={`${page}?folder=${item.id}`} className="rounded-2xl bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
                {card}
                <p className="mt-3 flex justify-end font-body-sm text-body-sm text-primary">Open folder →</p>
              </Link>
            ) : (
              <div key={item.id} className="rounded-2xl bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
                <button className="w-full text-left" onClick={() => setPreview(files.findIndex((f) => f.id === item.id))}>
                  {card}
                </button>
                <div className="mt-3 flex items-center justify-between font-body-sm text-body-sm">
                  {allowDownload ? (
                    <a href={url(item)} className="flex items-center gap-1 text-on-surface-variant hover:text-primary">
                      <Icon name="download" className="text-[18px]" /> Download
                    </a>
                  ) : (
                    <span />
                  )}
                  <button onClick={() => setPreview(files.findIndex((f) => f.id === item.id))} className="text-primary">
                    Preview →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview !== null && files[preview] && (
        <Preview
          rows={files}
          index={preview}
          location={`Shared by ${sharerName}`}
          onIndex={setPreview}
          onClose={() => setPreview(null)}
          downloadUrl={url}
          canDownload={allowDownload}
        />
      )}
      <Toaster />
    </div>
  );
}
