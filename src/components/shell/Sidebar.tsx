"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/format";
import { Icon } from "../Icon";
import { Logo } from "../Logo";

const NAV = [
  { href: "/files", label: "My Files", icon: "folder", match: ["/files", "/folders"] },
  { href: "/shared", label: "Shared with me", icon: "group" },
  { href: "/recent", label: "Recent", icon: "schedule" },
  { href: "/starred", label: "Starred", icon: "star" },
  { href: "/trash", label: "Trash", icon: "delete" },
];

const ADMIN_NAV = [
  { href: "/admin/members", label: "Members", icon: "verified_user" },
  { href: "/admin/storage", label: "Storage", icon: "hard_drive" },
];

export type WorkspaceOption = { id: string; name: string; type: "PERSONAL" | "COMPANY"; role: string; usedBytes: number; quotaBytes: number };

export function Sidebar({
  workspace,
  workspaces,
  isAdmin,
  usedBytes,
  quotaBytes,
  open,
  onClose,
}: {
  workspace: { id: string; name: string; type: "PERSONAL" | "COMPANY"; teamFiles?: boolean };
  workspaces: WorkspaceOption[];
  isAdmin: boolean;
  usedBytes: number;
  quotaBytes: number;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const pct = quotaBytes ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : 0;

  const isActive = (item: { href: string; match?: string[] }) =>
    (item.match ?? [item.href]).some((m) => pathname === m || pathname.startsWith(m + "/"));

  const link = (item: { href: string; label: string; icon: string; match?: string[] }) => {
    const active = isActive(item);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-space-md rounded-lg px-space-md py-2.5 font-title-md text-title-md transition-colors ${active ? "bg-surface-container-low text-primary" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"}`}
      >
        <Icon name={item.icon} className={`text-[20px] ${active && item.icon.startsWith("folder") ? "text-file-folder" : ""}`} fill={active} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-inverse-surface/30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] select-none flex-col justify-between bg-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col overflow-y-auto">
          <div className="flex h-16 items-center px-space-lg">
            <Link href="/files" className="flex items-center">
              <Logo />
            </Link>
          </div>
          <WorkspaceSwitcher current={workspace} workspaces={workspaces} isAdmin={isAdmin} />
          <div className="px-space-md pb-space-md pt-space-xs">
            <NewMenu />
          </div>
          <nav className="flex flex-col gap-0.5 px-space-md">
            {(workspace.teamFiles
              ? // Everything in a company workspace is in Team Files, so there's nothing separate to be "shared with me".
                NAV.filter((n) => n.href !== "/shared").map((n) => (n.href === "/files" ? { ...n, label: "Team Files", icon: "folder_shared" } : n))
              : NAV
            ).map(link)}
          </nav>
          {isAdmin && workspace.type === "COMPANY" && (
            <>
              <div className="px-space-lg pb-space-xs pt-space-lg">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Admin</span>
              </div>
              <nav className="flex flex-col gap-0.5 px-space-md">{ADMIN_NAV.map(link)}</nav>
            </>
          )}
        </div>
        <div className="m-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-space-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-title-md text-title-md text-on-surface">
              <Icon name="cloud_queue" className="text-[18px] text-primary" />
              <span>Storage</span>
            </div>
            <span className="font-label-md text-label-md text-text-secondary">{pct}%</span>
          </div>
          <div className="mb-2 font-body-sm text-body-sm text-text-secondary">
            {formatBytes(usedBytes)} of {formatBytes(quotaBytes, 0)} used
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div className={`h-full rounded-full ${pct >= 90 ? "bg-danger" : pct >= 80 ? "bg-warning" : "bg-primary-container"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </aside>
    </>
  );
}

// "+ New" opens a small menu; the file pages listen for these actions.
function NewMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const run = (action: "folder" | "upload" | "upload-folder") => {
    setOpen(false);
    const onFilesPage = pathname === "/files" || pathname.startsWith("/folders/");
    if (onFilesPage) window.dispatchEvent(new CustomEvent("mt-new", { detail: action }));
    else router.push(`/files?action=${action}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex h-10 w-full items-center justify-between rounded-full bg-primary-container px-space-lg font-title-md text-title-md text-on-primary shadow-sm transition-colors hover:bg-primary"
      >
        <span className="flex items-center gap-space-sm">
          <Icon name="add" className="text-[20px]" />
          New
        </span>
        <Icon name="arrow_drop_down" className="text-[18px] opacity-80 group-hover:opacity-100" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl bg-surface py-1 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
          <button onClick={() => run("folder")} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-body-md text-body-md hover:bg-surface-container-low">
            <Icon name="create_new_folder" className="text-[20px] text-file-folder" /> New folder
          </button>
          <button onClick={() => run("upload")} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-body-md text-body-md hover:bg-surface-container-low">
            <Icon name="upload_file" className="text-[20px] text-primary" /> Upload files
          </button>
          <button onClick={() => run("upload-folder")} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-body-md text-body-md hover:bg-surface-container-low">
            <Icon name="drive_folder_upload" className="text-[20px] text-file-folder" /> Upload folder
          </button>
        </div>
      )}
    </div>
  );
}

function WorkspaceSwitcher({ current, workspaces, isAdmin }: { current: { id: string; name: string; type: string }; workspaces: WorkspaceOption[]; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const me = workspaces.find((w) => w.id === current.id);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function switchTo(id: string) {
    if (id === current.id) return setOpen(false);
    setBusy(id);
    const res = await fetch("/api/workspaces/switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: id }) });
    if (res.ok) window.location.href = "/files";
    else setBusy(null);
  }

  const badge = (w: { name: string; type: string }) => (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-title-md text-title-md ${w.type === "PERSONAL" ? "bg-[#f3e8ff] text-file-image" : "bg-primary-container text-white"}`}>
      {w.type === "PERSONAL" ? w.name.slice(0, 1).toUpperCase() + "P" : w.name.slice(0, 1).toUpperCase()}
    </div>
  );

  return (
    <div className="relative mx-space-md mb-space-sm" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-xl bg-surface-container-low px-2.5 py-2 text-left transition-colors hover:bg-surface-container"
      >
        {badge(current)}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-title-md text-title-md text-text-primary">{current.name}</span>
          <span className="block font-label-sm text-label-sm text-text-secondary">
            {current.type === "COMPANY" ? "Company" : "Personal"}
            {me ? ` · ${me.role === "ADMIN" ? "Admin" : "Member"}` : ""}
          </span>
        </span>
        <Icon name="unfold_more" className="text-[20px] text-on-surface-variant" />
      </button>
      {open && (
        <div className="fixed left-4 top-[124px] z-[60] w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">Your workspaces</span>
            <span className="rounded-full bg-primary-soft px-2 font-label-md text-label-md text-primary">{workspaces.length} active</span>
          </div>
          <div className="max-h-[320px] overflow-y-auto px-2">
            {workspaces.map((w) => {
              const pct = w.quotaBytes ? Math.min(100, (w.usedBytes / w.quotaBytes) * 100) : 0;
              const active = w.id === current.id;
              return (
                <button
                  key={w.id}
                  onClick={() => switchTo(w.id)}
                  disabled={!!busy}
                  className={`mb-1 w-full rounded-xl p-2.5 text-left transition-colors ${active ? "bg-primary-soft" : "hover:bg-surface-container-low"}`}
                >
                  <span className="flex items-center gap-3">
                    {badge(w)}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-title-md text-[15px] text-text-primary">{w.name}</span>
                        {w.type === "COMPANY" && (
                          <span className="rounded bg-surface-container-high px-1.5 font-label-sm text-label-sm uppercase text-on-surface-variant">{w.role === "ADMIN" ? "Admin" : "Member"}</span>
                        )}
                      </span>
                      <span className="block font-body-sm text-body-sm text-text-secondary">
                        {w.type === "COMPANY" ? "Company" : "Personal · Free"} · {formatBytes(w.usedBytes)} / {formatBytes(w.quotaBytes, 0)}
                      </span>
                    </span>
                    {busy === w.id ? (
                      <Icon name="progress_activity" className="animate-spin text-[20px] text-primary" />
                    ) : (
                      active && <Icon name="check_circle" className="text-[22px] text-primary" />
                    )}
                  </span>
                  <span className="mt-2 block h-1 overflow-hidden rounded-full bg-surface-container-high">
                    <span className={`block h-full rounded-full ${w.type === "PERSONAL" ? "bg-file-image" : "bg-primary-container"}`} style={{ width: `${pct}%` }} />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-1 border-t border-border p-2">
            <Link href="/onboarding?step=company" className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-title-md text-[15px] text-primary hover:bg-surface-container-low">
              <Icon name="add_business" className="text-[20px]" /> Create company workspace
            </Link>
            <Link
              href={current.type === "COMPANY" && isAdmin ? "/admin/storage" : "/settings#settings-sharing"}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-body-md text-[15px] text-text-primary hover:bg-surface-container-low"
            >
              <Icon name="settings" className="text-[20px] text-on-surface-variant" /> Workspace settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
