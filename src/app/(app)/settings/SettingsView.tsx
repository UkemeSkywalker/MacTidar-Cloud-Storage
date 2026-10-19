"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { btn } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordRules } from "@/components/PasswordRules";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { passwordRules } from "@/lib/passwords";
import { TurnOnSharingDialog } from "@/components/TurnOnSharing";
import { DeleteAccountDialog } from "@/components/DeleteAccount";
import { formatBytes } from "@/lib/format";
import { OutsideSharing, type CompanySharing } from "./OutsideSharing";

type U = { id: string; name: string; email: string; role: string; notifyShares: boolean; createdAt: string };

type Personal = { name: string; sharingEnabled: boolean; usedBytes: number; quotaBytes: number } | null;

export function SettingsView({ user, personal, company }: { user: U; personal: Personal; company: CompanySharing | null }) {
  const router = useRouter();
  const [tab, setTab] = useState<"profile" | "security" | "sharing" | "outside" | "notifications">("profile");
  const [confirmSharing, setConfirmSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState(user.name);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notifyShares, setNotifyShares] = useState(user.notifyShares);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  const section = (id: typeof tab) => (tab === id ? "" : "hidden lg:block");
  const card = "mb-6 rounded-2xl bg-surface p-7 shadow-sm";
  const score = passwordRules.filter((r) => r.test(next)).length;

  return (
    <div className="mx-auto max-w-[1000px]">
      <p className="mb-1 font-label-md text-label-md text-text-secondary">
        Preferences › <span className="text-primary">Account settings</span>
      </p>
      <h1 className="font-headline-lg text-[28px] text-text-primary">Account Settings</h1>
      <p className="mb-5 font-body-md text-body-md text-text-secondary">Manage your profile, password, and notifications.</p>
      <div className="mb-6 flex gap-6 border-b border-border">
        {(
          [
            ["profile", "person", "Profile"],
            ["security", "shield", "Security"],
            ...(personal ? ([["sharing", "share", "Sharing"]] as const) : []),
            ...(company ? ([["outside", "public", "Outside sharing"]] as const) : []),
            ["notifications", "notifications", "Notifications"],
          ] as const
        ).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              document.getElementById(`settings-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`-mb-px flex items-center gap-2 border-b-2 pb-2.5 font-title-md text-[15px] ${tab === key ? "border-primary-container text-primary" : "border-transparent text-on-surface-variant hover:text-text-primary"}`}
          >
            <Icon name={icon} className="text-[20px]" /> {label}
          </button>
        ))}
      </div>

      <section id="settings-profile" className={`${card} ${section("profile")} scroll-mt-24`}>
        <div className="mb-6 flex items-start justify-between border-b border-border pb-5">
          <div>
            <p className="font-headline-sm text-[17px]">Profile Information</p>
            <p className="font-body-md text-body-md text-text-secondary">Your name as teammates see it.</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-primary-fixed px-2.5 py-0.5 font-label-md text-label-md text-primary">
            <Icon name="verified_user" className="text-[15px]" /> {user.role === "ADMIN" ? "Admin" : "Member"}
          </span>
        </div>
        <div className="mb-6 flex items-center gap-5 border-b border-border pb-6">
          <Avatar name={name || user.name} id={user.id} size="h-20 w-20 text-[26px]" />
          <div>
            <p className="font-title-md text-[15px]">{name || user.name}</p>
            <p className="font-body-sm text-body-sm text-text-secondary">Member since {formatDate(user.createdAt)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-title-md text-title-md">Full Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-lg bg-surface px-3.5 font-body-md text-body-md shadow-[inset_0_0_0_1px_#E5E7EB] focus:outline-none focus:ring-2 focus:ring-primary-container/20" />
          </label>
          <label className="block">
            <span className="mb-1.5 flex justify-between font-title-md text-title-md">
              Email Address
              <span className="flex items-center gap-1 font-label-md text-label-md font-normal text-text-secondary">
                <Icon name="lock" className="text-[14px]" /> Managed by your admin
              </span>
            </span>
            <span className="flex h-11 items-center gap-2 rounded-lg bg-surface-container-low px-3.5 font-body-md text-body-md text-text-secondary">
              <Icon name="mail" className="text-[18px]" /> {user.email}
            </span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className={btn.secondary} onClick={() => setName(user.name)}>Cancel</button>
          <button
            className={btn.primary}
            disabled={busy === "profile" || !name.trim() || name.trim() === user.name}
            onClick={() =>
              run("profile", async () => {
                await api("/api/me", { method: "PATCH", body: { name } });
                toast("Profile updated");
                router.refresh();
              })
            }
          >
            <Icon name="check" className="text-[18px]" /> Save changes
          </button>
        </div>
      </section>

      <section id="settings-security" className={`${card} ${section("security")} scroll-mt-24`}>
        <p className="font-headline-sm text-[17px]">Security &amp; Authentication</p>
        <p className="mb-6 border-b border-border pb-5 font-body-md text-body-md text-text-secondary">Change your password and manage signed-in devices.</p>
        <div className="max-w-[460px] space-y-4">
          <p className="font-title-md text-[15px]">Change Password</p>
          <label className="block">
            <span className="mb-1.5 block font-title-md text-title-md">Current Password</span>
            <PasswordInput id="current-password" value={current} onChange={setCurrent} placeholder="Enter existing password" />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-title-md text-title-md">New Password</span>
            <PasswordInput id="new-password" value={next} onChange={setNext} autoComplete="new-password" />
            {next && (
              <>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? (score === 5 ? "bg-file-sheet" : "bg-warning") : "bg-surface-container-high"}`} />
                  ))}
                </div>
                <PasswordRules password={next} />
              </>
            )}
          </label>
          <label className="block">
            <span className="mb-1.5 block font-title-md text-title-md">Confirm New Password</span>
            <PasswordInput id="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" invalid={!!confirm && confirm !== next} />
          </label>
          <button
            className={btn.primary}
            disabled={busy === "password" || !current || score < 5 || next !== confirm}
            onClick={() =>
              run("password", async () => {
                await api("/api/me/password", { body: { current, next } });
                setCurrent("");
                setNext("");
                setConfirm("");
                toast("Password updated");
              })
            }
          >
            Update password
          </button>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-xl bg-surface-container-low p-5">
          <div className="flex-1">
            <p className="flex items-center gap-2 font-title-md text-[15px]">
              <Icon name="devices" className="text-[20px] text-danger" /> Session Management
            </p>
            <p className="font-body-sm text-body-sm text-text-secondary">Signs you out on every other browser and device. This browser stays signed in.</p>
          </div>
          <button
            disabled={busy === "signout"}
            onClick={() =>
              run("signout", async () => {
                await api("/api/me/sign-out-everywhere", { body: {} });
                toast("Signed out of all other devices");
              })
            }
            className="flex h-10 items-center gap-2 rounded-full px-5 font-title-md text-title-md text-danger shadow-[inset_0_0_0_1px_#DC2626] hover:bg-error-container/40"
          >
            <Icon name="logout" className="text-[18px]" /> Sign out of all devices
          </button>
        </div>
      </section>

      {personal && (
        <section id="settings-sharing" className={`${card} ${section("sharing")} scroll-mt-24`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-headline-sm text-[17px]">Sharing · {personal.name}</p>
              <p className="font-body-md text-body-md text-text-secondary">Controls public links and sharing by email for your personal workspace.</p>
            </div>
            <span className="rounded-full bg-surface-container-low px-3 py-1 font-label-md text-label-md text-on-surface-variant">
              {formatBytes(personal.usedBytes)} of {formatBytes(personal.quotaBytes, 0)} used
            </span>
          </div>
          {personal.sharingEnabled ? (
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-tertiary-fixed/30 p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-tertiary">
                <Icon name="share" className="text-[24px]" />
              </span>
              <div className="flex-1">
                <p className="font-title-md text-[15px]">Sharing is on</p>
                <p className="font-body-md text-body-md text-text-secondary">You can share by email and create public links. Turning sharing off stops people you shared with by email from opening anything; existing public links keep working until you disable them.</p>
              </div>
              <button
                className={btn.secondary}
                onClick={() =>
                  run("sharing", async () => {
                    await api("/api/workspaces/current", { method: "PATCH", body: { sharingEnabled: false } });
                    toast("Sharing turned off");
                    router.refresh();
                  })
                }
              >
                Turn off sharing
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-surface-container-low p-6">
              <div className="mb-5 flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary-container">
                  <Icon name="lock" className="text-[24px]" />
                </span>
                <div>
                  <p className="flex items-center gap-2 font-title-md text-[16px]">
                    Sharing is off <span className="rounded-full bg-surface px-2 font-label-md text-label-md text-text-secondary">Default</span>
                  </p>
                  <p className="font-body-md text-[15px] text-text-secondary">Files in your personal workspace are private. Turn on sharing to share with people by email or create public links.</p>
                </div>
              </div>
              <button className={btn.primary} onClick={() => setConfirmSharing(true)}>
                <Icon name="lock_open" className="text-[18px]" /> Turn on sharing
              </button>
            </div>
          )}
          <TurnOnSharingDialog
            open={confirmSharing}
            onClose={() => setConfirmSharing(false)}
            onDone={() => {
              setConfirmSharing(false);
              router.refresh();
            }}
          />
        </section>
      )}

      {company && <OutsideSharing company={company} className={`${card} ${section("outside")} scroll-mt-24`} />}

      <section id="settings-notifications" className={`${card} ${section("notifications")} scroll-mt-24`}>
        <p className="font-headline-sm text-[17px]">Notification Preferences</p>
        <p className="mb-2 border-b border-border pb-5 font-body-md text-body-md text-text-secondary">Choose which emails MacTidar Cloud sends you.</p>
        <div className="flex items-start gap-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low">
            <Icon name="share" className="text-[20px] text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-title-md text-[15px]">When someone shares with me</p>
            <p className="font-body-sm text-body-sm text-text-secondary">Get an email whenever a teammate shares a file or folder with you.</p>
          </div>
          <button
            role="switch"
            aria-checked={notifyShares}
            aria-label="Share notifications"
            onClick={() => setNotifyShares(!notifyShares)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${notifyShares ? "bg-primary-container" : "bg-surface-container-highest"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${notifyShares ? "left-6" : "left-1"}`} />
          </button>
        </div>
        <div className="flex justify-end">
          <button
            className={btn.primary}
            disabled={busy === "notify" || notifyShares === user.notifyShares}
            onClick={() =>
              run("notify", async () => {
                await api("/api/me", { method: "PATCH", body: { notifyShares } });
                toast("Notification preferences saved");
                router.refresh();
              })
            }
          >
            Save notification preferences
          </button>
        </div>
      </section>
      <section className="mb-6 rounded-2xl bg-surface p-7 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_0_0_1px_#fecaca]">
        <p className="font-headline-sm text-[17px] text-danger">Delete account</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl font-body-md text-body-md text-text-secondary">
            Permanently delete your account and your personal workspace. Files you keep in company workspaces are handed to another member.
          </p>
          <button onClick={() => setDeleting(true)} className="flex h-10 items-center gap-2 rounded-full px-5 font-title-md text-title-md text-danger shadow-[inset_0_0_0_1px_#DC2626] hover:bg-error-container/40">
            <Icon name="person_remove" className="text-[18px]" /> Delete account
          </button>
        </div>
        <DeleteAccountDialog open={deleting} email={user.email} onClose={() => setDeleting(false)} />
      </section>
    </div>
  );
}
