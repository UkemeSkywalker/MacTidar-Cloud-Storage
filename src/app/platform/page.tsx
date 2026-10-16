import Link from "next/link";
import { Icon } from "@/components/Icon";
import { card, PageHeader, TypePill, WsBadge } from "@/components/platform/PlatformShell";
import { formatBytes } from "@/lib/format";
import { platformOverview } from "@/server/platform";

export default async function PlatformOverviewPage() {
  const o = await platformOverview();
  const peak = Math.max(1, ...o.signups.map((s) => s.count));
  const storagePct = o.storage.usedBytes ? Math.round((o.storage.companyBytes / o.storage.usedBytes) * 100) : 0;

  const stats = [
    { label: "Total users", icon: "group", value: o.users.total.toLocaleString(), chip: `+${o.users.newThisWeek} this week`, note: `${o.users.active30d} active in the past 30 days` },
    { label: "Workspaces", icon: "domain", value: o.workspaces.total.toLocaleString(), chip: `+${o.workspaces.newThisMonth} in 30 days`, note: `${o.workspaces.personal} personal · ${o.workspaces.company} company` },
    { label: "Storage used", icon: "database", value: formatBytes(o.storage.usedBytes), note: `of ${formatBytes(o.storage.quotaBytes, 0)} allocated` },
    {
      label: "Open abuse reports",
      icon: "shield",
      value: String(o.openReports),
      danger: o.openReports > 0,
      chip: o.openReports ? "Action needed" : undefined,
      note: o.openReports ? `${o.autoDisabled} link${o.autoDisabled === 1 ? "" : "s"} reported` : "Nothing waiting for review",
      href: "/platform/abuse",
    },
  ];

  return (
    <>
      <PageHeader crumb={<>Platform <Icon name="chevron_right" className="text-[16px]" /> Overview</>} title="Platform overview" subtitle="Everything across MacTidar Cloud: people, workspaces, storage and reports." />

      <div className="mb-space-lg grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <div className={`${card} h-full p-5 ${s.href ? "transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]" : ""}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">{s.label}</span>
                <Icon name={s.icon} className={`text-[22px] ${s.danger ? "text-danger" : "text-primary"}`} />
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`text-[30px] font-semibold leading-none ${s.danger ? "text-danger" : "text-text-primary"}`}>{s.value}</span>
                {s.chip && (
                  <span className={`rounded-full px-2 py-0.5 font-label-md text-label-md ${s.danger ? "bg-error-container text-danger" : "bg-tertiary-fixed/50 text-on-tertiary-fixed-variant"}`}>{s.chip}</span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-text-secondary">{s.note}</p>
            </div>
          );
          return s.href ? <Link key={s.label} href={s.href}>{body}</Link> : <div key={s.label}>{body}</div>;
        })}
      </div>

      <div className="mb-space-lg grid grid-cols-1 gap-space-md xl:grid-cols-3">
        <section className={`${card} p-5 xl:col-span-2`}>
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Sign-ups per day</h2>
          <p className="mb-5 font-body-sm text-body-sm text-text-secondary">New accounts over the past 30 days</p>
          <div className="flex h-48 items-end gap-[3px]">
            {o.signups.map((s) => (
              <div key={s.day} className="group relative flex h-full flex-1 items-end">
                <div className={`w-full rounded-t ${s.count ? "bg-primary-container" : "bg-surface-container-high"}`} style={{ height: s.count ? `${Math.max(6, (s.count / peak) * 100)}%` : "3px" }} />
                <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-inverse-surface px-2 py-1 font-label-sm text-label-sm text-white group-hover:block">
                  {s.count} · {new Date(s.day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-label-sm text-label-sm text-text-secondary">
            <span>{new Date(o.signups[0].day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
        </section>

        <section className={`${card} p-5`}>
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Storage by workspace type</h2>
          <p className="mb-5 font-body-sm text-body-sm text-text-secondary">{formatBytes(o.storage.usedBytes)} stored in total</p>
          <div className="mb-5 h-3 overflow-hidden rounded-full bg-[#f3e8ff]">
            <div className="h-full bg-primary-container" style={{ width: `${storagePct}%` }} />
          </div>
          {[
            { label: "Company workspaces", color: "bg-primary-container", bytes: o.storage.companyBytes, count: o.workspaces.company },
            { label: "Personal workspaces", color: "bg-file-image", bytes: o.storage.personalBytes, count: o.workspaces.personal },
          ].map((r) => (
            <div key={r.label} className="mb-2 rounded-xl bg-surface-container-low p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-title-md text-title-md text-text-primary">
                  <span className={`h-2.5 w-2.5 rounded-sm ${r.color}`} /> {r.label}
                </span>
                <span className="font-title-md text-title-md">{formatBytes(r.bytes)}</span>
              </div>
              <p className="mt-0.5 font-body-sm text-body-sm text-text-secondary">
                {r.count} workspace{r.count === 1 ? "" : "s"} · avg {formatBytes(r.count ? r.bytes / r.count : 0)}
              </p>
            </div>
          ))}
        </section>
      </div>

      <section className={card}>
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-text-primary">Largest workspaces</h2>
            <p className="font-body-sm text-body-sm text-text-secondary">By storage used</p>
          </div>
          <Link href="/platform/workspaces" className="flex items-center gap-1 font-title-md text-title-md text-primary hover:underline">
            View all {o.workspaces.total} <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
        <ul>
          {o.topWorkspaces.map((w) => {
            const pct = w.quotaBytes ? Math.min(100, (w.usedBytes / w.quotaBytes) * 100) : 0;
            return (
              <li key={w.id} className="border-t border-border">
                <Link href={`/platform/workspaces/${w.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-surface-container-low/60">
                  <WsBadge name={w.name} type={w.type} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-title-md text-title-md text-text-primary">{w.name}</span>
                    <span className="block font-body-sm text-body-sm text-text-secondary">{w.id}</span>
                  </span>
                  <TypePill type={w.type} />
                  <span className="w-full sm:w-48">
                    <span className="mb-1 flex justify-between font-label-md text-label-md text-text-secondary">
                      <span>{formatBytes(w.usedBytes)}</span>
                      <span>{formatBytes(w.quotaBytes, 0)}</span>
                    </span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                      <span className={`block h-full rounded-full ${pct >= 90 ? "bg-danger" : pct >= 75 ? "bg-warning" : "bg-primary-container"}`} style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
