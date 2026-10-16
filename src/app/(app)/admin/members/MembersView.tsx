"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { btn, Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";
import { formatBytes, formatDate, initials, timeAgo } from "@/lib/format";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "DISABLED";
  usedBytes: number;
  lastActiveAt?: string;
};
type Invite = { id: string; email: string; role: "ADMIN" | "MEMBER"; createdAt: string };
type InviteResult = { email: string; sent: boolean; link: string };

export function MembersView({
  meId,
  members,
  invites,
  teamUsedBytes,
  quotaBytes,
}: {
  meId: string;
  members: Member[];
  invites: Invite[];
  teamUsedBytes: number;
  quotaBytes: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "MEMBER">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED" | "INVITED">("ALL");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [links, setLinks] = useState<InviteResult[] | null>(null);
  const [confirm, setConfirm] = useState<Member | null>(null);

  const active = members.filter((m) => m.status === "ACTIVE").length;
  const q = query.trim().toLowerCase();
  const matches = (name: string, email: string) => !q || name.toLowerCase().includes(q) || email.includes(q);

  const shownMembers = members.filter(
    (m) =>
      matches(m.name, m.email) &&
      (roleFilter === "ALL" || m.role === roleFilter) &&
      (statusFilter === "ALL" || statusFilter === m.status),
  );
  const shownInvites = invites.filter(
    (i) => matches("", i.email) && (roleFilter === "ALL" || i.role === roleFilter) && (statusFilter === "ALL" || statusFilter === "INVITED"),
  );

  async function patch(member: Member, body: Partial<Pick<Member, "role" | "status">>, message: string) {
    try {
      await api(`/api/admin/members/${member.id}`, { method: "PATCH", body });
      toast(message);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, { tone: "error" });
    }
  }

  async function resend(invite: Invite) {
    try {
      const { result } = await api<{ result: InviteResult }>(`/api/admin/invites/${invite.id}/resend`, { body: {} });
      if (result.sent) toast(`Invite re-sent to ${invite.email}`);
      else setLinks([result]);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, { tone: "error" });
    }
  }

  async function revoke(invite: Invite) {
    try {
      await api(`/api/admin/invites/${invite.id}`, { method: "DELETE" });
      toast(`Invite for ${invite.email} cancelled`);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, { tone: "error" });
    }
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-headline-lg text-text-primary">Team members ({members.length})</h1>
            {invites.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-primary-fixed px-2.5 py-0.5 font-label-md text-label-md text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {invites.length} pending invite{invites.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="mt-1 font-body-md text-body-md text-text-secondary">Manage teammates, their roles, and account access.</p>
        </div>
        <button className={btn.primary} onClick={() => setInviteOpen(true)}>
          <Icon name="person_add" className="text-[20px]" /> Invite member
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total members" value={String(members.length)} unit="accounts" icon="group" tone="bg-primary-fixed text-primary-container" />
        <Stat label="Active status" value={String(active)} unit="Active" unitClass="text-tertiary" icon="verified_user" tone="bg-tertiary-fixed/60 text-tertiary" />
        <Stat label="Pending invites" value={String(invites.length)} unit="Pending" unitClass="text-warning" icon="mail" tone="bg-warning/10 text-warning" />
        <Stat label="Used storage" value={formatBytes(teamUsedBytes).split(" ")[0]} unit={`${formatBytes(teamUsedBytes).split(" ")[1]} of ${formatBytes(quotaBytes, 0)}`} icon="cloud_sync" tone="bg-secondary-container text-secondary" />
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-xl bg-surface p-2.5 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members by name or email..."
            className="h-10 w-full rounded-lg bg-surface-container-low pl-10 pr-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/20 sm:max-w-[480px]"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)} className="h-10 rounded-lg bg-surface-container-low px-3 font-title-md text-title-md">
          <option value="ALL">Role: All roles</option>
          <option value="ADMIN">Role: Admin</option>
          <option value="MEMBER">Role: Member</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="h-10 rounded-lg bg-surface-container-low px-3 font-title-md text-title-md">
          <option value="ALL">Status: All statuses</option>
          <option value="ACTIVE">Status: Active</option>
          <option value="INVITED">Status: Invited</option>
          <option value="DISABLED">Status: Deactivated</option>
        </select>
        <button aria-label="Refresh" onClick={() => router.refresh()} className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant hover:text-text-primary">
          <Icon name="refresh" className="text-[20px]" />
        </button>
      </div>

      <ul className="mb-4 divide-y divide-border rounded-xl bg-surface shadow-sm [&>li:first-child]:rounded-t-xl [&>li:last-child]:rounded-b-xl md:hidden">
        {shownMembers.map((m) => (
          <li key={m.id} className={`flex items-center gap-3 py-3 pl-3 pr-1 ${m.status === "DISABLED" ? "opacity-60" : ""}`}>
            <Avatar name={m.name} id={m.id} size="h-10 w-10 text-[14px]" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-title-md text-title-md text-text-primary">
                <span className="truncate">{m.name}</span>
                {m.id === meId && <span className="rounded bg-primary-fixed px-1.5 font-label-sm text-label-sm text-primary">You</span>}
              </p>
              <p className="truncate font-body-sm text-body-sm text-text-secondary">{m.email}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${m.role === "ADMIN" ? "bg-primary-fixed text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                  {m.role === "ADMIN" ? "Admin" : "Member"}
                </span>
                <span className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${m.status === "ACTIVE" ? "bg-tertiary-fixed/50 text-on-tertiary-fixed-variant" : "bg-error-container text-on-error-container"}`}>
                  {m.status === "ACTIVE" ? "Active" : "Deactivated"}
                </span>
                <span className="font-label-sm text-label-sm text-text-secondary">{formatBytes(m.usedBytes)} used</span>
              </p>
            </div>
            {m.id !== meId && (
              <RowMenu
                items={[
                  {
                    label: m.role === "ADMIN" ? "Make member" : "Make admin",
                    icon: "manage_accounts",
                    onClick: () => patch(m, { role: m.role === "ADMIN" ? "MEMBER" : "ADMIN" }, `${m.name} is now ${m.role === "ADMIN" ? "a member" : "an admin"}`),
                  },
                  m.status === "ACTIVE"
                    ? { label: "Deactivate member", icon: "person_off", danger: true, onClick: () => setConfirm(m) }
                    : { label: "Reactivate member", icon: "person_check", onClick: () => patch(m, { status: "ACTIVE" }, `${m.name} reactivated`) },
                ]}
              />
            )}
          </li>
        ))}
        {shownInvites.map((i) => (
          <li key={i.id} className="flex items-center gap-3 py-3 pl-3 pr-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-semibold text-on-surface-variant">
              {initials(i.email.split("@")[0])}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-title-md text-title-md text-text-secondary">{i.email}</p>
              <p className="mt-1 flex items-center gap-1.5">
                <span className="rounded-full bg-warning/10 px-2 py-0.5 font-label-sm text-label-sm text-warning">Invited</span>
                <span className="font-label-sm text-label-sm text-text-secondary">{formatDate(i.createdAt)}</span>
              </p>
            </div>
            <RowMenu
              items={[
                { label: "Resend invite", icon: "forward_to_inbox", onClick: () => resend(i) },
                { label: "Cancel invite", icon: "cancel", danger: true, onClick: () => revoke(i) },
              ]}
            />
          </li>
        ))}
        {shownMembers.length + shownInvites.length === 0 && <li className="px-4 py-8 text-center text-text-secondary">No members match your filters.</li>}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl bg-surface shadow-sm md:block">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">
              <th className="px-5 py-4 font-medium">Member</th>
              <th className="px-3 py-4 font-medium">Role</th>
              <th className="px-3 py-4 font-medium">Status</th>
              <th className="px-3 py-4 font-medium">Storage used</th>
              <th className="px-3 py-4 font-medium">Last active</th>
              <th className="px-5 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shownMembers.map((m) => (
              <tr key={m.id} className={`border-t border-border transition-colors hover:bg-surface-container-low/50 ${m.status === "DISABLED" ? "opacity-60" : ""}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} id={m.id} size="h-10 w-10 text-[14px]" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-title-md text-title-md text-text-primary">{m.name}</span>
                        {m.id === meId && <span className="rounded bg-primary-fixed px-1.5 font-label-sm text-label-sm text-primary">You</span>}
                      </div>
                      <span className="font-body-sm text-body-sm text-text-secondary">{m.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <span className={`rounded-full px-3 py-1 font-label-md text-label-md ${m.role === "ADMIN" ? "bg-primary-fixed text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                    {m.role === "ADMIN" ? "Admin" : "Member"}
                  </span>
                </td>
                <td className="px-3 py-3.5">
                  {m.status === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-fixed/50 px-3 py-1 font-label-md text-label-md text-on-tertiary-fixed-variant">
                      <span className="h-1.5 w-1.5 rounded-full bg-tertiary" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-error-container px-3 py-1 font-label-md text-label-md text-on-error-container">
                      <Icon name="block" className="text-[14px]" /> Deactivated
                    </span>
                  )}
                </td>
                <td className="px-3 py-3.5">
                  <div className="w-40">
                    <div className="mb-1 flex justify-between font-label-md text-label-md">
                      <span className="text-text-primary">{formatBytes(m.usedBytes)}</span>
                      <span className="text-text-secondary">of {formatBytes(quotaBytes, 0)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                      <div className="h-full rounded-full bg-primary-container" style={{ width: `${Math.min(100, (m.usedBytes / quotaBytes) * 100)}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 font-body-sm text-body-sm text-text-secondary">{m.id === meId ? "Now" : timeAgo(m.lastActiveAt)}</td>
                <td className="px-5 py-3.5 text-right">
                  {m.id !== meId && (
                    <RowMenu
                      items={[
                        {
                          label: m.role === "ADMIN" ? "Make member" : "Make admin",
                          icon: "manage_accounts",
                          onClick: () => patch(m, { role: m.role === "ADMIN" ? "MEMBER" : "ADMIN" }, `${m.name} is now ${m.role === "ADMIN" ? "a member" : "an admin"}`),
                        },
                        m.status === "ACTIVE"
                          ? { label: "Deactivate member", icon: "person_off", danger: true, onClick: () => setConfirm(m) }
                          : { label: "Reactivate member", icon: "person_check", onClick: () => patch(m, { status: "ACTIVE" }, `${m.name} reactivated`) },
                      ]}
                    />
                  )}
                </td>
              </tr>
            ))}
            {shownInvites.map((i) => (
              <tr key={i.id} className="border-t border-border hover:bg-surface-container-low/50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high font-semibold text-on-surface-variant">
                      {initials(i.email.split("@")[0])}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-title-md text-title-md text-text-secondary">{i.email.split("@")[0]}</span>
                        <span className="rounded bg-warning/10 px-1.5 font-label-sm text-label-sm text-warning">Invited</span>
                      </div>
                      <span className="font-body-sm text-body-sm text-text-secondary">{i.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <span className="rounded-full bg-surface-container-high px-3 py-1 font-label-md text-label-md text-on-surface-variant">{i.role === "ADMIN" ? "Admin" : "Member"}</span>
                </td>
                <td className="px-3 py-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 font-label-md text-label-md text-warning">
                    <Icon name="schedule" className="text-[14px]" /> Pending acceptance
                  </span>
                </td>
                <td className="px-3 py-3.5 text-text-secondary">—</td>
                <td className="px-3 py-3.5 font-body-sm text-body-sm text-text-secondary">Invited {formatDate(i.createdAt)}</td>
                <td className="px-5 py-3.5 text-right">
                  <RowMenu
                    items={[
                      { label: "Resend invite", icon: "forward_to_inbox", onClick: () => resend(i) },
                      { label: "Cancel invite", icon: "cancel", danger: true, onClick: () => revoke(i) },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {shownMembers.length + shownInvites.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-text-secondary">
                  No members match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center gap-2 border-t border-border px-5 py-3 font-body-sm text-body-sm text-text-secondary">
          <span className="h-2 w-2 rounded-full bg-primary-container" />
          {members.length} members · {active} active · {invites.length} invited · {formatBytes(teamUsedBytes)} team storage used
        </div>
      </div>

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(results) => {
          setInviteOpen(false);
          router.refresh();
          const unsent = results.filter((r) => !r.sent);
          if (unsent.length) setLinks(unsent);
          else toast(`Invite sent to ${results.map((r) => r.email).join(", ")}`);
        }}
      />

      <Dialog
        open={!!links}
        onClose={() => setLinks(null)}
        title="Share the invite link"
        icon={<Icon name="link" className="text-[22px] text-primary" />}
        footer={<button className={btn.primary} onClick={() => setLinks(null)}>Done</button>}
      >
        <p className="mb-4 font-body-md text-body-md text-text-secondary">
          The email couldn&apos;t be delivered (email sending may still be in AWS sandbox mode). Copy the link below and send it to your teammate yourself. It expires in 7 days.
        </p>
        {links?.map((l) => (
          <div key={l.link} className="mb-3">
            <p className="mb-1 font-title-md text-title-md">{l.email}</p>
            <div className="flex gap-2">
              <input readOnly value={l.link} className="h-10 min-w-0 flex-1 rounded-lg bg-surface-container-low px-3 font-body-sm text-body-sm" />
              <button
                className={btn.secondary}
                onClick={() => {
                  navigator.clipboard.writeText(l.link);
                  toast("Link copied");
                }}
              >
                <Icon name="content_copy" className="text-[18px]" /> Copy
              </button>
            </div>
          </div>
        ))}
      </Dialog>

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Deactivate ${confirm?.name}?`}
        icon={<Icon name="person_off" className="text-[22px] text-danger" />}
        footer={
          <>
            <button className={btn.text} onClick={() => setConfirm(null)}>Cancel</button>
            <button
              className={btn.danger}
              onClick={() => {
                const m = confirm!;
                setConfirm(null);
                patch(m, { status: "DISABLED" }, `${m.name} deactivated`);
              }}
            >
              Deactivate
            </button>
          </>
        }
      >
        <p className="font-body-md text-body-md text-text-secondary">
          They&apos;ll be signed out everywhere and won&apos;t be able to sign in. Their files stay where they are, and you can reactivate them later.
        </p>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, unit, unitClass = "text-text-secondary", icon, tone }: { label: string; value: string; unit: string; unitClass?: string; icon: string; tone: string }) {
  return (
    <div className="flex items-start justify-between rounded-xl bg-surface p-5 shadow-sm">
      <div>
        <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-text-secondary">{label}</p>
        <p className="text-[26px] font-semibold leading-none text-text-primary">
          {value} <span className={`font-body-md text-body-md font-normal ${unitClass}`}>{unit}</span>
        </p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
        <Icon name={icon} className="text-[22px]" />
      </div>
    </div>
  );
}

function RowMenu({ items }: { items: { label: string; icon: string; danger?: boolean; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div className="relative inline-block" ref={ref}>
      <button aria-label="Actions" onClick={(e) => {
          setUp(window.innerHeight - e.currentTarget.getBoundingClientRect().bottom < 320);
          setOpen((o) => !o);
        }} className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low">
        <Icon name="more_vert" className="text-[20px]" />
      </button>
      {open && (
        <div className={`absolute right-0 ${up ? "bottom-10" : "top-10"} z-20 w-56 rounded-xl bg-surface py-1 text-left shadow-[0_10px_30px_rgba(0,0,0,0.12)]`}>
          <p className="px-4 pb-1 pt-2 font-label-sm text-label-sm uppercase tracking-wider text-text-secondary">Manage</p>
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 font-body-md text-body-md hover:bg-surface-container-low ${it.danger ? "text-danger" : "text-text-primary"}`}
            >
              <Icon name={it.icon} className="text-[20px]" /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InviteDialog({ open, onClose, onInvited }: { open: boolean; onClose: () => void; onInvited: (r: InviteResult[]) => void }) {
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setEmails([]);
      setDraft("");
      setRole("MEMBER");
      setMessage("");
      setError(null);
    }
  }, [open]);

  const addDraft = (value = draft) => {
    const parts = value.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (parts.length) setEmails((e) => [...new Set([...e, ...parts])]);
    setDraft("");
  };

  const all = useMemo(() => [...new Set([...emails, ...draft.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)])], [emails, draft]);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const { results } = await api<{ results: InviteResult[] }>("/api/admin/invites", {
        body: { emails: all, role, message: message.trim() || undefined },
      });
      onInvited(results);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="max-w-[640px]"
      title="Invite a teammate"
      icon={
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary-container">
          <Icon name="person_add" className="text-[22px]" />
        </div>
      }
      footer={
        <>
          <button className={btn.text} onClick={onClose}>Cancel</button>
          <button className={btn.primary} disabled={busy || all.length === 0} onClick={send}>
            <Icon name="send" className="text-[18px]" /> {busy ? "Sending…" : "Send invite"}
          </button>
        </>
      }
    >
      <label className="mb-1.5 block font-title-md text-title-md text-text-primary">Email addresses</label>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-lg bg-surface-container-low p-2">
        {emails.map((e) => (
          <span key={e} className="flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 font-body-sm text-body-sm shadow-sm">
            <Icon name="mail" className="text-[16px] text-primary" /> {e}
            <button aria-label={`Remove ${e}`} onClick={() => setEmails((x) => x.filter((y) => y !== e))} className="text-outline hover:text-text-primary">
              <Icon name="close" className="text-[14px]" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          autoFocus
          onChange={(e) => (/[,;\s]$/.test(e.target.value) ? addDraft(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            } else if (e.key === "Backspace" && !draft && emails.length) setEmails((x) => x.slice(0, -1));
          }}
          onBlur={() => addDraft()}
          placeholder={emails.length ? "" : "name@example.com"}
          className="h-8 min-w-[180px] flex-1 bg-transparent px-1 font-body-md text-body-md focus:outline-none"
        />
      </div>
      <p className="mb-5 mt-1.5 font-label-md text-label-md text-text-secondary">Separate multiple teammates with commas or line breaks.</p>

      <p className="mb-2 font-headline-sm text-headline-sm text-text-primary">Assign workspace role</p>
      {(
        [
          { value: "MEMBER", title: "Member", badge: "Standard", desc: "Can upload, organise and share files across team folders.", note: "Full collaboration access", noteIcon: "check_circle" },
          { value: "ADMIN", title: "Admin", badge: "Privileged", desc: "Also manages members and the team storage limit.", note: "Access to admin settings", noteIcon: "shield" },
        ] as const
      ).map((o) => (
        <label key={o.value} className={`mb-2 flex cursor-pointer gap-3 rounded-xl p-4 transition-colors ${role === o.value ? "bg-primary-soft shadow-[inset_0_0_0_1px_#bfdbfe]" : "hover:bg-surface-container-low"}`}>
          <input type="radio" name="role" checked={role === o.value} onChange={() => setRole(o.value)} className="mt-1 h-4 w-4 accent-primary-container" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-title-md text-title-md text-text-primary">{o.title}</span>
              <span className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${o.value === "MEMBER" ? "bg-primary-fixed text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>{o.badge}</span>
            </div>
            <p className="mt-0.5 font-body-sm text-body-sm text-text-secondary">{o.desc}</p>
            <p className="mt-1 flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
              <Icon name={o.noteIcon} className={`text-[15px] ${o.value === "MEMBER" ? "text-tertiary" : ""}`} /> {o.note}
            </p>
          </div>
        </label>
      ))}

      <div className="mb-1.5 mt-4 flex items-center justify-between">
        <label className="font-title-md text-title-md text-text-primary">Add a personal message (optional)</label>
        <span className="font-label-md text-label-md text-text-secondary">{message.length} / 250</span>
      </div>
      <textarea
        value={message}
        maxLength={250}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Hey! Join our MacTidar workspace to access the team's shared files…"
        className="w-full resize-none rounded-lg bg-surface-container-low p-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/20"
      />
      <div className="mt-4 flex items-start gap-3 rounded-lg bg-surface-container-low p-3.5">
        <Icon name="info" className="mt-0.5 text-[20px] text-primary" />
        <p className="font-body-sm text-body-sm text-text-secondary">
          They&apos;ll receive an email with a secure link to set their password and join. Invites expire automatically in 7 days.
        </p>
      </div>
      {error && (
        <p className="mt-3 flex items-center gap-1.5 font-label-md text-label-md text-danger">
          <Icon name="error" className="text-[16px]" /> {error}
        </p>
      )}
    </Dialog>
  );
}
