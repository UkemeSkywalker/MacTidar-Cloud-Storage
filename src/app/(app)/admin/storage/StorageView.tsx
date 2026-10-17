"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { btn } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { toast } from "@/components/toast";
import { api } from "@/lib/api";
import { formatBytes } from "@/lib/format";

const GB = 1024 ** 3;
type Team = { quotaBytes: number; usedBytes: number; freeBytes: number; maxFileBytes: number; alertPercent: number };
type Stats = {
  files: number;
  byType: { video: number; image: number; docs: number; archive: number; other: number };
  uploadsThisMonth: number;
  bytesThisMonth: number;
  uploadsThisWeek: number;
  links: number;
  expiringLinks: number;
  trashBytes: number;
};

const TYPE_ROWS = [
  { key: "video", label: "Videos & audio", hint: "MP4, MOV, MP3", color: "bg-file-video" },
  { key: "image", label: "Images", hint: "PNG, JPG, WebP", color: "bg-file-image" },
  { key: "docs", label: "Documents & PDFs", hint: "PDF, DOCX, XLSX", color: "bg-file-doc" },
  { key: "archive", label: "Archives", hint: "ZIP, TAR.GZ, RAR", color: "bg-file-archive" },
  { key: "other", label: "Other files", hint: "Everything else", color: "bg-outline-variant" },
] as const;

export function StorageView({ team, stats, members }: { team: Team; stats: Stats; members: { id: string; name: string; role: string; usedBytes: number }[] }) {
  const router = useRouter();
  const [quotaGb, setQuotaGb] = useState(String(Math.round((team.quotaBytes / GB) * 10) / 10));
  const [maxFileGb, setMaxFileGb] = useState(String(Math.round((team.maxFileBytes / GB) * 10) / 10));
  const [alerts, setAlerts] = useState(team.alertPercent > 0);
  const [busy, setBusy] = useState(false);

  const pct = Math.min(100, Math.round((team.usedBytes / team.quotaBytes) * 100));
  const free = Math.max(0, team.quotaBytes - team.usedBytes);
  const health = pct >= 90 ? { label: "Critical", tone: "bg-error-container text-danger" } : pct >= 80 ? { label: "Near limit", tone: "bg-[#fef3c7] text-warning" } : { label: "Healthy", tone: "bg-primary-fixed text-primary" };
  const totalTyped = Object.values(stats.byType).reduce((a, b) => a + b, 0);
  const R = 70;
  const C = 2 * Math.PI * R;

  async function save() {
    setBusy(true);
    try {
      await api("/api/admin/settings", { method: "PATCH", body: { quotaGb: Number(quotaGb), maxFileGb: Number(maxFileGb), alerts } });
      toast("Storage settings saved");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  const card = "rounded-2xl bg-surface p-6 shadow-sm";
  return (
    <div className="mx-auto max-w-[1400px]">
      <p className="mb-1 font-label-md text-label-md uppercase tracking-wider text-text-secondary">
        Administration / <span className="text-primary">Storage &amp; quotas</span>
      </p>
      <h1 className="font-headline-lg text-[28px] text-text-primary">Storage &amp; Quotas</h1>
      <p className="mb-6 font-body-md text-body-md text-text-secondary">Monitor team storage use and set the limits for uploads.</p>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className={`${card} bg-gradient-to-br from-surface to-primary-soft/50`}>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">Volume allocation</p>
              <p className="font-headline-sm text-[17px] text-text-primary">Team storage capacity</p>
            </div>
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-label-md text-label-md ${health.tone}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> {health.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
                <circle cx="90" cy="90" r={R} fill="none" stroke="#edeef0" strokeWidth="16" />
                <circle cx="90" cy="90" r={R} fill="none" stroke={pct >= 90 ? "#DC2626" : pct >= 80 ? "#D97706" : "#2563eb"} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(C * pct) / 100} ${C}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[30px] font-semibold text-text-primary">{pct}%</span>
                <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">Utilised</span>
              </div>
            </div>
            <div>
              <p className="text-[20px] font-semibold text-text-primary">
                {formatBytes(team.usedBytes)} <span className="font-normal text-text-secondary">/ {formatBytes(team.quotaBytes, 0)}</span>
              </p>
              <p className="mb-3 font-body-md text-body-md text-text-secondary">{formatBytes(free)} available for upload</p>
              <p className="flex items-center gap-2 font-body-sm text-body-sm text-text-secondary">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary-container" /> Stored on Amazon S3
              </p>
              {stats.trashBytes > 0 && <p className="mt-1 font-body-sm text-body-sm text-text-secondary">Includes {formatBytes(stats.trashBytes)} in trash</p>}
            </div>
          </div>
        </div>
        <Metric icon="inventory_2" label="Total files" value={stats.files.toLocaleString()} note={`+${stats.uploadsThisWeek} uploaded this week`} noteIcon="trending_up" noteTone="text-tertiary" />
        <Metric icon="link" label="Public links active" value={String(stats.links)} note={stats.expiringLinks ? `${stats.expiringLinks} expiring within 72 hrs` : "None expiring soon"} noteIcon="timer" noteTone={stats.expiringLinks ? "text-warning" : "text-text-secondary"} />
        <Metric icon="cloud_upload" label="Uploads this month" value={String(stats.uploadsThisMonth)} note={`${formatBytes(stats.bytesThisMonth)} uploaded`} noteIcon="south" noteTone="text-text-secondary" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className={card}>
          <p className="font-headline-sm text-[17px] text-text-primary">Usage by member</p>
          <p className="mb-5 font-body-md text-body-md text-text-secondary">Each member&apos;s uploads against the team limit</p>
          <div className="space-y-5">
            {members.map((m) => (
              <div key={m.id}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-title-md text-[15px]">
                    <Avatar name={m.name} id={m.id} size="h-7 w-7 text-[11px]" /> {m.name}
                    <span className={`rounded-full px-2 font-label-md text-label-md ${m.role === "ADMIN" ? "bg-primary-fixed text-primary" : "bg-surface-container-high text-on-surface-variant"}`}>{m.role === "ADMIN" ? "Admin" : "Member"}</span>
                  </span>
                  <span className="font-title-md text-title-md">
                    {formatBytes(m.usedBytes)}{" "}
                    <span className="font-body-sm text-body-sm font-normal text-text-secondary">({team.usedBytes ? ((m.usedBytes / team.usedBytes) * 100).toFixed(1) : 0}% of used)</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary-container" style={{ width: `${Math.min(100, (m.usedBytes / team.quotaBytes) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3 font-body-md text-body-md">
            <span className="flex items-center gap-2">
              <Icon name="check_circle" className="text-[18px] text-tertiary" /> Unallocated pool headroom:
            </span>
            <span className="font-title-md text-tertiary">{formatBytes(free)} remaining</span>
          </div>
        </div>
        <div className={card}>
          <p className="font-headline-sm text-[17px] text-text-primary">Usage by file type</p>
          <p className="mb-5 font-body-md text-body-md text-text-secondary">Storage breakdown by kind of file</p>
          <div className="mb-6 flex h-3 overflow-hidden rounded-full bg-surface-container-high">
            {TYPE_ROWS.map((t) => (
              <div key={t.key} className={t.color} style={{ width: `${totalTyped ? (stats.byType[t.key] / totalTyped) * 100 : 0}%` }} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {TYPE_ROWS.map((t) => (
              <div key={t.key} className="flex items-start justify-between gap-3">
                <span className="flex gap-2.5">
                  <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${t.color}`} />
                  <span>
                    <span className="block font-title-md text-[15px]">{t.label}</span>
                    <span className="font-label-md text-label-md text-text-secondary">{t.hint}</span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-title-md text-[15px]">{formatBytes(stats.byType[t.key])}</span>
                  <span className="font-label-md text-label-md text-text-secondary">{totalTyped ? Math.round((stats.byType[t.key] / totalTyped) * 100) : 0}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-headline-sm text-[17px] text-text-primary">Storage limits</p>
            <p className="font-body-md text-body-md text-text-secondary">Set the team storage limit, the largest single upload, and usage alerts.</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1 font-label-md text-label-md text-on-surface-variant">
            <Icon name="verified_user" className="text-[16px]" /> Enforced on every upload
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl bg-surface-container-low p-5">
            <p className="font-title-md text-[15px]">Team storage limit</p>
            <p className="mb-3 font-body-md text-body-md text-text-secondary">Uploads are refused once the team reaches this limit.</p>
            <label className="flex h-12 items-center gap-3 rounded-lg bg-surface px-4 shadow-sm">
              <Icon name="hard_drive" className="text-[20px] text-on-surface-variant" />
              <input type="number" min={1} step={1} value={quotaGb} onChange={(e) => setQuotaGb(e.target.value)} className="w-full bg-transparent font-title-md text-[15px] focus:outline-none" />
              <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">GB</span>
            </label>
          </div>
          <div className="rounded-xl bg-surface-container-low p-5">
            <p className="font-title-md text-[15px]">Maximum single upload size</p>
            <p className="mb-3 font-body-md text-body-md text-text-secondary">Larger files are rejected before uploading starts.</p>
            <select value={maxFileGb} onChange={(e) => setMaxFileGb(e.target.value)} className="h-12 w-full rounded-lg bg-surface px-4 font-title-md text-[15px] shadow-sm">
              {["0.5", "1", "2", "5", "10", "20", "50"].map((v) => (
                <option key={v} value={v}>
                  {v === "0.5" ? "500 MB" : `${v} GB`} per file{v === "5" ? " (default)" : ""}
                </option>
              ))}
              {!["0.5", "1", "2", "5", "10", "20", "50"].includes(maxFileGb) && <option value={maxFileGb}>{maxFileGb} GB per file</option>}
            </select>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-surface-container-low p-5">
            <div className="flex-1">
              <p className="flex items-center gap-2 font-title-md text-[15px]">
                <Icon name="notifications_active" className="text-[20px] text-primary" /> Automatic alerts
              </p>
              <p className="font-body-md text-body-md text-text-secondary">Email admins when team usage passes 80% ({formatBytes(Number(quotaGb) * GB * 0.8, 1)}).</p>
            </div>
            <button
              role="switch"
              aria-checked={alerts}
              aria-label="Automatic alerts"
              onClick={() => setAlerts(!alerts)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${alerts ? "bg-primary-container" : "bg-surface-container-highest"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${alerts ? "left-6" : "left-1"}`} />
            </button>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-surface-container-low p-5">
            <div className="flex-1">
              <p className="flex items-center gap-2 font-title-md text-[15px]">
                <Icon name="auto_delete" className="text-[20px] text-danger" /> Trash auto-purge
              </p>
              <p className="font-body-md text-body-md text-text-secondary">Deleted files are permanently removed after the retention period.</p>
            </div>
            <span className="rounded-lg bg-surface px-3 py-2 text-center font-title-md text-[15px] shadow-sm">
              30 days <span className="block font-label-sm text-label-sm text-text-secondary">Fixed</span>
            </span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 font-body-sm text-body-sm text-text-secondary">
            <Icon name="info" className="text-[16px]" /> Changes apply to new uploads immediately.
          </p>
          <div className="flex gap-3">
            <button
              className={btn.text}
              onClick={() => {
                setQuotaGb(String(Math.round((team.quotaBytes / GB) * 10) / 10));
                setMaxFileGb(String(Math.round((team.maxFileBytes / GB) * 10) / 10));
                setAlerts(team.alertPercent > 0);
              }}
            >
              Reset
            </button>
            <button className={btn.primary} disabled={busy} onClick={save}>
              <Icon name="save" className="text-[18px]" /> {busy ? "Saving…" : "Save storage settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, note, noteIcon, noteTone }: { icon: string; label: string; value: string; note: string; noteIcon: string; noteTone: string }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-surface p-6 shadow-sm">
      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-low text-primary">
        <Icon name={icon} className="text-[24px]" />
      </div>
      <div>
        <p className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">{label}</p>
        <p className="text-[30px] font-semibold text-text-primary">{value}</p>
        <p className={`flex items-center gap-1.5 font-body-sm text-body-sm ${noteTone}`}>
          <Icon name={noteIcon} className="text-[16px]" /> {note}
        </p>
      </div>
    </div>
  );
}
