"use client";

import { Suspense, useState } from "react";
import { Toaster } from "../toast";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({
  user,
  usedBytes,
  quotaBytes,
  children,
}: {
  user: { id: string; name: string; email: string; role: string };
  usedBytes: number;
  quotaBytes: number;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar isAdmin={user.role === "ADMIN"} usedBytes={usedBytes} quotaBytes={quotaBytes} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Suspense>
        <TopBar user={user} onMenu={() => setMenuOpen(true)} />
      </Suspense>
      <main className="px-space-md pb-16 pt-[88px] lg:ml-[260px] lg:px-space-xl">{children}</main>
      <Toaster />
    </div>
  );
}
