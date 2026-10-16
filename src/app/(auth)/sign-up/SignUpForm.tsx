"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { inputClass, PasswordInput } from "@/components/PasswordInput";
import { PasswordRules } from "@/components/PasswordRules";
import { api, type ApiError } from "@/lib/api";
import { passwordRules } from "@/lib/passwords";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<{ message: string; exists?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = passwordRules.every((r) => r.test(password));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/sign-up", { body: { name, email, password, agree } });
      window.location.href = `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`;
    } catch (err) {
      setError({ message: (err as Error).message, exists: (err as ApiError).code === "exists" });
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-1.5">
        <label className="block font-title-md text-title-md text-text-primary" htmlFor="name">
          Full name
        </label>
        <input id="name" required autoComplete="name" placeholder="e.g. Amaka Obi" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label className="block font-title-md text-title-md text-text-primary" htmlFor="email">
          Work or personal email
        </label>
        <input id="email" type="email" required autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label className="block font-title-md text-title-md text-text-primary" htmlFor="password">
          Password
        </label>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Create a password" />
        <PasswordRules password={password} />
      </div>
      <label className="flex cursor-pointer items-start gap-2.5">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary-container" />
        <span className="font-body-sm text-body-sm text-text-secondary">
          I agree to the{" "}
          <Link href="/terms" className="font-semibold text-primary-container hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-primary-container hover:underline">
            Privacy Policy
          </Link>
        </span>
      </label>
      {error && (
        <div className="flex items-start gap-1.5 text-danger">
          <Icon name="error" className="mt-px shrink-0 text-[16px]" />
          <span className="font-label-md text-label-md font-medium">
            {error.message}{" "}
            {error.exists && (
              <Link href={`/sign-in?email=${encodeURIComponent(email)}`} className="underline">
                Go to sign in
              </Link>
            )}
          </span>
        </div>
      )}
      <button
        type="submit"
        disabled={busy || !valid || !agree || !name.trim()}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-container px-5 font-title-md text-title-md text-on-primary shadow-md transition-all hover:bg-primary active:scale-[0.99] disabled:opacity-60"
      >
        <span>{busy ? "Creating account…" : "Create account"}</span>
        <Icon name="arrow_forward" className="text-[18px]" />
      </button>
    </form>
  );
}
