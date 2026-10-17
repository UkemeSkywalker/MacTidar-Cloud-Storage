"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/format";
import { appZip, downloadFolderZip } from "@/lib/zipDownload";
import { Avatar } from "../Avatar";
import { Icon } from "../Icon";
import { toast } from "../toast";
import { MoveDialog, NameDialog, TrashDialog } from "./dialogs";
import { FileIcon, kindLabel } from "./FileIcon";
import { Preview } from "./Preview";
import { ShareDialog } from "./ShareDialog";
import type { AccessRole, Row } from "./types";
import { UploadPanel } from "./UploadPanel";
import { useUploads } from "./useUploads";
import { readDrop, readPicked, uploadTree, type PickedFile } from "./folderUpload";

type SortKey = "name" | "updatedAt" | "size";
const RANK: Record<AccessRole, number> = { VIEWER: 1, EDITOR: 2, OWNER: 3 };
const can = (role: AccessRole | undefined, min: AccessRole) => !!role && RANK[role] >= RANK[min];

export type BrowserRow = Row & { role: AccessRole };

export const downloadUrl = (row: { id: string }, inline = false) => `/api/items/${row.id}/download${inline ? "?inline=1" : ""}`;

export function FileBrowser({
  rows,
  header,
  folder,
  locationLabel,
  showLocation = false,
  emptyState,
  meId,
  showToolbar = false,
  highlight,
}: {
  rows: BrowserRow[];
  header?: React.ReactNode;
  /** Set when showing a folder's contents: enables upload / new folder / drop. */
  folder?: { id: string; name: string; role: AccessRole; path: string };
  locationLabel?: string;
  showLocation?: boolean;
  emptyState?: React.ReactNode;
  meId: string;
  showToolbar?: boolean;
  highlight?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nameDialog, setNameDialog] = useState<{ mode: "folder" | "rename"; row?: BrowserRow } | null>(null);
  const [trashRows, setTrashRows] = useState<BrowserRow[] | null>(null);
  const [moveRows, setMoveRows] = useState<BrowserRow[] | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [starOverrides, setStarOverrides] = useState<Record<string, boolean>>({});
  const [shareRow, setShareRow] = useState<BrowserRow | null>(null);
  const onShare = (row: BrowserRow) => setShareRow(row);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const [uploadMenu, setUploadMenu] = useState(false);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);

  const canUpload = !!folder && can(folder.role, "EDITOR");
  const refresh = useCallback(() => router.refresh(), [router]);
  const uploads = useUploads(refresh);

  // Uploads a dropped or picked folder: makes its folders, then queues the files.
  const startTree = useCallback(
    (reading: Promise<{ files: PickedFile[]; dirs: string[] }>) => {
      if (!folder) return;
      const target = folder.id;
      reading
        .then((picked) => {
          if (!picked.files.length && !picked.dirs.length) return;
          return uploadTree(picked, target, uploads.add).then(({ folders }) => folders && refresh());
        })
        .catch((err) => toast((err as Error).message || "Couldn't upload that folder.", { tone: "error" }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [folder?.id, uploads.add, refresh],
  );

  useEffect(() => {
    if (!uploadMenu) return;
    const close = (e: MouseEvent) => uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node) && setUploadMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [uploadMenu]);

  // Remember list/grid and sort choices per browser.
  useEffect(() => {
    try {
      const v = localStorage.getItem("mt-view");
      if (v === "grid" || v === "list") setView(v);
      const s = JSON.parse(localStorage.getItem("mt-sort") ?? "null");
      if (s?.key) setSort(s);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("mt-view", view);
      localStorage.setItem("mt-sort", JSON.stringify(sort));
    } catch {}
  }, [view, sort]);

  useEffect(() => setSelected(new Set()), [folder?.id]);

  // "+ New" menu in the sidebar, and ?action=… after navigating here.
  useEffect(() => {
    if (!canUpload) return;
    const onNew = (e: Event) => {
      const action = (e as CustomEvent<string>).detail;
      if (action === "folder") setNameDialog({ mode: "folder" });
      if (action === "upload") fileInput.current?.click();
      if (action === "upload-folder") folderInput.current?.click();
    };
    window.addEventListener("mt-new", onNew);
    const action = params.get("action");
    if (action) {
      router.replace(window.location.pathname);
      setTimeout(() => window.dispatchEvent(new CustomEvent("mt-new", { detail: action })), 50);
    }
    return () => window.removeEventListener("mt-new", onNew);
  }, [canUpload, params, router]);

  // Drag files from the desktop anywhere onto the page.
  useEffect(() => {
    if (!canUpload) return;
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current++;
      setDragging(true);
    };
    const over = (e: DragEvent) => hasFiles(e) && e.preventDefault();
    const leave = () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (!dragDepth.current) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (e.dataTransfer) startTree(readDrop(e.dataTransfer));
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, [canUpload, startTree]);

  const sorted = useMemo(() => {
    const withStars = rows.map((r) => (r.id in starOverrides ? { ...r, starred: starOverrides[r.id] } : r));
    return withStars.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      const k = sort.key;
      const v = k === "name" ? a.name.localeCompare(b.name, undefined, { numeric: true }) : k === "size" ? a.size - b.size : a.updatedAt.localeCompare(b.updatedAt);
      return v * sort.dir;
    });
  }, [rows, sort, starOverrides]);

  const files = sorted.filter((r) => r.type === "file");
  const selectedRows = sorted.filter((r) => selected.has(r.id));
  const one = selectedRows.length === 1 ? selectedRows[0] : null;
  const allEditable = selectedRows.length > 0 && selectedRows.every((r) => can(r.role, "EDITOR"));

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const opening = useRef<string | null>(null);
  const open = (row: BrowserRow) => {
    if (row.type === "folder") {
      // A double-click (or click + row double-click) must not start several navigations.
      if (opening.current === row.id) return;
      opening.current = row.id;
      setTimeout(() => (opening.current = null), 3000);
      router.push(`/folders/${row.id}`);
    } else setPreview(files.findIndex((f) => f.id === row.id));
  };

  const downloadMany = (list: BrowserRow[]) => {
    // Folders download as server-built zips; files download directly.
    list.filter((r) => r.type === "folder").forEach((r) => downloadFolderZip(r.name, appZip, r.id));
    const fileRows = list.filter((r) => r.type === "file");
    fileRows.forEach((r, i) => setTimeout(() => {
      const a = document.createElement("a");
      a.href = downloadUrl(r);
      a.download = r.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, i * 400));
  };

  async function toggleStar(row: BrowserRow) {
    const next = !row.starred;
    setStarOverrides((s) => ({ ...s, [row.id]: next }));
    try {
      await api(`/api/items/${row.id}/star`, { method: next ? "PUT" : "DELETE" });
      toast(next ? `Starred "${row.name}"` : `Removed "${row.name}" from Starred`);
    } catch (e) {
      setStarOverrides((s) => ({ ...s, [row.id]: !next }));
      toast((e as Error).message, { tone: "error" });
    }
  }

  const headerCell = (label: string, key?: SortKey, cls = "") => (
    <th className={`px-3 py-4 font-medium ${cls}`}>
      {key ? (
        <button onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : 1 }))} className="flex items-center gap-1 hover:text-text-primary">
          {label}
          {sort.key === key && <Icon name={sort.dir === 1 ? "arrow_upward" : "arrow_downward"} className="text-[16px]" />}
        </button>
      ) : (
        label
      )}
    </th>
  );

  const sharingChip = (r: BrowserRow) =>
    r.hasLink ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed/70 px-2.5 py-0.5 font-label-md text-label-md text-primary">
        <Icon name="link" className="text-[14px]" /> Public link
      </span>
    ) : r.team ? (
      <span title="Everyone in this workspace can see and edit this" className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed/40 px-2.5 py-0.5 font-label-md text-label-md text-on-tertiary-fixed-variant">
        <Icon name="groups" className="text-[14px]" /> Team
      </span>
    ) : r.sharedCount ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed/70 px-2.5 py-0.5 font-label-md text-label-md text-primary">
        <Icon name="group" className="text-[14px]" /> Shared
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-md text-label-md text-on-surface-variant">
        <Icon name="lock" className="text-[14px]" /> Private
      </span>
    );

  const quickActions = (r: BrowserRow, alwaysVisible = false) => (
    <div className={`flex items-center justify-end gap-1 ${alwaysVisible ? "" : "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"}`}>
      {can(r.role, "EDITOR") && (
        <IconBtn label="Share" icon="share" onClick={() => onShare(r)} />
      )}
      <IconBtn label={r.type === "folder" ? "Download as .zip" : "Download"} icon="download" onClick={() => downloadMany([r])} />
      <IconBtn label={r.starred ? "Unstar" : "Star"} icon="star" fill={r.starred} className={r.starred ? "text-[#f59e0b]" : ""} onClick={() => toggleStar(r)} />
      <RowMenu
        items={[
          { label: "Open", icon: r.type === "folder" ? "folder_open" : "visibility", onClick: () => open(r) },
          ...(can(r.role, "EDITOR")
            ? [
                { label: "Rename", icon: "edit", onClick: () => setNameDialog({ mode: "rename", row: r }) },
                ...(folder ? [{ label: "Move", icon: "drive_file_move", onClick: () => setMoveRows([r]) }] : []),
                { label: "Move to trash", icon: "delete", danger: true, onClick: () => setTrashRows([r]) },
              ]
            : []),
        ]}
      />
    </div>
  );

  // Every action for one row — used by the compact phone layout.
  const actionsFor = (r: BrowserRow) => [
    { label: r.type === "folder" ? "Open folder" : "Preview", icon: r.type === "folder" ? "folder_open" : "visibility", onClick: () => open(r) },
    ...(can(r.role, "EDITOR") ? [{ label: "Share", icon: "share", onClick: () => onShare(r) }] : []),
    { label: r.type === "folder" ? "Download as .zip" : "Download", icon: "download", onClick: () => downloadMany([r]) },
    { label: r.starred ? "Remove star" : "Star", icon: "star", onClick: () => toggleStar(r) },
    ...(can(r.role, "EDITOR")
      ? [
          { label: "Rename", icon: "edit", onClick: () => setNameDialog({ mode: "rename", row: r }) },
          ...(folder ? [{ label: "Move", icon: "drive_file_move", onClick: () => setMoveRows([r]) }] : []),
          { label: "Move to trash", icon: "delete", danger: true, onClick: () => setTrashRows([r]) },
        ]
      : []),
  ];

  const totalSize = files.reduce((a, r) => a + r.size, 0);

  return (
    <div className="mx-auto max-w-[1400px]">
      {header}

      {(folder || showLocation || showToolbar) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {canUpload && (
              <>
                <div className="relative" ref={uploadMenuRef}>
                  <button
                    onClick={() => setUploadMenu((o) => !o)}
                    aria-expanded={uploadMenu}
                    className="flex h-11 items-center gap-2 rounded-full bg-primary-container px-5 sm:px-6 font-title-md text-title-md text-on-primary shadow-sm hover:bg-primary"
                  >
                    <Icon name="upload" className="text-[20px]" /> Upload <Icon name="arrow_drop_down" className="-mr-2 text-[20px] opacity-80" />
                  </button>
                  {uploadMenu && (
                    <div className="absolute left-0 top-12 z-40 w-52 overflow-hidden rounded-xl bg-surface py-1 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                      <button onClick={() => { setUploadMenu(false); fileInput.current?.click(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-body-md text-body-md hover:bg-surface-container-low">
                        <Icon name="upload_file" className="text-[20px] text-primary" /> Upload files
                      </button>
                      <button onClick={() => { setUploadMenu(false); folderInput.current?.click(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-body-md text-body-md hover:bg-surface-container-low">
                        <Icon name="drive_folder_upload" className="text-[20px] text-file-folder" /> Upload folder
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => setNameDialog({ mode: "folder" })} className="flex h-11 items-center gap-2 rounded-full bg-surface px-4 sm:px-5 font-title-md text-title-md text-text-primary shadow-sm hover:bg-surface-container-low">
                  <Icon name="create_new_folder" className="text-[20px] text-primary" /> New folder
                </button>
              </>
            )}
            {folder && rows.length > 0 && (
              <button
                onClick={() => downloadFolderZip(folder.name, appZip, folder.id)}
                aria-label="Download folder as .zip"
                className="flex h-11 items-center gap-2 rounded-full bg-surface px-3.5 sm:px-5 font-title-md text-title-md text-text-primary shadow-sm hover:bg-surface-container-low"
              >
                <Icon name="folder_zip" className="text-[20px] text-on-surface-variant" /> <span className="hidden sm:inline">Download .zip</span>
              </button>
            )}
            {folder && !canUpload && (
              <span className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1.5 font-label-md text-label-md text-on-surface-variant">
                <Icon name="visibility" className="text-[16px]" /> View only
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex h-11 items-center gap-2 rounded-xl bg-surface px-3 font-body-md text-body-md text-text-secondary shadow-sm">
              <Icon name="sort" className="text-[20px]" /> <span className="hidden sm:inline">Sort:</span>
              <select
                value={sort.key}
                onChange={(e) => setSort({ key: e.target.value as SortKey, dir: e.target.value === "name" ? 1 : -1 })}
                className="bg-transparent font-title-md text-title-md text-text-primary focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="updatedAt">Last modified</option>
                <option value="size">File size</option>
              </select>
            </label>
            <div className="flex h-11 items-center rounded-xl bg-surface p-1 shadow-sm">
              {(["list", "grid"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex h-9 items-center gap-1.5 rounded-lg px-3 font-title-md text-title-md ${view === v ? "bg-primary-soft text-primary" : "text-on-surface-variant hover:text-text-primary"}`}
                >
                  <Icon name={v === "list" ? "view_list" : "grid_view"} className="text-[20px]" />
                  <span className="hidden sm:inline">{v === "list" ? "List" : "Grid"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {canUpload && (
        <button
          onClick={() => fileInput.current?.click()}
          className="mb-5 flex w-full items-center gap-4 rounded-xl bg-surface p-4 text-left shadow-sm transition-colors hover:bg-primary-soft/40"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed text-primary-container">
            <Icon name="cloud_upload" className="text-[24px]" />
          </div>
          <div className="flex-1">
            <p className="font-title-md text-title-md text-text-primary">Drop files or folders anywhere to upload</p>
            <p className="font-body-sm text-body-sm text-text-secondary">Or click to choose files · they&apos;ll be saved to {folder!.name}</p>
          </div>
        </button>
      )}
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const list = Array.from(e.target.files ?? []);
          if (list.length && folder) uploads.add(list, folder.id);
          e.target.value = "";
        }}
      />
      <input
        ref={folderInput}
        type="file"
        hidden
        {...{ webkitdirectory: "", directory: "" }}
        onChange={(e) => {
          if (e.target.files?.length) startTree(Promise.resolve(readPicked(e.target.files)));
          e.target.value = "";
        }}
      />

      {selectedRows.length > 0 && (
        <div className="sticky top-[76px] z-20 mb-4 flex flex-wrap items-center gap-1 rounded-2xl bg-inverse-surface px-3 py-2.5 text-inverse-on-surface shadow-lg">
          <span className="mr-2 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-title-md text-title-md">
            <Icon name="check_circle" className="text-[18px]" /> {selectedRows.length} item{selectedRows.length > 1 ? "s" : ""} selected
          </span>
          {one && can(one.role, "EDITOR") && <BarBtn icon="person_add" label="Share" onClick={() => onShare(one)} />}
          <BarBtn icon="download" label="Download" onClick={() => downloadMany(selectedRows)} />
          {allEditable && folder && <BarBtn icon="drive_file_move" label="Move" onClick={() => setMoveRows(selectedRows)} />}
          {one && can(one.role, "EDITOR") && <BarBtn icon="edit" label="Rename" onClick={() => setNameDialog({ mode: "rename", row: one })} />}
          {allEditable && <BarBtn icon="delete" label="Delete" onClick={() => setTrashRows(selectedRows)} />}
          <span className="ml-auto hidden font-body-sm text-body-sm text-white/70 md:inline">
            {one ? `${one.name}${one.type === "file" ? ` · ${formatBytes(one.size)}` : ""}` : `${formatBytes(selectedRows.reduce((a, r) => a + r.size, 0))}`}
          </span>
          <button aria-label="Clear selection" onClick={() => setSelected(new Set())} className="ml-2 rounded-lg p-1.5 hover:bg-white/10">
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-surface px-6 py-16 text-center shadow-sm">
          {emptyState ?? (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-fixed text-primary-container">
                <Icon name="folder_open" className="text-[32px]" />
              </div>
              <p className="font-headline-sm text-headline-sm text-text-primary">This folder is empty</p>
              <p className="mt-1 font-body-md text-body-md text-text-secondary">
                {canUpload ? "Upload files or create a folder to get started." : "Nothing has been added here yet."}
              </p>
            </>
          )}
        </div>
      ) : view === "list" ? (
        <>
        <ul className="divide-y divide-border rounded-xl bg-surface shadow-sm [&>li:first-child]:rounded-t-xl [&>li:last-child]:rounded-b-xl md:hidden">
          {sorted.map((r) => {
            const isSel = selected.has(r.id);
            return (
              <li key={r.id} className={`flex items-center gap-3 py-2.5 pl-3 pr-1 ${isSel ? "bg-primary-soft" : ""}`}>
                <input type="checkbox" aria-label={`Select ${r.name}`} checked={isSel} onChange={() => toggle(r.id)} className="h-4 w-4 shrink-0 accent-primary-container" />
                <Opener row={r} onOpen={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <FileIcon type={r.type} name={r.name} mime={r.mimeType} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-title-md text-title-md text-text-primary">
                      <span className="truncate">{highlight ? <Highlight text={r.name} q={highlight} /> : r.name}</span>
                      {r.starred && <Icon name="star" fill className="shrink-0 text-[15px] text-[#f59e0b]" />}
                      {(r.hasLink || r.sharedCount > 0) && <Icon name={r.hasLink ? "link" : "group"} className="shrink-0 text-[15px] text-primary" />}
                    </span>
                    <span className="block truncate font-body-sm text-body-sm text-text-secondary">
                      {r.type === "folder" ? "Folder" : formatBytes(r.size)} · {formatDate(r.updatedAt)}
                      {showLocation && r.location ? ` · ${r.location}` : ""}
                    </span>
                  </span>
                </Opener>
                <RowMenu items={actionsFor(r)} />
              </li>
            );
          })}
          <li className="px-4 py-3 font-body-sm text-body-sm text-text-secondary">
            {sorted.length} items · {formatBytes(totalSize)}
          </li>
        </ul>
        <div className="hidden overflow-x-auto rounded-xl bg-surface shadow-sm md:block">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-surface-container-low/60">
              <tr className="font-title-md text-title-md text-text-secondary">
                <th className="w-12 py-4 pl-5">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={selected.size === sorted.length}
                    onChange={(e) => setSelected(e.target.checked ? new Set(sorted.map((r) => r.id)) : new Set())}
                    className="h-4 w-4 accent-primary-container"
                  />
                </th>
                {headerCell("Name", "name", "text-text-primary")}
                {showLocation && headerCell("Location")}
                {headerCell("Owner")}
                {headerCell("Last modified", "updatedAt")}
                {headerCell("File size", "size", "text-right")}
                {headerCell("Sharing")}
                <th className="w-40" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const isSel = selected.has(r.id);
                return (
                  <tr
                    key={r.id}
                    onDoubleClick={() => r.type === "file" && open(r)}
                    className={`group border-t border-border transition-colors ${isSel ? "bg-primary-soft" : "hover:bg-surface-container-low/60"}`}
                  >
                    <td className="py-3 pl-5">
                      <input type="checkbox" aria-label={`Select ${r.name}`} checked={isSel} onChange={() => toggle(r.id)} className="h-4 w-4 accent-primary-container" />
                    </td>
                    <td className="px-3 py-3">
                      <Opener row={r} onOpen={open} className="flex max-w-[420px] items-center gap-3 text-left">
                        <FileIcon type={r.type} name={r.name} mime={r.mimeType} />
                        <span className="min-w-0">
                          <span className={`flex items-center gap-1.5 font-title-md text-title-md ${isSel ? "text-primary" : "text-text-primary"}`}>
                            <span className="truncate">{highlight ? <Highlight text={r.name} q={highlight} /> : r.name}</span>
                            {r.starred && <Icon name="star" fill className="text-[16px] text-[#f59e0b]" />}
                          </span>
                          <span className="block truncate font-body-sm text-body-sm text-text-secondary">{kindLabel(r.type, r.name, r.mimeType)}</span>
                        </span>
                      </Opener>
                    </td>
                    {showLocation && <td className="px-3 py-3 font-body-md text-body-md text-text-secondary">{r.location ?? "—"}</td>}
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2 font-body-md text-body-md text-text-primary">
                        <Avatar name={r.ownerName} id={r.ownerId} size="h-7 w-7 text-[11px]" /> {r.ownerName}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-body-md text-body-md text-text-secondary">{formatDate(r.updatedAt)}</td>
                    <td className="px-3 py-3 text-right font-mono text-[13px] text-text-secondary">{r.type === "folder" ? "—" : formatBytes(r.size)}</td>
                    <td className="px-3 py-3">{sharingChip(r)}</td>
                    <td className="py-3 pr-4">{quickActions(r)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-container-low/60 px-5 py-3 font-body-sm text-body-sm text-text-secondary">
            <span>
              {sorted.length} items ({sorted.length - files.length} folders, {files.length} files) · Total: {formatBytes(totalSize)}
            </span>
            <span className="flex items-center gap-1.5 font-label-md text-label-md uppercase tracking-wider">
              Encrypted storage (AES-256) <Icon name="verified_user" className="text-[16px] text-tertiary" />
            </span>
          </div>
        </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sorted.map((r) => {
            const isSel = selected.has(r.id);
            const isImage = r.type === "file" && r.mimeType?.startsWith("image/") && !/svg/.test(r.mimeType);
            return (
              <div
                key={r.id}
                className={`group relative flex flex-col overflow-hidden rounded-xl bg-surface shadow-sm transition-shadow hover:shadow-md ${isSel ? "ring-2 ring-primary-container" : ""}`}
              >
                <Opener row={r} onOpen={open} className="flex aspect-[4/3] items-center justify-center bg-surface-container-low">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={downloadUrl(r, true)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <FileIcon type={r.type} name={r.name} mime={r.mimeType} size="xl" />
                  )}
                </Opener>
                <input
                  type="checkbox"
                  aria-label={`Select ${r.name}`}
                  checked={isSel}
                  onChange={() => toggle(r.id)}
                  className={`absolute left-3 top-3 h-4 w-4 accent-primary-container ${isSel ? "" : "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100"}`}
                />
                {r.starred && <Icon name="star" fill className="absolute right-3 top-3 text-[20px] text-[#f59e0b]" />}
                <div className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-title-md text-title-md text-text-primary">{r.name}</p>
                    <p className="truncate font-body-sm text-body-sm text-text-secondary">
                      {r.type === "folder" ? "Folder" : formatBytes(r.size)} · {formatDate(r.updatedAt)}
                    </p>
                  </div>
                  <RowMenu
                    items={[
                      { label: "Open", icon: "open_in_new", onClick: () => open(r) },
                      ...(can(r.role, "EDITOR") ? [{ label: "Share", icon: "share", onClick: () => onShare(r) }] : []),
                      { label: r.type === "folder" ? "Download as .zip" : "Download", icon: "download", onClick: () => downloadMany([r]) },
                      { label: r.starred ? "Unstar" : "Star", icon: "star", onClick: () => toggleStar(r) },
                      ...(can(r.role, "EDITOR")
                        ? [
                            { label: "Rename", icon: "edit", onClick: () => setNameDialog({ mode: "rename", row: r }) },
                            ...(folder ? [{ label: "Move", icon: "drive_file_move", onClick: () => setMoveRows([r]) }] : []),
                            { label: "Move to trash", icon: "delete", danger: true, onClick: () => setTrashRows([r]) },
                          ]
                        : []),
                    ]}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dragging && folder && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-primary-container/10 p-8 backdrop-blur-[2px] lg:left-[260px]">
          <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border-[3px] border-dashed border-primary-container bg-surface/80">
            <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-xl">
              <Icon name="cloud_upload" className="text-[56px]" />
            </div>
            <p className="font-headline-lg text-[28px] text-text-primary">Drop files to upload to {folder.name}</p>
            <p className="mt-2 font-body-md text-body-md text-text-secondary">Files are encrypted and saved immediately.</p>
          </div>
        </div>
      )}

      <UploadPanel tasks={uploads.tasks} onCancel={uploads.cancel} onRetry={uploads.retry} onClose={uploads.clear} />

      <NameDialog
        open={!!nameDialog}
        mode={nameDialog?.mode ?? "folder"}
        initial={nameDialog?.mode === "rename" ? nameDialog.row!.name : "Untitled folder"}
        location={nameDialog?.mode === "rename" ? `Rename ${nameDialog.row!.type} in ${locationLabel ?? folder?.name ?? ""}` : (locationLabel ?? folder?.name ?? "")}
        onClose={() => setNameDialog(null)}
        onSubmit={async (name) => {
          if (nameDialog?.mode === "folder") {
            const res = await api<{ name: string }>("/api/folders", { body: { parentId: folder!.id, name } });
            toast(`Created folder "${res.name}"`);
          } else {
            await api(`/api/items/${nameDialog!.row!.id}`, { method: "PATCH", body: { name } });
            toast(`Renamed to "${name.trim()}"`);
          }
          refresh();
        }}
      />

      <TrashDialog
        rows={trashRows}
        onClose={() => setTrashRows(null)}
        onConfirm={async () => {
          const list = trashRows!;
          try {
            await api("/api/items/trash", { body: { ids: list.map((r) => r.id) } });
            setTrashRows(null);
            setSelected(new Set());
            toast(list.length === 1 ? `"${list[0].name}" moved to trash` : `${list.length} items moved to trash`, {
              action: {
                label: "Undo",
                onClick: async () => {
                  for (const r of list) await api(`/api/trash/${r.id}/restore`, { body: {} }).catch(() => {});
                  refresh();
                },
              },
            });
            refresh();
          } catch (e) {
            toast((e as Error).message, { tone: "error" });
          }
        }}
      />

      <MoveDialog
        rows={moveRows}
        startFolderId={folder?.id ?? ""}
        onClose={() => setMoveRows(null)}
        onMove={async (targetId) => {
          await api("/api/items/move", { body: { ids: moveRows!.map((r) => r.id), targetId } });
          toast(moveRows!.length === 1 ? `Moved "${moveRows![0].name}"` : `Moved ${moveRows!.length} items`);
          setMoveRows(null);
          setSelected(new Set());
          refresh();
        }}
      />

      {shareRow && <ShareDialog itemId={shareRow.id} meId={meId} onClose={() => setShareRow(null)} onChanged={refresh} />}

      {preview !== null && files[preview] && (
        <Preview
          rows={files}
          index={preview}
          location={files[preview].location ?? locationLabel ?? folder?.name ?? ""}
          onIndex={setPreview}
          onClose={() => setPreview(null)}
          downloadUrl={downloadUrl}
          onStar={(r) => toggleStar(r as BrowserRow)}
          onShare={(r) => onShare(r as BrowserRow)}
          canShare={can(files[preview].role, "EDITOR")}
        />
      )}
    </div>
  );
}

function IconBtn({ label, icon, onClick, fill, className = "" }: { label: string; icon: string; onClick: () => void; fill?: boolean; className?: string }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={`flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-on-surface-variant shadow-sm hover:text-primary ${className}`}>
      <Icon name={icon} fill={fill} className="text-[20px]" />
    </button>
  );
}

function BarBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-title-md text-title-md hover:bg-white/10">
      <Icon name={icon} className="text-[20px]" /> {label}
    </button>
  );
}

export function RowMenu({ items }: { items: { label: string; icon: string; danger?: boolean; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button aria-label="More actions" onClick={(e) => {
          setUp(window.innerHeight - e.currentTarget.getBoundingClientRect().bottom < 320);
          setOpen((o) => !o);
        }} className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-text-primary">
        <Icon name="more_horiz" className="text-[20px]" />
      </button>
      {open && (
        <div className={`absolute right-0 ${up ? "bottom-10" : "top-10"} z-30 w-52 rounded-xl bg-surface py-1 text-left shadow-[0_10px_30px_rgba(0,0,0,0.12)]`}>
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 font-body-md text-body-md hover:bg-surface-container-low ${it.danger ? "text-danger" : "text-text-primary"}`}
            >
              <Icon name={it.icon} className="text-[20px]" /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Breadcrumbs({ crumbs, rootLabel, rootHref }: { crumbs: { id: string; name: string }[]; rootLabel?: string; rootHref?: string }) {
  return (
    <nav className="mb-2 flex flex-wrap items-center gap-1 font-title-md text-title-md">
      {rootLabel && (
        <>
          <Link href={rootHref ?? "/files"} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-text-secondary hover:bg-surface-container-low hover:text-text-primary">
            <Icon name="group" className="text-[20px]" /> {rootLabel}
          </Link>
          <Icon name="chevron_right" className="text-[20px] text-outline" />
        </>
      )}
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        const href = i === 0 && !rootLabel ? "/files" : `/folders/${c.id}`;
        return (
          <span key={c.id} className="flex items-center gap-1">
            {i > 0 && <Icon name="chevron_right" className="text-[20px] text-outline" />}
            {last ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-2 py-1 text-text-primary">
                <Icon name="folder" className="text-[20px] text-primary" /> {c.name}
              </span>
            ) : (
              <Link href={href} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-text-secondary hover:bg-surface-container-low hover:text-text-primary">
                <Icon name="folder" className="text-[20px]" /> {c.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-primary-fixed px-0.5 text-primary">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

// Folders are real links so Next preloads their contents while they're on screen,
// which makes opening them instant; files open the preview.
function Opener({ row, onOpen, className, children }: { row: BrowserRow; onOpen: (r: BrowserRow) => void; className: string; children: React.ReactNode }) {
  if (row.type === "folder") {
    return (
      <Link href={`/folders/${row.id}`} prefetch className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={() => onOpen(row)} className={className}>
      {children}
    </button>
  );
}
