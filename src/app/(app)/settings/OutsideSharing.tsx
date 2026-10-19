"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btn } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";

export type CompanySharing = { name: string; isAdmin: boolean; externalSharing: boolean; allowedDomains: string[]; mine: boolean };

// Company workspaces: two switches. The admin allows sharing outside the
// workspace; then each member turns it on for themselves.
export function OutsideSharing({ company, className }: { company: CompanySharing; className: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [domains, setDomains] = useState<string[]>(company.allowedDomains);
  const [draft, setDraft] = useState("");

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  const setWorkspace = (externalSharing: boolean) =>
    run("ws", async () => {
      await api("/api/workspaces/current", { method: "PATCH", body: { externalSharing } });
      toast(externalSharing ? "Members can now share outside the workspace" : "Sharing outside the workspace is off. Existing outside shares stop working.");
    });
  const setMine = (enabled: boolean) =>
    run("me", async () => {
      await api("/api/me/outside-sharing", { method: "PATCH", body: { enabled } });
      toast(enabled ? "You can now share outside the workspace" : "Your outside shares are paused");
    });
  const saveDomains = (list: string[]) =>
    run("domains", async () => {
      await api("/api/workspaces/current", { method: "PATCH", body: { allowedDomains: list } });
      setDomains(list);
      toast("Allowed domains saved");
    });

  const addDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const d = draft.trim().toLowerCase().replace(/^@/, "");
    if (!d || domains.includes(d)) return setDraft("");
    setDraft("");
    saveDomains([...domains, d]);
  };

  const toggle = (on: boolean, onChange: (v: boolean) => void, disabled: boolean, label: string) => (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-primary-container" : "bg-surface-container-highest"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );

  return (
    <section id="settings-outside" className={className}>
      <p className="font-headline-sm text-[17px]">Sharing outside {company.name}</p>
      <p className="mb-5 font-body-md text-body-md text-text-secondary">
        People outside the workspace get view-only access by email and confirm their address with a one-time code. Everything in Team Files is already shared with every member.
      </p>

      {company.isAdmin && (
        <div className="mb-4 rounded-xl bg-surface-container-low p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary-container">
              <Icon name="admin_panel_settings" className="text-[22px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-title-md text-[15px]">
                Allow members to share outside {company.name}
                <span className="rounded-full bg-surface px-2 font-label-md text-label-md text-text-secondary">Admins</span>
              </p>
              <p className="font-body-md text-body-md text-text-secondary">Each member must also turn it on for themselves. Turning this off stops every outside share at once.</p>
            </div>
            {toggle(company.externalSharing, setWorkspace, busy !== null, "Allow sharing outside the workspace")}
          </div>
          {company.externalSharing && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="font-title-md text-title-md">Allowed domains <span className="font-normal text-text-secondary">optional</span></p>
              <p className="mb-3 font-body-sm text-body-sm text-text-secondary">Limit outside sharing to these email domains. Leave empty to allow any address.</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {domains.map((d) => (
                  <span key={d} className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 font-body-md text-body-md shadow-sm">
                    @{d}
                    <button aria-label={`Remove ${d}`} disabled={busy !== null} onClick={() => saveDomains(domains.filter((x) => x !== d))} className="text-outline hover:text-danger">
                      <Icon name="close" className="text-[16px]" />
                    </button>
                  </span>
                ))}
                {!domains.length && <span className="font-body-md text-body-md text-text-secondary">Any domain</span>}
              </div>
              <form onSubmit={addDomain} className="flex gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="designcorp.com" className="h-10 min-w-0 flex-1 rounded-lg bg-surface px-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/20" />
                <button className={btn.secondary} disabled={busy !== null || !draft.trim()}>Add</button>
              </form>
            </div>
          )}
        </div>
      )}

      <div className={`flex items-start gap-4 rounded-xl p-5 ${company.externalSharing ? "bg-surface-container-low" : "bg-surface-container-low opacity-70"}`}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fef3c7] text-[#b45309]">
          <Icon name="public" className="text-[22px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-title-md text-[15px]">Let me share with people outside {company.name}</p>
          <p className="font-body-md text-body-md text-text-secondary">
            {company.externalSharing
              ? "Turning this off pauses everything you've shared outside the workspace."
              : company.isAdmin
                ? "Allow it for the workspace above first."
                : "Your workspace admin hasn't allowed this yet."}
          </p>
        </div>
        {toggle(company.mine && company.externalSharing, setMine, busy !== null || !company.externalSharing, "Let me share outside the workspace")}
      </div>
    </section>
  );
}
