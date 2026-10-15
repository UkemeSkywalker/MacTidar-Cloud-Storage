"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { Avatar } from "../Avatar";
import { btn } from "../Dialog";
import { Icon } from "../Icon";
import { toast } from "../toast";
import { FileIcon } from "./FileIcon";
import type { AccessRole } from "./types";

type Entry = { userId: string; name: string; email: string; role: AccessRole; inheritedFrom?: { id: string; name: string } };
type LinkInfo = { url: string; allowDownload: boolean; hasPassword: boolean; expiresAt: string | null };
type Data = {
  item: { id: string; name: string; type: "folder" | "file"; size: number };
  myRole: AccessRole;
  entries: Entry[];
  members: { id: string; name: string; email: string }[];
  link: LinkInfo | null;
};

const EXPIRY = [
  { label: "Never", days: null },
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
] as const;

export function ShareDialog({ itemId, meId, onClose, onChanged }: { itemId: string; meId: string; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"people" | "link">("people");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api<Data>(`/api/items/${itemId}/shares`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [itemId]);

  useEffect(() => {
    load();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [load, onClose]);

  const changed = async () => {
    await load();
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between px-7 pt-7">
          <div className="flex min-w-0 items-center gap-3">
            {data ? <FileIcon type={data.item.type} name={data.item.name} /> : <div className="h-10 w-10 rounded-lg bg-surface-container-high" />}
            <div className="min-w-0">
              <h2 className="truncate font-headline-sm text-[18px] text-text-primary">Share &lsquo;{data?.item.name ?? "…"}&rsquo;</h2>
              <p className="font-body-sm text-body-sm text-text-secondary">
                {data ? (data.item.type === "folder" ? "Folder" : `File · ${formatBytes(data.item.size)}`) : ""}
              </p>
            </div>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-outline hover:bg-surface-container-low hover:text-text-primary">
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>
        <div className="mx-7 mt-5 flex gap-6 border-b border-border">
          {(
            [
              ["people", "group", "Teammates"],
              ["link", "link", "Public link"],
            ] as const
          ).map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`-mb-px flex items-center gap-2 border-b-2 pb-2.5 font-title-md text-[15px] ${tab === key ? "border-primary-container text-primary" : "border-transparent text-on-surface-variant hover:text-text-primary"}`}
            >
              <Icon name={icon} className="text-[20px]" /> {label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto px-7 py-5">
          {error && <p className="font-body-md text-body-md text-danger">{error}</p>}
          {!data && !error && <p className="py-8 text-center text-text-secondary">Loading…</p>}
          {data && tab === "people" && <People data={data} meId={meId} onChanged={changed} />}
          {data && tab === "link" && <PublicLink data={data} onChanged={changed} />}
        </div>
        <div className="flex items-center justify-between gap-3 px-7 pb-7 pt-2">
          {data?.item.type === "folder" ? (
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/folders/${itemId}`);
                toast("Folder link copied (teammates with access can open it)");
              }}
              className="flex items-center gap-2 font-title-md text-[15px] text-primary hover:underline"
            >
              <Icon name="link" className="text-[20px]" /> Copy folder link
            </button>
          ) : (
            <span />
          )}
          <button className={btn.primary} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function People({ data, meId, onChanged }: { data: Data; meId: string; onChanged: () => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [pick, setPick] = useState<{ id: string; name: string; email: string } | null>(null);
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("EDITOR");
  const [busy, setBusy] = useState(false);
  const canManage = data.myRole === "OWNER" || data.myRole === "EDITOR";

  const candidates = useMemo(() => {
    const has = new Set(data.entries.filter((e) => !e.inheritedFrom || e.role === "OWNER").map((e) => e.userId));
    const q = query.trim().toLowerCase();
    return data.members.filter((m) => m.id !== meId && !has.has(m.id) && (!q || m.name.toLowerCase().includes(q) || m.email.includes(q)));
  }, [data, query, meId]);

  async function grant(userId: string, r: "VIEWER" | "EDITOR", name: string) {
    setBusy(true);
    try {
      await api(`/api/items/${data.item.id}/shares/${userId}`, { method: "PUT", body: { role: r } });
      toast(`${name} now has ${r === "EDITOR" ? "editor" : "viewer"} access`);
      setPick(null);
      setQuery("");
      await onChanged();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function revoke(e: Entry) {
    try {
      await api(`/api/items/${data.item.id}/shares/${e.userId}`, { method: "DELETE" });
      toast(`Removed ${e.name}'s access`);
      await onChanged();
    } catch (err) {
      toast((err as Error).message, { tone: "error" });
    }
  }

  return (
    <>
      {canManage ? (
        <>
          <p className="mb-2 font-body-sm text-body-sm text-text-secondary">Add people to this {data.item.type}</p>
          <div className="relative mb-5 flex gap-2">
            <div className="relative flex-1">
              <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline" />
              <input
                value={pick ? pick.name : query}
                onChange={(e) => {
                  setPick(null);
                  setQuery(e.target.value);
                }}
                placeholder="Name or email"
                className="h-11 w-full rounded-lg bg-surface pl-10 pr-3 font-body-md text-body-md shadow-[inset_0_0_0_1px_#E5E7EB] focus:outline-none focus:ring-2 focus:ring-primary-container/30"
              />
              {!pick && query && (
                <div className="absolute left-0 right-0 top-12 z-10 max-h-56 overflow-y-auto rounded-xl bg-surface py-1 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                  {candidates.length === 0 && <p className="px-4 py-3 font-body-sm text-body-sm text-text-secondary">No teammates match. Invite them from Admin → Members first.</p>}
                  {candidates.map((m) => (
                    <button key={m.id} onClick={() => setPick(m)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-container-low">
                      <Avatar name={m.name} id={m.id} />
                      <span className="min-w-0">
                        <span className="block truncate font-title-md text-title-md">{m.name}</span>
                        <span className="block truncate font-body-sm text-body-sm text-text-secondary">{m.email}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select value={role} onChange={(e) => setRole(e.target.value as "VIEWER" | "EDITOR")} className="h-11 rounded-lg bg-surface-container-low px-3 font-title-md text-title-md">
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button disabled={!pick || busy} onClick={() => pick && grant(pick.id, role, pick.name)} className={btn.primary}>
              Invite
            </button>
          </div>
        </>
      ) : (
        <p className="mb-4 rounded-lg bg-surface-container-low p-3 font-body-sm text-body-sm text-text-secondary">You have view-only access, so you can&apos;t share this item.</p>
      )}

      <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">People with access</p>
      <ul className="mb-4 space-y-1">
        {data.entries.map((e) => (
          <li key={e.userId} className="flex items-center gap-3 py-1.5">
            <Avatar name={e.name} id={e.userId} size="h-10 w-10 text-[13px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-title-md text-title-md text-text-primary">
                {e.name} {e.userId === meId && <span className="font-normal text-text-secondary">(You)</span>}
              </p>
              <p className="truncate font-body-sm text-body-sm text-text-secondary">{e.inheritedFrom ? `Access via "${e.inheritedFrom.name}"` : e.email}</p>
            </div>
            {e.role === "OWNER" ? (
              <span className="rounded-full bg-surface-container-high px-3 py-1 font-label-md text-label-md text-on-surface-variant">Owner</span>
            ) : e.inheritedFrom || !canManage || e.userId === meId ? (
              <span className={`rounded-full px-3 py-1 font-label-md text-label-md ${e.role === "EDITOR" ? "bg-primary-fixed text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                {e.role === "EDITOR" ? "Editor" : "Viewer"}
              </span>
            ) : (
              <>
                <select
                  value={e.role}
                  onChange={(ev) => grant(e.userId, ev.target.value as "VIEWER" | "EDITOR", e.name)}
                  className="h-9 rounded-lg bg-surface-container-low px-2 font-label-md text-label-md"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <button aria-label={`Remove ${e.name}`} onClick={() => revoke(e)} className="rounded-lg p-1.5 text-outline hover:bg-surface-container-low hover:text-danger">
                  <Icon name="close" className="text-[20px]" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {data.item.type === "folder" && (
        <div className="flex gap-3 rounded-xl bg-surface-container-low p-4 font-body-md text-body-md text-on-surface-variant">
          <Icon name="info" className="text-[20px] text-primary" />
          Access applies to everything inside this folder, including subfolders and newly added files.
        </div>
      )}
    </>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-primary-container" : "bg-surface-container-highest"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

function PublicLink({ data, onChanged }: { data: Data; onChanged: () => Promise<void> }) {
  const link = data.link;
  const isOwner = data.myRole === "OWNER";
  const [allowDownload, setAllowDownload] = useState(link?.allowDownload ?? true);
  const [requirePw, setRequirePw] = useState(link?.hasPassword ?? false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [expiry, setExpiry] = useState<number | null | "keep">(link ? "keep" : 7);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAllowDownload(link?.allowDownload ?? true);
    setRequirePw(link?.hasPassword ?? false);
  }, [link?.allowDownload, link?.hasPassword]);

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Icon name="lock" className="text-[32px] text-outline" />
        <p className="font-title-md text-title-md">Only the owner can create public links</p>
        <p className="font-body-md text-body-md text-text-secondary">
          {link ? "A public link is active for this item." : "Ask the owner if you need to share this outside the team."}
        </p>
      </div>
    );
  }

  async function save(overrides: Partial<{ allowDownload: boolean }> = {}) {
    if (requirePw && !link?.hasPassword && password.length < 4) return toast("Enter a password of at least 4 characters.", { tone: "error" });
    setBusy(true);
    try {
      await api(`/api/items/${data.item.id}/link`, {
        method: "PUT",
        body: {
          allowDownload: overrides.allowDownload ?? allowDownload,
          password: requirePw ? (password ? password : undefined) : link?.hasPassword ? null : undefined,
          expiresInDays: expiry === "keep" ? undefined : expiry,
        },
      });
      setPassword("");
      setExpiry("keep");
      toast(link ? "Link settings saved" : "Public link created");
      await onChanged();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      await api(`/api/items/${data.item.id}/link`, { method: "DELETE" });
      toast("Public link disabled");
      setExpiry(7);
      await onChanged();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  const expiresLabel = link?.expiresAt
    ? `Expires ${new Date(link.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : "Never expires";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-4">
        <span className={`h-2.5 w-2.5 rounded-full ${link ? "bg-tertiary" : "bg-outline-variant"}`} />
        <div className="flex-1">
          <p className="font-title-md text-[15px]">Public link is {link ? "ON" : "OFF"}</p>
          <p className="font-body-sm text-body-sm text-text-secondary">{link ? `Anyone with this link can view · ${expiresLabel}` : "Create a link anyone can open, even without an account"}</p>
        </div>
        <Toggle on={!!link} label="Public link" onChange={(v) => (v ? save() : disable())} />
      </div>

      {link && (
        <div className="flex gap-2">
          <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg bg-surface-container-low px-3">
            <Icon name="link" className="text-[18px] text-outline" />
            <input readOnly value={link.url} className="min-w-0 flex-1 bg-transparent font-body-md text-body-md focus:outline-none" onFocus={(e) => e.target.select()} />
          </div>
          <button
            className={btn.primary}
            onClick={() => {
              navigator.clipboard.writeText(link.url);
              toast("Link copied");
            }}
          >
            <Icon name="content_copy" className="text-[18px]" /> Copy link
          </button>
        </div>
      )}

      <div className="divide-y divide-border rounded-xl bg-surface-container-low px-5">
        <div className="flex items-center gap-4 py-4">
          <div className="flex-1">
            <p className="font-title-md text-[15px]">Allow downloads</p>
            <p className="font-body-sm text-body-sm text-text-secondary">Anyone with the link can download files</p>
          </div>
          <Toggle
            on={allowDownload}
            label="Allow downloads"
            onChange={(v) => {
              setAllowDownload(v);
              if (link) save({ allowDownload: v });
            }}
          />
        </div>
        <div className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="font-title-md text-[15px]">Require password</p>
              <p className="font-body-sm text-body-sm text-text-secondary">Visitors must enter a password to view files</p>
            </div>
            <Toggle on={requirePw} label="Require password" onChange={setRequirePw} />
          </div>
          {requirePw && (
            <div className="relative mt-3">
              <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={link?.hasPassword ? "Password set — type to change it" : "Set a password"}
                className="h-11 w-full rounded-lg bg-surface pl-10 pr-10 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/30"
              />
              <button aria-label="Show password" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline">
                <Icon name={showPw ? "visibility_off" : "visibility"} className="text-[20px]" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 py-4">
          <div className="flex-1">
            <p className="font-title-md text-[15px]">Expires</p>
            <p className="font-body-sm text-body-sm text-text-secondary">{link ? expiresLabel : "Link will automatically deactivate"}</p>
          </div>
          <select
            value={expiry === "keep" ? "keep" : String(expiry)}
            onChange={(e) => setExpiry(e.target.value === "keep" ? "keep" : e.target.value === "null" ? null : Number(e.target.value))}
            className="h-10 rounded-lg bg-surface px-3 font-title-md text-title-md shadow-sm"
          >
            {link && <option value="keep">Keep current</option>}
            {EXPIRY.map((o) => (
              <option key={o.label} value={String(o.days)}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {link ? (
          <button disabled={busy} onClick={disable} className="flex items-center gap-2 font-title-md text-[15px] text-danger hover:underline">
            <Icon name="link_off" className="text-[20px]" /> Disable link
          </button>
        ) : (
          <span />
        )}
        <button disabled={busy} onClick={() => save()} className={btn.secondary}>
          {link ? "Save settings" : "Create link"}
        </button>
      </div>
    </div>
  );
}
