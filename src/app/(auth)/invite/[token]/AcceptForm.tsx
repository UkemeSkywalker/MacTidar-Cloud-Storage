"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordRules } from "@/components/PasswordRules";
import { api } from "@/lib/api";
import { passwordRules } from "@/lib/passwords";

export function AcceptForm({ token, email }: { token: string; email: string }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = passwordRules.every((r) => r.test(password));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    setError(null);
    try {
      await api(`/api/invites/${token}/accept`, { body: { name, password } });
      window.location.href = "/files";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="w-full space-y-4" onSubmit={submit}>
      <div className="space-y-1.5">
        <label className="block font-label-md text-label-md text-text-primary">Invited email</label>
        <div className="flex items-center rounded-lg bg-surface-container-low px-3.5 py-2.5 shadow-sm">
          <Icon name="lock" className="mr-2.5 text-[18px] text-outline" />
          <input readOnly value={email} className="w-full cursor-not-allowed bg-transparent font-body-md text-body-md text-secondary focus:outline-none" />
          <span className="ml-2 whitespace-nowrap rounded bg-surface-variant/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-outline">
            Locked to invite
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="block font-label-md text-label-md text-text-primary" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          required
          autoComplete="name"
          placeholder="e.g. Ada Okon"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10 w-full rounded-lg bg-surface px-3.5 font-body-md text-body-md text-text-primary shadow-[inset_0_0_0_1px_#E5E7EB] transition-shadow focus:outline-none focus:ring-2 focus:ring-primary-container/20"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block font-label-md text-label-md text-text-primary" htmlFor="password">
          Create password
        </label>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordRules password={password} />
      </div>
      <div className="space-y-1.5">
        <label className="block font-label-md text-label-md text-text-primary" htmlFor="confirm">
          Confirm password
        </label>
        <div className="relative">
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            invalid={!!confirm && confirm !== password}
          />
        </div>
        {confirm && confirm === password && (
          <p className="flex items-center gap-1 font-label-sm text-label-sm text-file-sheet">
            <Icon name="check_circle" className="text-[14px]" /> Passwords match
          </p>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-danger">
          <Icon name="error" className="shrink-0 text-[16px]" />
          <span className="font-label-md text-label-md font-medium">{error}</span>
        </div>
      )}
      <div className="pt-2">
        <button
          type="submit"
          disabled={busy || !valid || !name.trim() || password !== confirm}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-container font-title-md text-title-md text-on-primary shadow-sm transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
        >
          <span>{busy ? "Creating account…" : "Create account"}</span>
          <Icon name="arrow_forward" className="text-[18px]" />
        </button>
      </div>
    </form>
  );
}
