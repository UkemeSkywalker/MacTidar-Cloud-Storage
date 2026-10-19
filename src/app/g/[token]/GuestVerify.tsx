"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Turnstile } from "@/components/Turnstile";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/format";

const RESEND_SECONDS = 45;

// Two steps: send a one-time code to the invited address, then enter it.
export function GuestVerify({
  token,
  siteKey,
  email,
  sharerName,
  item,
}: {
  token: string;
  siteKey: string;
  email: string;
  sharerName: string;
  item: { name: string; type: "folder" | "file"; size: number };
}) {
  const [human, setHuman] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(0);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function send() {
    setBusy("send");
    setError(null);
    try {
      await api(`/api/guest/${token}/code`, { body: { turnstile: human } });
      setSent(true);
      setCountdown(RESEND_SECONDS);
      setTimeout(() => boxes.current[0]?.focus(), 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
      setResetKey((k) => k + 1); // tokens are single-use
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy("verify");
    setError(null);
    try {
      await api(`/api/guest/${token}/verify`, { body: { code: digits.join("") } });
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

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

  const first = sharerName.split(" ")[0];
  return (
    <div className="mx-auto max-w-[960px]">
      <section className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-6 shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container font-title-md text-[20px] text-on-primary">{first.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <h1 className="font-headline-sm text-[19px] text-text-primary">
            {first} shared <span className="text-primary">&ldquo;{item.name}&rdquo;</span> with you
          </h1>
          <p className="font-body-md text-body-md text-text-secondary">Confirm your email to open it. You don&apos;t need an account.</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 font-body-md text-body-md text-text-secondary">
          <Icon name={item.type === "folder" ? "folder" : "description"} className="text-[18px] text-primary" />
          {item.type === "folder" ? "Folder" : `File · ${formatBytes(item.size)}`}
        </span>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className={`rounded-2xl bg-surface p-6 shadow-sm ${sent ? "opacity-70" : ""}`}>
          <p className="mb-1 flex items-center gap-2 font-title-md text-[17px] text-text-primary">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high font-label-md text-label-md">1</span> Confirm it&apos;s you
          </p>
          <p className="mb-4 font-body-md text-body-md text-text-secondary">We&apos;ll email a 6-digit code to the address this was shared with.</p>
          <div className="mb-4 flex h-11 items-center justify-between rounded-lg bg-surface-container-low px-3 font-body-md text-body-md text-text-primary">
            {email} <Icon name="lock" className="text-[18px] text-outline" />
          </div>
          <div className="mb-3">
            <Turnstile siteKey={siteKey} onToken={setHuman} resetKey={resetKey} />
          </div>
          <button
            onClick={send}
            disabled={!human || busy !== null || countdown > 0}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-container font-title-md text-title-md text-on-primary shadow-sm hover:bg-primary disabled:opacity-60"
          >
            {busy === "send" ? "Sending…" : sent ? (countdown > 0 ? `Code sent · resend in 0:${String(countdown).padStart(2, "0")}` : "Send a new code") : "Send me a code"}
          </button>
        </section>

        <form onSubmit={verify} className={`rounded-2xl bg-surface p-6 shadow-sm ${sent ? "" : "pointer-events-none opacity-50"}`}>
          <p className="mb-1 flex items-center gap-2 font-title-md text-[17px] text-text-primary">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-container font-label-md text-label-md text-on-primary">2</span> Enter the code
          </p>
          <p className="mb-4 font-body-md text-body-md text-text-secondary">{sent ? `Sent to ${email}. It expires in 10 minutes.` : "Ask for a code first."}</p>
          <div className="mb-4 grid grid-cols-6 gap-2">
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
                className="h-14 w-full rounded-xl bg-surface-container-low text-center text-[24px] font-semibold text-text-primary focus:bg-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={busy !== null || digits.join("").length !== 6}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-container font-title-md text-title-md text-on-primary shadow-sm hover:bg-primary disabled:opacity-60"
          >
            {busy === "verify" ? "Checking…" : `Verify and open ${item.type}`} <Icon name="arrow_forward" className="text-[18px]" />
          </button>
        </form>
      </div>

      {error && (
        <p className="mt-4 flex items-center justify-center gap-1.5 font-label-md text-label-md text-danger">
          <Icon name="error" className="text-[16px]" /> {error}
        </p>
      )}

      <section className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-6 shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon name="cloud" className="text-[26px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-title-md text-[16px] text-text-primary">Want your own space?</p>
          <p className="font-body-md text-body-md text-text-secondary">Create a free MacTidar Cloud account with 3 GB of storage.</p>
        </div>
        <Link href="/sign-up" className="rounded-full bg-primary-container px-5 py-2.5 font-title-md text-title-md text-on-primary shadow-sm hover:bg-primary">
          Create free account
        </Link>
      </section>
      <p className="mt-6 flex items-center justify-center gap-2 text-center font-body-sm text-body-sm text-text-secondary">
        <Icon name="lock" className="text-[16px]" /> Only {email} can open this share. Please don&apos;t forward the email.
      </p>
    </div>
  );
}
