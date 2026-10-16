"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { api } from "@/lib/api";

export function JoinCard({
  token,
  inviterName,
  workspaceName,
  memberCount,
  role,
  inviteEmail,
  signedInAs,
}: {
  token: string;
  inviterName: string;
  workspaceName: string;
  memberCount: number;
  role: "ADMIN" | "MEMBER";
  inviteEmail: string;
  signedInAs: string | null;
}) {
  const [busy, setBusy] = useState<"join" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const matches = signedInAs === inviteEmail;
  const next = `/invite/${token}`;

  async function act(kind: "join" | "decline") {
    setBusy(kind);
    setError(null);
    try {
      await api(`/api/invites/${token}/join`, { method: kind === "join" ? "POST" : "DELETE", body: kind === "join" ? {} : undefined });
      if (kind === "join") window.location.href = "/files";
      else setDeclined(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function switchAccount() {
    await api("/api/auth/sign-out", { body: {} }).catch(() => {});
    window.location.href = `/sign-in?next=${encodeURIComponent(next)}&email=${encodeURIComponent(inviteEmail)}`;
  }

  if (declined) {
    return (
      <div className="w-full max-w-[640px] rounded-2xl bg-surface p-10 text-center shadow-xl">
        <Icon name="check_circle" className="mb-3 text-[40px] text-tertiary" />
        <p className="mb-2 font-headline-sm text-[20px]">Invitation declined</p>
        <p className="mb-6 font-body-md text-body-md text-text-secondary">You won&apos;t be added to {workspaceName}.</p>
        <Link href="/files" className="font-title-md text-title-md text-primary hover:underline">
          Go to my files
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[640px] rounded-2xl bg-surface p-8 shadow-xl sm:p-10">
      <div className="mb-5 flex justify-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed text-[28px] font-semibold text-primary">
            {inviterName.slice(0, 1).toUpperCase()}
          </div>
          <span className="absolute -bottom-2 -right-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container text-white shadow-md">
            <Icon name="domain" className="text-[24px]" />
          </span>
        </div>
      </div>
      <h1 className="mb-1 text-center text-[26px] font-semibold text-text-primary">
        {inviterName.split(" ")[0]} invited you to join {workspaceName}
      </h1>
      <p className="mb-3 flex items-center justify-center gap-3 font-body-md text-[15px] text-text-secondary">
        <span className="flex items-center gap-1">
          <Icon name="domain" className="text-[18px]" /> Company workspace
        </span>
        <span className="h-1 w-1 rounded-full bg-outline-variant" />
        <span className="flex items-center gap-1">
          <Icon name="group" className="text-[18px]" /> {memberCount} member{memberCount === 1 ? "" : "s"}
        </span>
      </p>
      <div className="mb-6 flex justify-center">
        <span className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-title-md text-title-md text-primary">
          <Icon name="verified_user" className="text-[16px]" /> You&apos;ll join as {role === "ADMIN" ? "Admin" : "Member"}
        </span>
      </div>
      <div className="mb-7 rounded-xl bg-surface-container-low p-5">
        <p className="mb-3 font-title-md text-[15px]">What joining means</p>
        {[
          ["check", "bg-primary-fixed text-primary", `You'll see files shared with you in ${workspaceName}.`],
          ["lock", "bg-tertiary-fixed text-on-tertiary-fixed-variant", "Your personal files stay private in your personal workspace."],
          ["sync_alt", "bg-primary-fixed text-primary", "You can switch workspaces any time from the sidebar."],
        ].map(([icon, tone, text]) => (
          <p key={icon} className="mb-2 flex items-center gap-3 font-body-md text-[15px] last:mb-0">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone}`}>
              <Icon name={icon} className="text-[15px]" />
            </span>
            {text}
          </p>
        ))}
      </div>
      {error && <p className="mb-4 text-center font-label-md text-label-md text-danger">{error}</p>}
      {matches ? (
        <div className="flex gap-3">
          <button disabled={!!busy} onClick={() => act("decline")} className="h-12 flex-1 rounded-full bg-surface-container-high font-title-md text-[15px] hover:bg-surface-container-highest disabled:opacity-60">
            Decline
          </button>
          <button disabled={!!busy} onClick={() => act("join")} className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-primary-container font-title-md text-[15px] text-on-primary shadow-md hover:bg-primary disabled:opacity-60">
            {busy === "join" ? "Joining…" : `Join ${workspaceName}`} <Icon name="arrow_forward" className="text-[18px]" />
          </button>
        </div>
      ) : signedInAs ? (
        <div className="text-center">
          <p className="mb-4 font-body-md text-body-md text-text-secondary">
            This invite is for <b className="text-text-primary">{inviteEmail}</b>, but you&apos;re signed in as {signedInAs}.
          </p>
          <button onClick={switchAccount} className="h-12 rounded-full bg-primary-container px-7 font-title-md text-[15px] text-on-primary">
            Switch account
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4 font-body-md text-body-md text-text-secondary">
            You already have a MacTidar Cloud account with <b className="text-text-primary">{inviteEmail}</b>. Sign in to accept.
          </p>
          <Link
            href={`/sign-in?next=${encodeURIComponent(next)}&email=${encodeURIComponent(inviteEmail)}`}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary-container px-7 font-title-md text-[15px] text-on-primary"
          >
            Sign in to accept <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      )}
      {signedInAs && matches && (
        <p className="mt-6 text-center font-body-md text-body-md text-text-secondary">
          Signed in as <span className="text-text-primary">{signedInAs}</span> ·{" "}
          <button onClick={switchAccount} className="font-title-md text-primary hover:underline">
            Switch account
          </button>
        </p>
      )}
    </div>
  );
}
