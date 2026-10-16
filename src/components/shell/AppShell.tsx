"use client";

import { Suspense, useState } from "react";
import { StorageFullDialog } from "../StorageFullDialog";
import { Toaster } from "../toast";
import { Sidebar, type WorkspaceOption } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({
  user,
  workspace,
  workspaces,
  usedBytes,
  quotaBytes,
  children,
}: {
  user: { id: string; name: string; email: string; role: string; platformAdmin?: boolean };
  workspace: { id: string; name: string; type: "PERSONAL" | "COMPANY" };
  workspaces: WorkspaceOption[];
  usedBytes: number;
  quotaBytes: number;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar workspace={workspace} workspaces={workspaces} isAdmin={user.role === "ADMIN"} usedBytes={usedBytes} quotaBytes={quotaBytes} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Suspense>
        <TopBar user={user} onMenu={() => setMenuOpen(true)} />
      </Suspense>
      <main className="px-space-md pb-16 pt-[88px] lg:ml-[260px] lg:px-space-xl">{children}</main>
      <StorageFullDialog />
      <Toaster />
    </div>
  );
}
