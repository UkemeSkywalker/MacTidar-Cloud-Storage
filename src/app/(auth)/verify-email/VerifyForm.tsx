"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";

const RESEND_SECONDS = 45;

export function VerifyForm({ email, autoResend }: { email: string; autoResend: boolean }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const sent = useRef(false);

  useEffect(() => {
    boxes.current[0]?.focus();
    if (autoResend && email && !sent.current) {
      sent.current = true;
      api("/api/auth/resend", { body: { email } }).then(() => setInfo("We sent you a new code.")).catch(() => {});
    }
  }, [autoResend, email]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function setDigit(i: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split("");
      setDigits([...next, ...Array(6 - next.length).fill("")]);
      boxes.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    setDigits((d) => d.map((x, j) => (j === i ? clean : x)));
    if (clean && i < 5) boxes.current[i + 1]?.focus();
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/verify", { body: { email, code: digits.join("") } });
      window.location.href = `/sign-in?verified=1&email=${encodeURIComponent(email)}`;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    try {
      await api("/api/auth/resend", { body: { email } });
      setInfo("We sent you a new code.");
      setCountdown(RESEND_SECONDS);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={verify} className="w-full">
      <div className="mb-4 grid grid-cols-6 gap-2.5 sm:gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => e.key === "Backspace" && !d && i > 0 && boxes.current[i - 1]?.focus()}
            className="h-16 w-full rounded-xl bg-surface-container-low text-center text-[26px] font-semibold text-text-primary transition-all focus:bg-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        ))}
      </div>
      <div className="mb-6 flex justify-center">
        <span className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1 font-label-md text-label-md text-on-surface-variant">
          <Icon name="schedule" className="text-[15px]" /> The code expires in 24 hours
        </span>
      </div>
      {error && (
        <p className="mb-4 flex items-center justify-center gap-1.5 font-label-md text-label-md text-danger">
          <Icon name="error" className="text-[16px]" /> {error}
        </p>
      )}
      {info && !error && <p className="mb-4 text-center font-label-md text-label-md text-tertiary">{info}</p>}
      <button
        type="submit"
        disabled={busy || digits.join("").length !== 6 || !email}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-title-md text-[15px] text-on-primary shadow-md hover:bg-primary-container disabled:opacity-60"
      >
        {busy ? "Verifying…" : "Verify email"} <Icon name="arrow_forward" className="text-[18px]" />
      </button>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3 py-2.5">
        <button type="button" disabled={countdown > 0} onClick={resend} className="flex items-center gap-2 font-body-md text-body-md text-text-secondary hover:text-text-primary disabled:hover:text-text-secondary">
          Didn&apos;t get it? Resend code
          {countdown > 0 && <span className="rounded bg-surface-container-high px-1.5 font-mono text-[12px]">0:{String(countdown).padStart(2, "0")}</span>}
        </button>
        <Link href="/sign-up" className="flex items-center gap-1 font-body-md text-body-md text-primary-container hover:underline">
          Use different email <Icon name="edit" className="text-[16px]" />
        </Link>
      </div>
      <p className="mt-4 text-center font-body-sm text-body-sm text-text-secondary">Can&apos;t find it? Check your spam folder — it comes from no-reply@verificationemail.com.</p>
    </form>
  );
}
