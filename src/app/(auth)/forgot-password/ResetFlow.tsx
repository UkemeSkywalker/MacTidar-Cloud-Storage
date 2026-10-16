"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordRules } from "@/components/PasswordRules";
import { Turnstile } from "@/components/Turnstile";
import { api } from "@/lib/api";
import { passwordRules } from "@/lib/passwords";

const RESEND_SECONDS = 45;

export function ResetFlow({ siteKey }: { siteKey: string }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<"send" | "reset" | null>(null);
  const [error, setError] = useState<{ step: 1 | 2; message: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [human, setHuman] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy("send");
    setError(null);
    try {
      await api("/api/auth/forgot", { body: { email, turnstile: human } });
      setSentTo(email.trim().toLowerCase());
      setCountdown(RESEND_SECONDS);
      setTimeout(() => boxes.current[0]?.focus(), 50);
    } catch (err) {
      setError({ step: 1, message: (err as Error).message });
    } finally {
      setBusy(null);
      setResetKey((k) => k + 1); // tokens are single-use; get one ready for a resend
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError({ step: 2, message: "Passwords don't match." });
    setBusy("reset");
    setError(null);
    try {
      await api("/api/auth/reset", { body: { email: sentTo, code: digits.join(""), password } });
      window.location.href = "/sign-in?reset=1";
    } catch (err) {
      setError({ step: 2, message: (err as Error).message });
      setBusy(null);
    }
  }

  function setDigit(i: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      // Pasted code
      const next = clean.slice(0, 6).split("");
      setDigits([...next, ...Array(6 - next.length).fill("")]);
      boxes.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    setDigits((d) => d.map((x, j) => (j === i ? clean : x)));
    if (clean && i < 5) boxes.current[i + 1]?.focus();
  }

  const score = passwordRules.filter((r) => r.test(password)).length;
  const strength = score <= 2 ? "Weak" : score <= 4 ? "Fair" : "Strong";
  const step2 = sentTo !== null;

  return (
    <div className="flex w-full max-w-[960px] flex-col gap-8">
      <div className="flex w-full flex-col items-start justify-between gap-2 px-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="font-headline-sm text-headline-sm text-text-primary">Password Recovery</span>
          <span className="rounded-full bg-primary-fixed px-2.5 py-0.5 font-label-sm text-label-sm text-primary">2-Step Flow</span>
        </div>
        <div className="flex items-center gap-4 font-label-md text-label-md text-text-secondary">
          <span className={`flex items-center gap-1.5 font-title-md ${step2 ? "text-text-secondary" : "text-primary"}`}>
            <span className={`h-2 w-2 rounded-full ${step2 ? "bg-tertiary" : "bg-primary-container"}`} />
            Step 1: Request
          </span>
          <span className="text-secondary-fixed-dim">/</span>
          <span className={`flex items-center gap-1.5 font-title-md ${step2 ? "text-primary" : "text-text-secondary"}`}>
            <span className={`h-2 w-2 rounded-full ${step2 ? "bg-primary-container" : "bg-outline-variant"}`} />
            Step 2: Verification &amp; Reset
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        {/* Step 1 */}
        <section className="relative flex flex-col rounded-xl bg-surface p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-primary-container">
              <Icon name="mark_email_read" className="text-[24px]" />
            </div>
            <span className="rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant">Step 01</span>
          </div>
          <h2 className="mb-2 font-headline-lg text-headline-lg text-text-primary">Reset your password</h2>
          <p className="mb-8 font-body-md text-body-md text-text-secondary">
            Enter your work email address and we&apos;ll send you a 6-digit verification code to reset your password.
          </p>
          <form className="flex flex-col gap-5" onSubmit={sendCode}>
            <div className="flex flex-col gap-1.5">
              <label className="font-title-md text-title-md text-text-primary" htmlFor="work-email">
                Work email
              </label>
              <div className="relative">
                <Icon name="mail" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-outline" />
                <input
                  id="work-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@mactidar.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-lg bg-surface pl-10 pr-4 font-body-md text-body-md text-text-primary shadow-[inset_0_0_0_1px_#E5E7EB] focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>
            </div>
            <Turnstile siteKey={siteKey} onToken={setHuman} resetKey={resetKey} />
            {error?.step === 1 && <ErrorLine message={error.message} />}
            <button
              type="submit"
              disabled={busy !== null || !human}
              className="group mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary-container font-title-md text-title-md text-on-primary shadow-sm transition-all duration-150 hover:bg-primary disabled:opacity-60"
            >
              <span>{busy === "send" ? "Sending…" : step2 ? "Send a new code" : "Send reset code"}</span>
              <Icon name="arrow_forward" className="text-[18px] transition-transform group-hover:translate-x-1" />
            </button>
          </form>
          <div className="mt-6 flex items-start gap-3 rounded-lg bg-surface-container-low p-3.5">
            <Icon name="info" className="mt-0.5 shrink-0 text-[20px] text-warning" />
            <p className="font-body-sm text-body-sm leading-snug text-text-secondary">
              The code expires after a short time. Check your spam folder if it doesn&apos;t arrive within a minute.
            </p>
          </div>
        </section>

        {/* Step 2 */}
        <section className={`relative flex flex-col rounded-xl bg-surface p-8 shadow-sm transition-opacity ${step2 ? "" : "pointer-events-none opacity-50"}`}>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-primary-container">
              <Icon name="verified_user" className="text-[24px]" />
            </div>
            {step2 ? (
              <span className="flex items-center gap-1 rounded-full bg-on-tertiary-container/30 px-2.5 py-1 font-label-sm text-label-sm text-tertiary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tertiary" /> Active Verification
              </span>
            ) : (
              <span className="rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant">Step 02</span>
            )}
          </div>
          <h2 className="mb-2 font-headline-lg text-headline-lg text-text-primary">Enter your code</h2>
          <p className="mb-6 font-body-md text-body-md text-text-secondary">
            {step2 ? (
              <>
                We sent a 6-digit verification code to <span className="font-title-md text-text-primary">{sentTo}</span>.
              </>
            ) : (
              "Request a code first, then enter it here with your new password."
            )}
          </p>
          <form className="flex flex-col gap-4" onSubmit={reset}>
            <div className="mb-1">
              <label className="mb-2.5 block font-title-md text-title-md text-text-primary">6-digit verification code</label>
              <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      boxes.current[i] = el;
                    }}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !d && i > 0) boxes.current[i - 1]?.focus();
                    }}
                    aria-label={`Digit ${i + 1}`}
                    className="h-14 w-full rounded-lg bg-surface text-center font-headline-lg text-headline-lg text-text-primary shadow-[inset_0_0_0_1px_#E5E7EB] transition-all focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="font-body-sm text-body-sm text-text-secondary">Didn&apos;t receive a code?</span>
                <button
                  type="button"
                  disabled={countdown > 0 || busy !== null || !human}
                  onClick={() => sendCode()}
                  className="flex items-center gap-1 font-body-sm text-body-sm text-text-secondary transition-colors hover:text-text-primary disabled:hover:text-text-secondary"
                >
                  <span>Resend code</span>
                  {countdown > 0 && (
                    <span className="font-label-sm text-label-sm text-outline">
                      (0:{String(countdown).padStart(2, "0")})
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-title-md text-title-md text-text-primary" htmlFor="new-password">
                New password
              </label>
              <PasswordInput id="new-password" value={password} onChange={setPassword} leadingIcon="lock" autoComplete="new-password" />
              {password && <PasswordRules password={password} />}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-title-md text-title-md text-text-primary" htmlFor="confirm-password">
                Confirm password
              </label>
              <PasswordInput
                id="confirm-password"
                value={confirm}
                onChange={setConfirm}
                leadingIcon="lock_reset"
                autoComplete="new-password"
                invalid={!!confirm && confirm !== password}
              />
            </div>
            {password && (
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-text-secondary">Password strength</span>
                  <span className={`font-title-md ${strength === "Strong" ? "text-tertiary" : "text-warning"}`}>
                    {strength} ({password.length} characters)
                  </span>
                </div>
                <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-surface-container">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-full w-1/3 rounded-full ${i < (strength === "Weak" ? 1 : strength === "Fair" ? 2 : 3) ? (strength === "Strong" ? "bg-tertiary" : "bg-warning") : ""}`}
                    />
                  ))}
                </div>
              </div>
            )}
            {error?.step === 2 && <ErrorLine message={error.message} />}
            <button
              type="submit"
              disabled={busy !== null || digits.join("").length !== 6 || !password || password !== confirm}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary-container font-title-md text-title-md text-on-primary shadow-sm transition-all duration-150 hover:bg-primary disabled:opacity-60"
            >
              <Icon name="lock_open" className="text-[18px]" />
              <span>{busy === "reset" ? "Resetting…" : "Reset password"}</span>
            </button>
          </form>
          {step2 && (
            <div className="mt-8 flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => {
                  setSentTo(null);
                  setDigits(Array(6).fill(""));
                }}
                className="group flex items-center gap-1 font-body-sm text-body-sm font-medium text-primary-container hover:text-primary"
              >
                <Icon name="alternate_email" className="text-[16px]" />
                <span>Use a different email address</span>
              </button>
              <Icon name="security" className="text-[18px] text-outline" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1.5 text-danger">
      <Icon name="error" className="shrink-0 text-[16px]" />
      <span className="font-label-md text-label-md font-medium">{message}</span>
    </div>
  );
}
