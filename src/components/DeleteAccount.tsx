"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { btn, Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { PasswordInput } from "./PasswordInput";

type Plan = {
  deleteWorkspaces: { id: string; name: string; type: "PERSONAL" | "COMPANY" }[];
  leaveWorkspaces: { id: string; name: string; transferTo: { id: string; name: string } }[];
  blockers: { id: string; name: string }[];
};

export function DeleteAccountDialog({ open, email, onClose }: { open: boolean; email: string; onClose: () => void }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlan(null);
    setTyped("");
    setPassword("");
    setError(null);
    api<Plan>("/api/me/deletion").then(setPlan).catch((e) => setError((e as Error).message));
  }, [open]);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/me/deletion", { body: { email: typed, password } });
      window.location.href = "/?deleted=1";
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const blocked = !!plan?.blockers.length;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="max-w-[560px]"
      title={
        <span className="flex flex-col">
          <span>Delete your account?</span>
          <span className="font-body-sm text-body-sm font-normal text-danger">This can&apos;t be undone</span>
        </span>
      }
      icon={
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-error-container text-danger">
          <Icon name="person_remove" className="text-[22px]" />
        </div>
      }
      footer={
        <>
          <button className={btn.secondary} onClick={onClose}>Cancel</button>
          <button className={btn.danger} disabled={busy || !plan || blocked || typed.trim().toLowerCase() !== email || !password} onClick={confirm}>
            <Icon name="delete_forever" className="text-[18px]" /> {busy ? "Deleting…" : "Delete my account"}
          </button>
        </>
      }
    >
      {!plan && !error && <p className="py-6 text-center text-text-secondary">Checking your workspaces…</p>}
      {plan && (
        <div className="space-y-4 font-body-md text-[15px]">
          {plan.blockers.length > 0 && (
            <div className="flex gap-3 rounded-xl bg-error-container/60 p-4 text-on-error-container">
              <Icon name="block" className="text-[20px] text-danger" />
              <p>
                You&apos;re the only admin of <b>{plan.blockers.map((b) => b.name).join(", ")}</b>. Make another member an admin in Admin → Members, then come back.
              </p>
            </div>
          )}
          {plan.deleteWorkspaces.length > 0 && (
            <div>
              <p className="mb-1.5 font-title-md text-title-md text-text-primary">Deleted permanently, with all their files</p>
              <ul className="space-y-1">
                {plan.deleteWorkspaces.map((w) => (
                  <li key={w.id} className="flex items-center gap-2 text-on-surface-variant">
                    <Icon name={w.type === "PERSONAL" ? "person" : "domain"} className="text-[18px] text-danger" /> {w.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan.leaveWorkspaces.length > 0 && (
            <div>
              <p className="mb-1.5 font-title-md text-title-md text-text-primary">You&apos;ll leave these — your files are handed over</p>
              <ul className="space-y-1">
                {plan.leaveWorkspaces.map((w) => (
                  <li key={w.id} className="flex items-center gap-2 text-on-surface-variant">
                    <Icon name="domain" className="text-[18px] text-primary" /> {w.name} → <span className="text-text-primary">{w.transferTo.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!blocked && (
            <>
              <label className="block">
                <span className="mb-1.5 block font-title-md text-title-md text-text-primary">
                  Type <span className="font-mono text-[14px]">{email}</span> to confirm
                </span>
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  className="h-11 w-full rounded-lg bg-surface px-3.5 font-body-md text-body-md shadow-[inset_0_0_0_1px_#E5E7EB] focus:outline-none focus:ring-2 focus:ring-danger/20"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-title-md text-title-md text-text-primary">Your password</span>
                <PasswordInput id="delete-password" value={password} onChange={setPassword} />
              </label>
            </>
          )}
        </div>
      )}
      {error && (
        <p className="mt-3 flex items-center gap-1.5 font-label-md text-label-md text-danger">
          <Icon name="error" className="text-[16px]" /> {error}
        </p>
      )}
    </Dialog>
  );
}
