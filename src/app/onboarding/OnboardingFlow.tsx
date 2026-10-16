"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";

type Choice = "personal" | "company";

export function OnboardingFlow({ email, personalId, startAtCompany }: { email: string; personalId: string | null; startAtCompany: boolean }) {
  const [step, setStep] = useState<1 | 2>(startAtCompany ? 2 : 1);
  const [choice, setChoice] = useState<Choice>("company");
  const [inviteLink, setInviteLink] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function continueStep1() {
    if (choice === "company") return setStep(2);
    setBusy(true);
    if (personalId) await api("/api/workspaces/switch", { body: { workspaceId: personalId } }).catch(() => {});
    window.location.href = "/files";
  }

  const addDraft = (value = draft) => {
    const parts = value.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (parts.length) setEmails((e) => [...new Set([...e, ...parts])]);
    setDraft("");
  };

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const all = [...new Set([...emails, ...draft.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)])];
    try {
      await api("/api/workspaces", { body: { name, invites: all } });
      window.location.href = "/files";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const progress = (
    <div className="mb-8 flex flex-col items-center gap-3">
      <span className="rounded-full bg-surface px-3 py-1 font-label-md text-label-md shadow-sm">
        <span className="font-semibold text-primary">STEP {step} OF 2</span> <span className="text-text-secondary">· Workspace setup</span>
      </span>
      <div className="flex w-[400px] max-w-full gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-primary-container" />
        <div className={`h-1.5 flex-1 rounded-full ${step === 2 ? "bg-primary-container" : "bg-surface-container-high"}`} />
      </div>
    </div>
  );

  if (step === 1) {
    return (
      <div className="relative w-full max-w-[860px]">
        {progress}
        <h1 className="mb-2 text-center text-[32px] font-semibold leading-10 text-text-primary">How will you use MacTidar Cloud?</h1>
        <p className="mx-auto mb-10 max-w-md text-center font-body-md text-[15px] text-text-secondary">Choose the setup that fits you. You can always add a company workspace later.</p>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {(
            [
              { key: "personal", icon: "person", title: "For myself", desc: "A personal workspace with 3 GB free. Perfect for your own files.", tags: ["Personal", "3 GB free"] },
              { key: "company", icon: "domain", title: "With my company", desc: "Create a company workspace and invite your team. You'll also keep your personal workspace.", tags: ["Recommended", "Invite your team"] },
            ] as const
          ).map((o) => {
            const on = choice === o.key;
            return (
              <button
                key={o.key}
                onClick={() => setChoice(o.key)}
                className={`relative flex flex-col rounded-2xl p-7 text-left transition-all ${on ? "bg-primary-soft shadow-[inset_0_0_0_2px_#2563eb]" : "bg-surface shadow-sm hover:shadow-md"}`}
              >
                <span className={`absolute right-6 top-6 flex h-6 w-6 items-center justify-center rounded-full ${on ? "bg-primary-container text-white" : "bg-surface-container-high"}`}>
                  {on && <Icon name="check" className="text-[16px]" />}
                </span>
                <span className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${on ? "bg-primary-container text-white" : "bg-surface-container-high text-on-surface-variant"}`}>
                  <Icon name={o.icon} className="text-[28px]" />
                </span>
                <span className="mb-1 font-headline-sm text-[17px] text-text-primary">{o.title}</span>
                <span className="mb-6 font-body-md text-[15px] leading-6 text-text-secondary">{o.desc}</span>
                <span className="mt-auto flex gap-2">
                  {o.tags.map((t, i) => (
                    <span key={t} className={`rounded-md px-2 py-0.5 font-label-md text-label-md ${i === 0 && o.key === "company" ? "bg-surface text-primary" : "bg-surface-container-low text-on-surface-variant"}`}>
                      {t}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mb-10 rounded-2xl bg-surface p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-low">
              <Icon name="mail" className="text-[22px] text-on-surface-variant" />
            </span>
            <div className="flex-1">
              <p className="font-title-md text-[15px] text-text-primary">I was invited to a company workspace</p>
              <p className="font-body-md text-body-md text-text-secondary">Open the invite email, or paste the invite link here.</p>
            </div>
            <button onClick={() => setShowInvite((s) => !s)} className="flex items-center gap-1 font-title-md text-[15px] text-primary hover:underline">
              Enter invite link <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </div>
          {showInvite && (
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const m = inviteLink.match(/\/invite\/([A-Za-z0-9_-]+)/);
                if (m) window.location.href = `/invite/${m[1]}`;
                else setError("That doesn't look like a MacTidar invite link.");
              }}
            >
              <input value={inviteLink} onChange={(e) => setInviteLink(e.target.value)} placeholder="https://cloud.mactidar.com/invite/…" className="h-11 flex-1 rounded-lg bg-surface-container-low px-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/30" />
              <button className="h-11 rounded-full bg-primary-container px-5 font-title-md text-title-md text-on-primary">Open</button>
            </form>
          )}
        </div>
        {error && <p className="mb-4 text-center font-label-md text-label-md text-danger">{error}</p>}
        <div className="flex flex-col items-center gap-5">
          <button disabled={busy} onClick={continueStep1} className="flex h-14 w-full max-w-[400px] items-center justify-center gap-2 rounded-full bg-primary-container font-title-md text-[16px] text-on-primary shadow-md hover:bg-primary disabled:opacity-60">
            Continue <Icon name="arrow_forward" className="text-[20px]" />
          </button>
          <p className="flex items-center gap-1.5 font-body-md text-body-md text-text-secondary">
            <Icon name="account_circle" className="text-[18px]" /> Signed in as <span className="text-text-primary">{email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[720px]">
      {progress}
      <form onSubmit={createCompany} className="rounded-2xl bg-surface p-8 shadow-sm sm:p-10">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1 font-label-md text-label-md text-on-surface-variant">
          <Icon name="domain" className="text-[16px]" /> Company setup
        </span>
        <h1 className="mb-1 text-[28px] font-semibold text-text-primary">Create your company workspace</h1>
        <p className="mb-8 font-body-md text-[15px] text-text-secondary">A shared space for your team&apos;s files, with admin controls.</p>
        <label className="mb-1.5 block font-title-md text-[15px] text-text-primary" htmlFor="company">
          Company name
        </label>
        <div className="relative mb-6">
          <Icon name="domain" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
          <input id="company" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Studio" className="h-12 w-full rounded-lg bg-surface pl-11 pr-3 font-body-md text-[15px] shadow-[inset_0_0_0_1px_#E5E7EB] focus:outline-none focus:ring-2 focus:ring-primary-container/30" />
        </div>
        <div className="mb-1.5 flex justify-between">
          <label className="font-title-md text-[15px] text-text-primary">
            Invite teammates <span className="font-normal text-text-secondary">(optional)</span>
          </label>
          {emails.length > 0 && <span className="font-label-md text-label-md text-text-secondary">{emails.length} invite{emails.length > 1 ? "s" : ""} queued</span>}
        </div>
        <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-lg p-2 shadow-[inset_0_0_0_1px_#E5E7EB]">
          {emails.map((e) => (
            <span key={e} className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-body-sm text-body-sm text-text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-container" /> {e}
              <button type="button" aria-label={`Remove ${e}`} onClick={() => setEmails((x) => x.filter((y) => y !== e))} className="text-outline hover:text-text-primary">
                <Icon name="close" className="text-[14px]" />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => (/[,;\s]$/.test(e.target.value) ? addDraft(e.target.value) : setDraft(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft) {
                e.preventDefault();
                addDraft();
              } else if (e.key === "Backspace" && !draft && emails.length) setEmails((x) => x.slice(0, -1));
            }}
            onBlur={() => addDraft()}
            placeholder={emails.length ? "" : "colleague@company.com"}
            className="h-8 min-w-[200px] flex-1 bg-transparent px-1 font-body-md text-body-md focus:outline-none"
          />
        </div>
        <p className="mb-6 mt-1.5 font-label-md text-label-md text-text-secondary">Press comma or Enter to add several addresses. You can invite people later too.</p>
        <div className="mb-8 flex gap-3 rounded-xl bg-primary-soft p-4">
          <Icon name="verified_user" className="text-[22px] text-primary" />
          <div>
            <p className="font-title-md text-[15px] text-primary">Private by default</p>
            <p className="font-body-md text-body-md text-on-surface-variant">Files stay inside your company workspace. Members can share with each other; you control everything else in workspace settings.</p>
          </div>
        </div>
        {error && (
          <p className="mb-4 flex items-center gap-1.5 font-label-md text-label-md text-danger">
            <Icon name="error" className="text-[16px]" /> {error}
          </p>
        )}
        <div className="flex items-center justify-between">
          {startAtCompany ? (
            <Link href="/files" className="flex h-12 items-center gap-2 rounded-full bg-surface-container-low px-6 font-title-md text-[15px] hover:bg-surface-container">
              Cancel
            </Link>
          ) : (
            <button type="button" onClick={() => setStep(1)} className="flex h-12 items-center gap-2 rounded-full bg-surface-container-low px-6 font-title-md text-[15px] hover:bg-surface-container">
              <Icon name="arrow_back" className="text-[18px]" /> Back
            </button>
          )}
          <button disabled={busy || name.trim().length < 2} className="flex h-12 items-center gap-2 rounded-full bg-primary-container px-7 font-title-md text-[15px] text-on-primary shadow-md hover:bg-primary disabled:opacity-60">
            {busy ? "Creating…" : "Create workspace"} <Icon name="arrow_forward" className="text-[18px]" />
          </button>
        </div>
      </form>
    </div>
  );
}
