"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { btn, Dialog } from "../Dialog";
import { Icon } from "../Icon";
import { FileIcon } from "./FileIcon";
import type { Crumb, Row } from "./types";

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-2 flex items-start gap-1.5 font-label-md text-label-md text-danger">
      <Icon name="error" className="mt-px text-[16px]" /> {message}
    </p>
  );
}

export function NameDialog({
  open,
  mode,
  initial,
  location,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "folder" | "rename";
  initial: string;
  location: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial);
    setError(null);
    setTimeout(() => {
      const el = input.current;
      if (!el) return;
      el.focus();
      // Select the name without the extension, like the design.
      const dot = mode === "rename" ? initial.lastIndexOf(".") : -1;
      el.setSelectionRange(0, dot > 0 ? dot : initial.length);
    }, 30);
  }, [open, initial, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(name);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="max-w-[480px]"
      title={
        <span className="flex flex-col">
          <span>{mode === "folder" ? "New folder" : "Rename item"}</span>
          <span className="font-body-sm text-body-sm font-normal text-text-secondary">{location}</span>
        </span>
      }
      icon={
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${mode === "folder" ? "bg-primary-fixed text-primary-container" : "bg-surface-container-high text-on-surface"}`}>
          <Icon name={mode === "folder" ? "create_new_folder" : "edit"} className="text-[22px]" />
        </div>
      }
    >
      <form onSubmit={submit} id="name-form">
        <label className="mb-1.5 block font-body-sm text-body-sm text-text-primary">{mode === "folder" ? "Folder name" : "New item name"}</label>
        <input
          ref={input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`h-12 w-full rounded-lg px-4 font-body-md text-body-md outline-none ring-2 ${error ? "bg-error-container/20 ring-danger" : "ring-primary-container"}`}
        />
        <ErrorLine message={error} />
        <div className="mt-6 flex justify-end gap-3 pb-3">
          <button type="button" className={btn.secondary} onClick={onClose}>Cancel</button>
          <button type="submit" className={btn.primary} disabled={busy || !name.trim() || (mode === "rename" && name.trim() === initial)}>
            {mode === "folder" ? (busy ? "Creating…" : "Create") : busy ? "Renaming…" : "Rename"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function TrashDialog({
  rows,
  onClose,
  onConfirm,
}: {
  rows: Row[] | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open={!!rows}
      onClose={onClose}
      width="max-w-[520px]"
      title={
        <span className="flex flex-col">
          <span>Move to trash?</span>
          <span className="font-body-sm text-body-sm font-normal text-text-secondary">Reversible operation</span>
        </span>
      }
      icon={
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning/10 text-warning">
          <Icon name="delete" className="text-[22px]" />
        </div>
      }
      footer={
        <>
          <button className={btn.secondary} onClick={onClose}>Cancel</button>
          <button
            className={btn.danger}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm().finally(() => setBusy(false));
            }}
          >
            <Icon name="delete_sweep" className="text-[18px]" /> {busy ? "Moving…" : "Move to trash"}
          </button>
        </>
      }
    >
      <p className="mb-3 font-title-md text-title-md text-text-primary">
        {rows?.length === 1 ? `"${rows[0].name}" will be moved to trash.` : `${rows?.length} items will be moved to trash.`}
      </p>
      <div className="mb-3 flex items-start gap-2.5 rounded-xl bg-surface-container-low p-3.5 font-body-md text-body-md text-text-secondary">
        <Icon name="history" className="mt-0.5 text-[18px]" />
        <span>
          You can restore {rows?.length === 1 ? "it" : "them"} within <b className="text-text-primary">30 days</b> before permanent deletion.
        </span>
      </div>
      {rows && rows.length > 1 && (
        <div className="max-h-40 overflow-y-auto rounded-xl p-3 shadow-[inset_0_0_0_1px_#E5E7EB]">
          <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">Selected items</p>
          {rows.map((r) => (
            <p key={r.id} className="flex items-center gap-2 py-1 font-body-md text-body-md">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" /> {r.name}
            </p>
          ))}
        </div>
      )}
    </Dialog>
  );
}

type FolderListing = { folder: { id: string; name: string; path: string }; crumbs: Crumb[]; folders: { id: string; name: string }[] };

export function MoveDialog({
  rows,
  startFolderId,
  onClose,
  onMove,
}: {
  rows: Row[] | null;
  startFolderId: string;
  onClose: () => void;
  onMove: (targetId: string) => Promise<void>;
}) {
  const [listing, setListing] = useState<FolderListing | null>(null);
  const [current, setCurrent] = useState(startFolderId);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (rows) setCurrent(startFolderId);
  }, [rows, startFolderId]);

  useEffect(() => {
    if (!rows) return;
    setListing(null);
    setError(null);
    api<FolderListing>(`/api/folders/${current}`)
      .then(setListing)
      .catch((e) => setError((e as Error).message));
  }, [current, rows]);

  if (!rows) return null;
  const movingIds = new Set(rows.map((r) => r.id));
  const total = rows.reduce((a, r) => a + r.size, 0);
  const isCurrentParent = current === startFolderId;
  const blocked = listing ? rows.some((r) => r.type === "folder" && listing.folder.path.includes(`/${r.id}/`)) : true;

  return (
    <Dialog
      open
      onClose={onClose}
      width="max-w-[680px]"
      title={
        <span className="flex flex-col">
          <span className="text-[24px] leading-8">Move {rows.length === 1 ? `"${rows[0].name}"` : `${rows.length} items`}</span>
          <span className="font-body-md text-body-md font-normal text-text-secondary">Select a destination folder</span>
        </span>
      }
      footer={
        <>
          <span className="mr-auto flex items-center gap-1.5 font-body-sm text-body-sm text-text-secondary">
            <Icon name="info" className="text-[16px]" />
            {isCurrentParent ? "Items are already here — choose another folder" : blocked ? "A folder can't move into itself" : `Move into ${listing?.folder.name}`}
          </span>
          <button className={btn.secondary} onClick={onClose}>Cancel</button>
          <button
            className={btn.primary}
            disabled={busy || !listing || isCurrentParent || blocked}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await onMove(current);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Icon name="drive_file_move" className="text-[18px]" /> {busy ? "Moving…" : "Move here"}
          </button>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-surface-container-low px-3.5 py-2.5 font-body-md text-body-md">
        <Icon name="drive_file_move" className="text-[20px] text-primary" />
        <span className="text-text-secondary">Moving:</span>
        <span className="min-w-0 flex-1 truncate text-text-primary">{rows.map((r) => r.name).join(", ")}</span>
        {total > 0 && <span className="font-label-md text-label-md text-text-secondary">({formatBytes(total)} total)</span>}
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1 font-title-md text-title-md">
          {listing && listing.crumbs.length > 1 && (
            <button aria-label="Back" onClick={() => setCurrent(listing.crumbs[listing.crumbs.length - 2].id)} className="mr-1 rounded-lg p-1 hover:bg-surface-container-low">
              <Icon name="arrow_back" className="text-[20px]" />
            </button>
          )}
          {listing?.crumbs.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1">
              {i > 0 && <Icon name="chevron_right" className="text-[18px] text-outline" />}
              <button onClick={() => setCurrent(c.id)} className={i === listing.crumbs.length - 1 ? "text-text-primary" : "text-text-secondary hover:text-text-primary"}>
                {c.name}
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search folders..." className="h-10 w-52 rounded-lg bg-surface-container-low pl-9 pr-3 font-body-md text-body-md focus:outline-none" />
        </div>
      </div>
      <div className="flex max-h-[300px] min-h-[160px] flex-col gap-2 overflow-y-auto rounded-xl bg-surface-container-low p-2.5">
        {!listing && !error && <p className="p-6 text-center text-text-secondary">Loading…</p>}
        {listing && listing.folders.filter((f) => f.name.toLowerCase().includes(filter.toLowerCase())).length === 0 && (
          <p className="p-6 text-center font-body-md text-body-md text-text-secondary">No folders here.</p>
        )}
        {listing?.folders
          .filter((f) => f.name.toLowerCase().includes(filter.toLowerCase()))
          .map((f) => {
            const disabled = movingIds.has(f.id);
            return (
              <button
                key={f.id}
                disabled={disabled}
                onClick={() => setCurrent(f.id)}
                className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-left shadow-sm transition-colors hover:bg-primary-soft disabled:opacity-50"
              >
                <FileIcon type="folder" name={f.name} />
                <span className="flex-1 font-title-md text-title-md text-text-primary">{f.name}</span>
                {disabled ? <span className="font-label-md text-label-md text-text-secondary">Being moved</span> : <Icon name="chevron_right" className="text-[20px] text-outline" />}
              </button>
            );
          })}
      </div>
      <ErrorLine message={error} />
    </Dialog>
  );
}
