"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Avatar } from "../Avatar";
import { Icon } from "../Icon";
import { Toaster } from "../toast";

const NAV = [
  { href: "/platform", label: "Overview", icon: "dashboard", exact: true },
  { href: "/platform/workspaces", label: "Workspaces", icon: "domain" },
  { href: "/platform/users", label: "Users", icon: "group" },
  { href: "/platform/abuse", label: "Abuse reports", icon: "shield", badge: true },
];

export function PlatformShell({ user, openReports, children }: { user: { id: string; name: string; email: string }; openReports: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (n: (typeof NAV)[number]) => (n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(n.href + "/"));

  return (
    <div className="min-h-screen bg-canvas">
      {open && <div className="fixed inset-0 z-40 bg-inverse-surface/30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col justify-between bg-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <div className="flex h-16 items-center gap-2 px-space-lg">
            <Link href="/platform" className="flex items-center gap-space-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary shadow-sm">
                <Icon name="cloud" className="text-[20px]" />
              </div>
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">MacTidar</span>
            </Link>
            <span className="rounded-full bg-[#f3e8ff] px-2 py-0.5 font-label-sm text-label-sm text-file-image">Platform admin</span>
          </div>
          <div className="px-space-lg pb-space-xs pt-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Platform</span>
          </div>
          <nav className="flex flex-col gap-0.5 px-space-md">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                aria-current={active(n) ? "page" : undefined}
                className={`flex items-center gap-space-md rounded-lg px-space-md py-2.5 font-title-md text-title-md transition-colors ${active(n) ? "bg-primary-container text-on-primary" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"}`}
              >
                <Icon name={n.icon} className="text-[20px]" fill={active(n)} />
                <span className="flex-1">{n.label}</span>
                {n.badge && openReports > 0 && (
                  <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-label-sm text-label-sm ${active(n) ? "bg-white text-danger" : "bg-danger text-white"}`}>{openReports}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="px-space-md pb-space-md">
          <Link href="/files" className="flex items-center gap-space-md rounded-lg px-space-md py-2.5 font-title-md text-title-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface">
            <Icon name="open_in_new" className="text-[20px]" /> Back to user app
          </Link>
          <div className="mt-space-sm flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
            <Avatar name={user.name} id={user.id} />
            <div className="min-w-0">
              <p className="truncate font-title-md text-title-md text-text-primary">{user.name}</p>
              <p className="truncate font-body-sm text-body-sm text-text-secondary">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center gap-3 bg-surface/90 px-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:hidden">
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low">
          <Icon name="menu" className="text-[22px]" />
        </button>
        <span className="font-title-md text-title-md text-text-primary">Platform admin</span>
      </header>
      <main className="px-space-md pb-16 pt-[76px] lg:ml-[260px] lg:px-space-xl lg:pt-space-xl">{children}</main>
      <Toaster />
    </div>
  );
}

export function PageHeader({ crumb, title, subtitle, children }: { crumb?: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-space-lg flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {crumb && <div className="mb-1 flex items-center gap-1 font-body-sm text-body-sm text-text-secondary">{crumb}</div>}
        <h1 className="font-headline-lg text-headline-lg text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl font-body-md text-body-md text-text-secondary">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export const card = "rounded-2xl bg-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)]";

export function StatusPill({ status }: { status: string }) {
  const ok = status === "ACTIVE";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-label-md text-label-md ${ok ? "bg-tertiary-fixed/60 text-on-tertiary-fixed-variant" : "bg-error-container text-danger"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-tertiary" : "bg-danger"}`} />
      {ok ? "Active" : status === "SUSPENDED" ? "Suspended" : "Disabled"}
    </span>
  );
}

export function TypePill({ type }: { type?: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 font-label-md text-label-md ${type === "COMPANY" ? "bg-primary-soft text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
      {type === "COMPANY" ? "Company" : "Personal"}
    </span>
  );
}

export function WsBadge({ name, type, suspended }: { name: string; type?: string; suspended?: boolean }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-title-md text-[16px] ${suspended ? "bg-error-container text-danger" : type === "COMPANY" ? "bg-primary-soft text-primary" : "bg-[#f3e8ff] text-file-image"}`}
    >
      {suspended ? <Icon name="lock" className="text-[20px]" /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}
