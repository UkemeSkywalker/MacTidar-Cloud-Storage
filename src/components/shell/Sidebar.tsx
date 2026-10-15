"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatBytes } from "@/lib/format";
import { Icon } from "../Icon";

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

export function Sidebar({
  isAdmin,
  usedBytes,
  quotaBytes,
  open,
  onClose,
}: {
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
        <Icon name={item.icon} className={`text-[20px] ${active && item.icon === "folder" ? "text-file-folder" : ""}`} fill={active} />
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
            <Link href="/files" className="flex items-center gap-space-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary shadow-sm">
                <Icon name="cloud" className="text-[20px]" />
              </div>
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">MacTidar</span>
            </Link>
          </div>
          <div className="px-space-md pb-space-md pt-space-xs">
            <NewMenu />
          </div>
          <nav className="flex flex-col gap-0.5 px-space-md">{NAV.map(link)}</nav>
          {isAdmin && (
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

  const run = (action: "folder" | "upload") => {
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
        </div>
      )}
    </div>
  );
}
