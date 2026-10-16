"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { btn, Dialog } from "./Dialog";
import { FileIcon } from "./files/FileIcon";
import { Icon } from "./Icon";

type Summary = {
  workspaceName: string;
  workspaceType: "PERSONAL" | "COMPANY";
  isAdmin: boolean;
  rootFolderId: string;
  usedBytes: number;
  quotaBytes: number;
  freeBytes: number;
  trashBytes: number;
  largest: { id: string; name: string; size: number; parentId: string | null; mimeType?: string }[];
};

export const STORAGE_FULL_EVENT = "mt-storage-full";

// Tells the dialog an upload was refused for lack of space.
export function reportStorageFull() {
  window.dispatchEvent(new Event(STORAGE_FULL_EVENT));
}

export function StorageFullDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Summary | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [freed, setFreed] = useState<number | null>(null);
  const closedAt = useRef(0);

  const load = useCallback(() => api<Summary>("/api/storage/summary").then(setData).catch(() => {}), []);

  useEffect(() => {
    const show = () => {
      // Several queued uploads fail together; don't reopen right after a close.
      if (Date.now() - closedAt.current < 5000) return;
      setOpen(true);
      setFreed(null);
      setConfirmEmpty(false);
      load();
    };
    window.addEventListener(STORAGE_FULL_EVENT, show);
    return () => window.removeEventListener(STORAGE_FULL_EVENT, show);
  }, [load]);

  const close = useCallback(() => {
    closedAt.current = Date.now();
    setOpen(false);
  }, []);

  async function emptyTrash() {
    setBusy(true);
    try {
      const before = data?.usedBytes ?? 0;
      await api("/api/trash/empty", { body: {} });
      const next = await api<Summary>("/api/storage/summary");
      setData(next);
      setFreed(Math.max(0, before - next.usedBytes));
      setConfirmEmpty(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const pct = data?.quotaBytes ? Math.min(100, Math.round((data.usedBytes / data.quotaBytes) * 100)) : 100;
  const full = pct >= 100 || (data?.freeBytes ?? 0) <= 0;
  const personal = data?.workspaceType === "PERSONAL";
  const quota = data ? formatBytes(data.quotaBytes, 0) : "";
  const folderHref = (f: Summary["largest"][number]) => (!f.parentId || f.parentId === data?.rootFolderId ? "/files" : `/folders/${f.parentId}`);
  const manage = data?.workspaceType === "COMPANY" && data.isAdmin ? { href: "/admin/storage", label: "Manage storage" } : { href: "/trash", label: "Open trash" };

  return (
    <Dialog open={open} onClose={close} width="max-w-[580px]" title="" footer={
      <>
        <button className={btn.secondary} onClick={close}>Close</button>
        <Link href={manage.href} onClick={close} className={btn.primary}>{manage.label}</Link>
      </>
    }>
      <div className="-mt-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fef3c7] text-warning">
          <Icon name="cloud_off" className="text-[32px]" />
        </div>
        <h2 className="mb-2 font-headline-lg text-headline-lg text-text-primary">
          {!data ? "Not enough storage" : !full ? "Not enough room for that upload" : personal ? `You've used your ${quota} of free storage` : `${data.workspaceName} is out of storage`}
        </h2>
        <p className="mb-6 max-w-md font-body-md text-[15px] text-text-secondary">
          {data && !full
            ? `Only ${formatBytes(data.freeBytes)} is left, which isn't enough for the file you picked. Free up space and try again.`
            : "New uploads are paused. Free up space by deleting files and emptying the trash, since files in the trash still count."}
        </p>
      </div>

      {data && (
        <>
          <div className="mb-6 rounded-xl bg-surface-container-low p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-title-md text-[15px] text-text-primary">
                {formatBytes(data.usedBytes)} of {quota} used ({pct}%)
              </span>
              {full && <span className="rounded-full bg-error-container px-2 py-0.5 font-label-sm text-label-sm uppercase text-danger">Storage full</span>}
            </div>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-surface-container-highest">
              <div className={`h-full rounded-full ${pct >= 90 ? "bg-danger" : "bg-warning"}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between font-label-md text-label-md text-text-secondary">
              <span>{personal ? "Personal workspace" : data.workspaceName}</span>
              <span className={full ? "text-danger" : ""}>{formatBytes(Math.max(0, data.freeBytes))} available</span>
            </div>
          </div>

          <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">Free up space</p>
          <div className="mb-3 flex items-center gap-3 rounded-xl p-3 shadow-[inset_0_0_0_1px_#E5E7EB]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant">
              <Icon name="delete_sweep" className="text-[22px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-title-md text-title-md text-text-primary">Empty your trash</span>
              <span className="block font-body-sm text-body-sm text-text-secondary">
                {freed !== null ? `Done, ${formatBytes(freed)} freed` : data.trashBytes ? `Frees ${formatBytes(data.trashBytes)} straight away` : "Your trash is already empty"}
              </span>
            </span>
            {data.trashBytes > 0 &&
              (confirmEmpty ? (
                <span className="flex gap-1">
                  <button className="rounded-full px-3 py-1.5 font-title-md text-label-md text-text-secondary hover:bg-surface-container-low" onClick={() => setConfirmEmpty(false)}>Cancel</button>
                  <button className="rounded-full bg-danger px-3 py-1.5 font-title-md text-label-md text-white disabled:opacity-60" disabled={busy} onClick={emptyTrash}>{busy ? "Emptying…" : "Delete forever"}</button>
                </span>
              ) : (
                <button className="rounded-full px-3 py-1.5 font-title-md text-label-md text-text-primary shadow-[inset_0_0_0_1px_#E5E7EB] hover:bg-surface-container-low" onClick={() => setConfirmEmpty(true)}>Empty trash</button>
              ))}
          </div>

          {data.largest.length > 0 && (
            <div className="mb-3 rounded-xl p-3 shadow-[inset_0_0_0_1px_#E5E7EB]">
              <p className="mb-2 font-title-md text-title-md text-text-primary">Your largest files</p>
              <ul className="space-y-1">
                {data.largest.map((f) => (
                  <li key={f.id}>
                    <Link href={folderHref(f)} onClick={close} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-container-low">
                      <FileIcon type="file" name={f.name} mime={f.mimeType} />
                      <span className="min-w-0 flex-1 truncate font-body-md text-body-md text-text-primary">{f.name}</span>
                      <span className="shrink-0 font-label-md text-label-md text-text-secondary">{formatBytes(f.size)}</span>
                      <Icon name="chevron_right" className="text-[18px] text-outline" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl bg-primary-soft p-3">
            <Icon name="rocket_launch" className="text-[22px] text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block font-title-md text-title-md text-primary">Need more space?</span>
              <span className="block font-body-sm text-body-sm text-text-secondary">
                {personal || data.isAdmin ? "Paid plans with more storage are coming soon." : "Ask an admin of this workspace for more storage."}
              </span>
            </span>
            {(personal || data.isAdmin) && (
              <a href="mailto:admin@mactidar.com?subject=More%20storage%20on%20MacTidar%20Cloud" className="shrink-0 rounded-full bg-surface px-3 py-1.5 font-title-md text-label-md text-primary shadow-sm hover:bg-surface-container-low">
                Contact us
              </a>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}
