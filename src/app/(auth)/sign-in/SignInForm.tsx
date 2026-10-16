"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { inputClass, PasswordInput } from "@/components/PasswordInput";
import { api, type ApiError } from "@/lib/api";

export function SignInForm({ next, initialEmail }: { next: string; initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ redirect: string | null }>("/api/auth/sign-in", { body: { email, password, remember } });
      window.location.href = res.redirect ?? next;
    } catch (err) {
      if ((err as ApiError).code === "not_confirmed") {
        window.location.href = `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&resend=1`;
        return;
      }
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-1.5">
        <label className="block font-title-md text-title-md text-text-primary" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="name@mactidar.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label className="block font-title-md text-title-md text-text-primary" htmlFor="password">
          Password
        </label>
        <PasswordInput id="password" value={password} onChange={setPassword} invalid={!!error} placeholder="••••••••••••" />
        {error && (
          <div className="flex items-center gap-1.5 pt-1 text-danger">
            <Icon name="error" className="shrink-0 text-[16px]" />
            <span className="font-label-md text-label-md font-medium">{error}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-1">
        <label className="flex cursor-pointer select-none items-center gap-2">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded accent-primary-container"
          />
          <span className="font-body-sm text-body-sm text-text-primary">Remember me</span>
        </label>
        <Link href="/forgot-password" className="font-body-sm text-body-sm font-semibold text-primary-container hover:underline">
          Forgot password?
        </Link>
      </div>
      <div className="pt-2">
        <button
          type="submit"
          disabled={busy}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-container px-5 font-title-md text-title-md tracking-tight text-on-primary shadow-md transition-all duration-150 hover:bg-primary active:scale-[0.99] disabled:opacity-60"
        >
          <span>{busy ? "Signing in…" : "Sign in"}</span>
          <Icon name="arrow_forward" className="text-[18px]" />
        </button>
      </div>
      <div className="rounded-lg bg-surface-container-low p-3 text-center">
        <p className="font-body-sm text-body-sm text-text-secondary">
          New to MacTidar Cloud?{" "}
          <Link href="/sign-up" className="font-semibold text-primary-container hover:underline">
            Create a free account
          </Link>
        </p>
      </div>
    </form>
  );
}
