"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { btn, Dialog } from "@/components/Dialog";
import { FileIcon } from "@/components/files/FileIcon";
import { Icon } from "@/components/Icon";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/format";

type TrashRow = {
  id: string;
  type: "folder" | "file";
  name: string;
  mimeType?: string;
  size: number;
  location: string;
  deletedById: string;
  deletedByName: string;
  trashedAt: string;
  isOwner: boolean;
};

const RETENTION_DAYS = 30;
const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() + RETENTION_DAYS * 86400_000 - Date.now()) / 86400_000));

export function TrashView({ rows, meId }: { rows: TrashRow[]; meId: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [type, setType] = useState<"all" | "folder" | "file">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ rows: TrashRow[] } | "empty" | null>(null);
  const [busy, setBusy] = useState(false);

  const shown = useMemo(
    () => rows.filter((r) => r.name.toLowerCase().includes(filter.toLowerCase()) && (type === "all" || r.type === type)),
    [rows, filter, type],
  );
  const selectedRows = shown.filter((r) => selected.has(r.id));
  const expiring = rows.filter((r) => daysLeft(r.trashedAt) <= 3).length;
  const total = rows.reduce((a, r) => a + r.size, 0);

  async function restore(list: TrashRow[]) {
    setBusy(true);
    try {
      for (const r of list) await api(`/api/trash/${r.id}/restore`, { body: {} });
      toast(list.length === 1 ? `Restored "${list[0].name}"` : `Restored ${list.length} items`);
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    setBusy(true);
    try {
      if (confirm === "empty") {
        await api("/api/trash/empty", { body: {} });
        toast("Trash emptied");
      } else if (confirm) {
        for (const r of confirm.rows) await api(`/api/trash/${r.id}`, { method: "DELETE" });
        toast(confirm.rows.length === 1 ? `"${confirm.rows[0].name}" deleted forever` : `${confirm.rows.length} items deleted forever`);
      }
      setConfirm(null);
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  const confirmRows = confirm === "empty" ? rows.filter((r) => r.isOwner) : (confirm?.rows ?? []);
  const confirmBytes = confirmRows.reduce((a, r) => a + r.size, 0);

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high">
            <Icon name="delete" className="text-[26px] text-on-surface-variant" />
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary">Trash</h1>
            <p className="font-body-md text-body-md text-text-secondary">
              {rows.length} item{rows.length === 1 ? "" : "s"} scheduled for automatic purging
            </p>
          </div>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter trash..." className="h-11 w-full rounded-full bg-surface pl-10 sm:w-64 pr-4 font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container/20" />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="h-11 rounded-full bg-surface px-4 font-title-md text-title-md shadow-sm">
            <option value="all">All types</option>
            <option value="file">Files</option>
            <option value="folder">Folders</option>
          </select>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl bg-[#fffbeb] p-5 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning/15 text-warning">
          <Icon name="auto_delete" className="text-[24px]" />
        </div>
        <div className="flex-1">
          <p className="font-title-md text-title-md text-text-primary">30-Day Permanent Deletion Window</p>
          <p className="font-body-md text-body-md text-text-secondary">Items in trash are permanently deleted after 30 days. They still count toward team storage until then.</p>
        </div>
        <button disabled={!rows.some((r) => r.isOwner)} onClick={() => setConfirm("empty")} className="flex h-10 items-center gap-2 rounded-full bg-surface px-5 font-title-md text-title-md text-danger shadow-sm hover:bg-error-container/40 disabled:opacity-50">
          <Icon name="delete_sweep" className="text-[20px]" /> Empty trash
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className={`flex flex-1 flex-wrap items-center gap-3 rounded-xl bg-surface p-3 shadow-sm transition-opacity ${selectedRows.length ? "" : "opacity-60"}`}>
          <span className="flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 font-title-md text-title-md text-primary">
            <Icon name="check_circle" className="text-[18px]" /> {selectedRows.length} items selected
          </span>
          <button disabled={!selectedRows.length || busy} onClick={() => restore(selectedRows)} className={btn.primary}>
            <Icon name="restore" className="text-[18px]" /> Restore
          </button>
          <button
            disabled={!selectedRows.length || busy || !selectedRows.every((r) => r.isOwner)}
            onClick={() => setConfirm({ rows: selectedRows })}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-error-container/60 px-5 font-title-md text-title-md text-danger hover:bg-error-container disabled:opacity-50"
          >
            <Icon name="delete_forever" className="text-[18px]" /> Delete forever
          </button>
          {selectedRows.length > 0 && (
            <button aria-label="Clear selection" onClick={() => setSelected(new Set())} className="ml-auto rounded-lg p-1.5 text-outline hover:text-text-primary">
              <Icon name="close" className="text-[20px]" />
            </button>
          )}
        </div>
        {expiring > 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-surface px-5 py-3 shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-danger" />
            <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">Critical state</span>
            <span className="font-title-md text-title-md text-danger">{expiring} expiring soon</span>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-surface px-6 py-16 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high">
            <Icon name="delete" className="text-[32px] text-outline" />
          </div>
          <p className="font-headline-sm text-headline-sm text-text-primary">Trash is empty</p>
          <p className="mt-1 font-body-md text-body-md text-text-secondary">Items you delete will appear here for 30 days.</p>
        </div>
      ) : (
        <>
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-sm md:hidden">
          {shown.map((r) => {
            const left = daysLeft(r.trashedAt);
            const isSel = selected.has(r.id);
            return (
              <li key={r.id} className={`flex items-center gap-3 py-2.5 pl-3 pr-2 ${isSel ? "bg-primary-soft" : ""}`}>
                <input
                  type="checkbox"
                  aria-label={`Select ${r.name}`}
                  checked={isSel}
                  onChange={() =>
                    setSelected((s) => {
                      const n = new Set(s);
                      if (n.has(r.id)) n.delete(r.id);
                      else n.add(r.id);
                      return n;
                    })
                  }
                  className="h-4 w-4 shrink-0 accent-primary-container"
                />
                <FileIcon type={r.type} name={r.name} mime={r.mimeType} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-title-md text-title-md text-text-primary">{r.name}</p>
                  <p className="truncate font-body-sm text-body-sm text-text-secondary">
                    <span className={left <= 3 ? "font-medium text-danger" : ""}>{left} day{left === 1 ? "" : "s"} left</span> · {r.location}
                  </p>
                </div>
                <button aria-label={`Restore ${r.name}`} onClick={() => restore([r])} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary-soft">
                  <Icon name="restore" className="text-[22px]" />
                </button>
              </li>
            );
          })}
          <li className="px-4 py-3 font-body-sm text-body-sm text-text-secondary">
            {shown.length} of {rows.length} items · {formatBytes(total)}
          </li>
        </ul>
        <div className="hidden overflow-x-auto rounded-xl bg-surface shadow-sm md:block">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-surface-container-low/60">
              <tr className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">
                <th className="w-12 py-4 pl-5">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={shown.length > 0 && selectedRows.length === shown.length}
                    onChange={(e) => setSelected(e.target.checked ? new Set(shown.map((r) => r.id)) : new Set())}
                    className="h-4 w-4 accent-primary-container"
                  />
                </th>
                <th className="px-3 py-4 font-medium">Name</th>
                <th className="px-3 py-4 font-medium">Original location</th>
                <th className="px-3 py-4 font-medium">Deleted by</th>
                <th className="px-3 py-4 font-medium">Date deleted</th>
                <th className="px-3 py-4 font-medium">Retention</th>
                <th className="w-32" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const left = daysLeft(r.trashedAt);
                const isSel = selected.has(r.id);
                return (
                  <tr key={r.id} className={`group border-t border-border ${isSel ? "bg-primary-soft" : "hover:bg-surface-container-low/60"}`}>
                    <td className="py-3 pl-5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.name}`}
                        checked={isSel}
                        onChange={() =>
                          setSelected((s) => {
                            const n = new Set(s);
                            if (n.has(r.id)) n.delete(r.id);
                            else n.add(r.id);
                            return n;
                          })
                        }
                        className="h-4 w-4 accent-primary-container"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-3">
                        <FileIcon type={r.type} name={r.name} mime={r.mimeType} />
                        <span className="font-title-md text-title-md text-text-primary">{r.name}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 font-body-md text-body-md text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <Icon name="folder" className="text-[18px]" /> {r.location}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2 font-body-md text-body-md">
                        <Avatar name={r.deletedByName} id={r.deletedById} size="h-7 w-7 text-[11px]" />
                        {r.deletedById === meId ? "You" : r.deletedByName}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-body-md text-body-md text-text-secondary">{formatDate(r.trashedAt)}</td>
                    <td className="px-3 py-3">
                      {left <= 3 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-error-container/70 px-2.5 py-0.5 font-label-md text-label-md text-danger">
                          <Icon name="warning" className="text-[14px]" /> {left} day{left === 1 ? "" : "s"} left
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 font-body-sm text-body-sm text-text-secondary">
                          <Icon name="schedule" className="text-[16px]" /> {left} days
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button title="Restore" onClick={() => restore([r])} className="flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-primary-soft">
                          <Icon name="restore" className="text-[20px]" />
                        </button>
                        {r.isOwner && (
                          <button title="Delete forever" onClick={() => setConfirm({ rows: [r] })} className="flex h-9 w-9 items-center justify-center rounded-lg text-danger hover:bg-error-container/50">
                            <Icon name="delete_forever" className="text-[20px]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-border bg-surface-container-low/60 px-5 py-3 font-body-sm text-body-sm text-text-secondary">
            Showing {shown.length} of {rows.length} items · Total trash space: {formatBytes(total)}
          </div>
        </div>
        </>
      )}

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          <span className="flex flex-col">
            <span>{confirm === "empty" ? "Empty trash?" : "Delete forever?"}</span>
            <span className="font-body-sm text-body-sm font-normal text-danger">Irreversible action</span>
          </span>
        }
        icon={
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-error-container text-danger">
            <Icon name="warning" className="text-[22px]" />
          </div>
        }
        footer={
          <>
            <button className={btn.secondary} onClick={() => setConfirm(null)}>Cancel</button>
            <button className={btn.danger} disabled={busy} onClick={destroy}>
              <Icon name="delete_forever" className="text-[18px]" /> {busy ? "Deleting…" : "Delete forever"}
            </button>
          </>
        }
      >
        <p className="mb-4 font-body-md text-body-md text-text-primary">
          {confirmRows.length === 1 ? (
            <>
              <b>&lsquo;{confirmRows[0].name}&rsquo;</b> will be permanently deleted. This cannot be undone.
            </>
          ) : (
            <>{confirmRows.length} items will be permanently deleted. This cannot be undone.</>
          )}
        </p>
        <div className="mb-4 flex gap-3 rounded-xl bg-error-container/50 p-4 text-on-error-container">
          <Icon name="warning" className="text-[20px] text-danger" />
          <div className="font-body-md text-body-md">
            <p className="font-label-md text-label-md text-danger">Immediate consequence</p>
            Teammates with access will also permanently lose it. Storage ({formatBytes(confirmBytes)}) will be freed immediately.
          </div>
        </div>
        <div className="flex justify-between rounded-xl bg-surface-container-low p-4">
          <div>
            <p className="font-label-md text-label-md text-text-secondary">Items</p>
            <p className="font-title-md text-title-md">{confirmRows.length}</p>
          </div>
          <div className="text-right">
            <p className="font-label-md text-label-md text-text-secondary">Space recouped</p>
            <p className="font-title-md text-title-md text-tertiary">+{formatBytes(confirmBytes)}</p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
