"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { PasswordInput } from "@/components/PasswordInput";
import { api } from "@/lib/api";

export function UnlockForm({ token, sharerName }: { token: string; sharerName: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/api/public/${token}/unlock`, { body: { password } });
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="mb-1.5 flex justify-between">
        <label htmlFor="link-password" className="font-title-md text-title-md text-text-primary">
          Password
        </label>
        <span className="font-label-md text-label-md text-text-secondary">Case sensitive</span>
      </div>
      <PasswordInput id="link-password" value={password} onChange={setPassword} invalid={!!error} />
      {error && (
        <p className="mt-2 flex items-center gap-1.5 font-label-md text-label-md text-danger">
          <Icon name="error" className="text-[16px]" /> {error}
        </p>
      )}
      <button type="submit" disabled={busy || !password} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-container font-title-md text-title-md text-on-primary hover:bg-primary disabled:opacity-60">
        <Icon name="key" className="text-[20px]" /> {busy ? "Checking…" : "Unlock"}
      </button>
      <p className="mt-5 text-center font-body-md text-body-md text-text-secondary">Need access? Ask {sharerName} for the password.</p>
    </form>
  );
}
