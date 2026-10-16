"use client";

import { useState } from "react";
import { btn, Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { Turnstile } from "@/components/Turnstile";
import { api } from "@/lib/api";

const REASONS = [
  ["COPYRIGHT", "Copyright infringement", "Pirated films, music, software or someone else's work"],
  ["MALWARE", "Malware or phishing", "Viruses, fake login pages or files designed to cause harm"],
  ["SPAM", "Spam", "Unwanted advertising or mass-distributed content"],
  ["ILLEGAL", "Illegal or harmful content", "Content that breaks the law or puts people at risk"],
  ["OTHER", "Something else", "Tell us more below"],
] as const;

export function ReportAbuse({ token, siteKey }: { token: string; siteKey: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number][0] | null>(null);
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [human, setHuman] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/public/${token}/report`, { body: { reason, details: details || undefined, email: email || undefined, website: trap || undefined, turnstile: human } });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
      setResetKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 font-body-md text-body-md text-text-secondary hover:text-danger">
        <Icon name="flag" className="text-[18px]" /> Report abuse
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        width="max-w-[520px]"
        title={done ? "Thanks for letting us know" : "Report this content"}
        icon={
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${done ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-error-container text-danger"}`}>
            <Icon name={done ? "check" : "flag"} className="text-[22px]" />
          </div>
        }
        footer={
          done ? (
            <button className={btn.primary} onClick={() => setOpen(false)}>Close</button>
          ) : (
            <>
              <button className={btn.secondary} onClick={() => setOpen(false)}>Cancel</button>
              <button className={btn.danger} disabled={!reason || busy || !human || (reason === "OTHER" && !details.trim())} onClick={submit}>
                {busy ? "Sending…" : "Submit report"}
              </button>
            </>
          )
        }
      >
        {done ? (
          <p className="font-body-md text-[15px] text-text-secondary">Our team will review this within 24 hours. Links reported by several people are disabled automatically until they&apos;re reviewed.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2" role="radiogroup" aria-label="Reason">
              {REASONS.map(([value, title, desc]) => (
                <label key={value} className={`flex cursor-pointer gap-3 rounded-xl p-3 transition-colors ${reason === value ? "bg-error-container/40 shadow-[inset_0_0_0_1px_#fca5a5]" : "hover:bg-surface-container-low"}`}>
                  <input type="radio" name="reason" checked={reason === value} onChange={() => setReason(value)} className="mt-1 h-4 w-4 accent-danger" />
                  <span>
                    <span className="block font-title-md text-[15px] text-text-primary">{title}</span>
                    <span className="block font-body-sm text-body-sm text-text-secondary">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
            <label className="block">
              <span className="mb-1.5 flex justify-between font-title-md text-title-md">
                Details {reason !== "OTHER" && <span className="font-normal text-text-secondary">optional</span>}
                <span className="font-label-md text-label-md font-normal text-text-secondary">{details.length}/500</span>
              </span>
              <textarea value={details} maxLength={500} onChange={(e) => setDetails(e.target.value)} rows={3} className="w-full resize-none rounded-lg bg-surface-container-low p-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-danger/20" />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-title-md text-title-md">
                Your email <span className="font-normal text-text-secondary">optional, so we can follow up</span>
              </span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 w-full rounded-lg bg-surface-container-low px-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-danger/20" />
            </label>
            {/* Hidden from people; bots tend to fill it in. */}
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden value={trap} onChange={(e) => setTrap(e.target.value)} name="website" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
            <Turnstile siteKey={siteKey} onToken={setHuman} resetKey={resetKey} />
            {error && (
              <p className="flex items-center gap-1.5 font-label-md text-label-md text-danger">
                <Icon name="error" className="text-[16px]" /> {error}
              </p>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
