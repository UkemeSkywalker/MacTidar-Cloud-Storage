"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Avatar } from "../Avatar";
import { Icon } from "../Icon";

export function TopBar({ user, onMenu }: { user: { id: string; name: string; email: string; role: string; platformAdmin?: boolean }; onMenu: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [menu, setMenu] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", close);
    };
  }, []);

  async function signOut() {
    await api("/api/auth/sign-out", { body: {} }).catch(() => {});
    window.location.href = "/sign-in";
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between gap-3 bg-surface/90 px-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:left-[260px] lg:px-space-lg">
      <button aria-label="Open menu" onClick={onMenu} className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low lg:hidden">
        <Icon name="menu" className="text-[22px]" />
      </button>
      <form
        className="w-full max-w-[540px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <div className="relative flex w-full items-center">
          <Icon name="search" className="pointer-events-none absolute left-3 text-[20px] text-outline" />
          <input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files and folders..."
            className="h-10 w-full rounded-lg bg-surface-container-low pl-10 pr-12 font-body-md text-body-md text-on-surface transition-all placeholder:text-outline focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20"
          />
          <kbd className="pointer-events-none absolute right-3 hidden rounded bg-surface px-1.5 py-0.5 font-label-sm text-label-sm text-on-surface-variant shadow-sm sm:block">
            ⌘K
          </kbd>
        </div>
      </form>
      <div className="flex items-center gap-space-sm">
        <a
          href="mailto:admin@mactidar.com"
          aria-label="Help"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface sm:flex"
        >
          <Icon name="help_outline" className="text-[20px]" />
        </a>
        <div className="mx-space-xs hidden h-6 w-px bg-surface-container-highest sm:block" />
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-space-sm rounded-lg py-1 pl-space-xs pr-1 transition-colors hover:bg-surface-container-low">
            <div className="relative">
              <Avatar name={user.name} id={user.id} />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-tertiary ring-2 ring-surface" />
            </div>
            <div className="hidden flex-col text-left md:flex">
              <span className="font-title-md text-title-md leading-tight text-on-surface">{user.name.split(" ")[0]}</span>
              <span className="font-label-sm text-label-sm leading-tight text-text-secondary">{user.role === "ADMIN" ? "Admin" : "Member"}</span>
            </div>
            <Icon name="expand_more" className="text-[20px] text-on-surface-variant" />
          </button>
          {menu && (
            <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl bg-surface py-1 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              <div className="border-b border-border px-4 py-3">
                <p className="font-title-md text-title-md text-text-primary">{user.name}</p>
                <p className="truncate font-body-sm text-body-sm text-text-secondary">{user.email}</p>
              </div>
              <Link href="/settings" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-2.5 font-body-md text-body-md hover:bg-surface-container-low">
                <Icon name="settings" className="text-[20px] text-on-surface-variant" /> Settings
              </Link>
              {user.platformAdmin && (
                <Link href="/platform" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-2.5 font-body-md text-body-md hover:bg-surface-container-low">
                  <Icon name="admin_panel_settings" className="text-[20px] text-file-image" /> Platform admin
                </Link>
              )}
              <button onClick={signOut} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-body-md text-body-md text-danger hover:bg-surface-container-low">
                <Icon name="logout" className="text-[20px]" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
