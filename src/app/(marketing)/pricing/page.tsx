import Link from "next/link";
import { Icon } from "@/components/Icon";
import { MarketingFooter, MarketingHeader } from "../chrome";

export const metadata = { title: "Pricing · MacTidar Cloud" };

const FREE = [
  ["cloud", "3 GB", "of encrypted storage in your personal workspace"],
  ["domain", "Company workspaces", "create or join as many as you need"],
  ["link", "Secure public links", "passwords, expiry dates and download control"],
  ["upload_file", "Up to 5 GB", "per file, with drag-and-drop uploads"],
  ["visibility", "Instant previews", "images, video, audio, PDF and text"],
  ["folder_zip", ".zip downloads", "for whole folders, plus 30-day trash recovery"],
] as const;

const TEAM = ["More storage for your whole company", "Admin controls for storage and outside sharing", "Priority support"];

const ROWS: { group: string; rows: [string, string | boolean, string | boolean][] }[] = [
  {
    group: "Storage & uploads",
    rows: [
      ["Personal workspace storage", "3 GB", "—"],
      ["Company workspace storage", "3 GB per workspace", "More, per plan"],
      ["Largest single upload", "5 GB", "5 GB+"],
      ["Trash recovery", "30 days", "30 days"],
    ],
  },
  {
    group: "Workspaces & sharing",
    rows: [
      ["Personal workspace", true, true],
      ["Create & join company workspaces", true, true],
      ["Admin and member roles", true, true],
      ["Viewer / editor sharing with teammates", true, true],
      ["Public links with password & expiry", true, true],
      ["Control sharing outside the company", true, true],
    ],
  },
  {
    group: "Support",
    rows: [
      ["Email support", true, true],
      ["Priority support", false, true],
    ],
  },
];

const cell = (v: string | boolean) =>
  typeof v === "boolean" ? (
    v ? (
      <Icon name="check_circle" fill className="text-[20px] text-tertiary" />
    ) : (
      <span className="text-outline-variant">—</span>
    )
  ) : (
    <span className="font-title-md text-title-md text-text-primary">{v}</span>
  );

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-canvas font-body-md text-body-md text-on-surface">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32 lg:px-12">
        <div className="mb-14 text-center">
          <span className="font-label-md text-label-md font-semibold uppercase tracking-wider text-primary">Simple, honest pricing</span>
          <h1 className="mt-2 text-[44px] font-bold tracking-tight text-text-primary">Start free. Grow when you&apos;re ready.</h1>
          <p className="mx-auto mt-3 max-w-xl font-body-md text-[17px] leading-7 text-text-secondary">
            Everything you need to store and share files is free today. Paid team plans with more storage are on the way.
          </p>
        </div>

        <div className="mx-auto mb-20 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          <div className="relative flex flex-col rounded-3xl bg-surface p-8 shadow-[0_10px_30px_rgba(37,99,235,0.12),inset_0_0_0_2px_#2563eb] sm:p-10">
            <span className="absolute -top-3 left-8 rounded-full bg-primary-container px-3 py-1 font-label-md text-label-md text-white">Available now</span>
            <p className="font-headline-sm text-[22px] text-text-primary">Free</p>
            <p className="mb-6 font-body-md text-body-md text-text-secondary">For individuals, freelancers and small teams</p>
            <p className="mb-1">
              <span className="text-[48px] font-bold leading-none text-text-primary">₦0</span>
              <span className="ml-1 text-text-secondary">/ month</span>
            </p>
            <p className="mb-8 font-body-sm text-body-sm text-text-secondary">No credit card required.</p>
            <ul className="mb-10 space-y-4">
              {FREE.map(([icon, title, desc]) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon name={icon} className="text-[18px]" />
                  </span>
                  <span className="font-body-md text-[15px] text-on-surface-variant">
                    <strong className="font-semibold text-text-primary">{title}</strong> {desc}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/sign-up" className="mt-auto flex h-12 items-center justify-center gap-2 rounded-full bg-primary-container font-title-md text-[15px] text-on-primary shadow-md hover:bg-primary">
              Get started free <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>

          <div className="flex flex-col rounded-3xl bg-surface p-8 shadow-sm sm:p-10">
            <div className="flex items-center justify-between">
              <p className="font-headline-sm text-[22px] text-text-primary">Team</p>
              <span className="rounded-full bg-surface-container-high px-3 py-1 font-label-md text-label-md text-on-surface-variant">Coming soon</span>
            </div>
            <p className="mb-6 font-body-md text-body-md text-text-secondary">For growing companies and agencies</p>
            <p className="mb-1 text-[48px] font-bold leading-none text-outline-variant">—</p>
            <p className="mb-8 font-body-sm text-body-sm text-text-secondary">Pricing will be announced before launch.</p>
            <ul className="mb-10 space-y-4">
              {TEAM.map((t) => (
                <li key={t} className="flex items-center gap-3 font-body-md text-[15px] text-on-surface-variant">
                  <Icon name="check" className="text-[20px] text-outline" /> {t}
                </li>
              ))}
            </ul>
            <a
              href="mailto:admin@mactidar.com?subject=Notify%20me%20about%20MacTidar%20Cloud%20Team%20plans"
              className="mt-auto flex h-12 items-center justify-center gap-2 rounded-full bg-surface font-title-md text-[15px] text-text-primary shadow-[inset_0_0_0_1px_#c3c6d7] hover:bg-surface-container-low"
            >
              <Icon name="notifications" className="text-[18px]" /> Notify me
            </a>
          </div>
        </div>

        <h2 className="mb-2 text-center text-[28px] font-bold text-text-primary">Compare plans</h2>
        <p className="mb-8 text-center font-body-md text-[15px] text-text-secondary">What&apos;s included today, and what Team plans will add.</p>
        <div className="mx-auto mb-20 max-w-4xl overflow-x-auto rounded-2xl bg-surface shadow-sm">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-5 font-label-md text-label-md uppercase tracking-wider text-text-secondary">Features</th>
                <th className="px-6 py-5 text-center font-title-md text-[15px] text-primary">Free</th>
                <th className="px-6 py-5 text-center font-title-md text-[15px] text-text-secondary">Team · soon</th>
              </tr>
            </thead>
            {ROWS.map((g) => (
              <tbody key={g.group}>
                <tr className="bg-surface-container-low/60">
                  <td colSpan={3} className="px-6 py-2.5 font-label-md text-label-md uppercase tracking-wider text-text-secondary">
                    {g.group}
                  </td>
                </tr>
                {g.rows.map(([label, free, team]) => (
                  <tr key={label} className="border-t border-border">
                    <td className="px-6 py-3.5 font-body-md text-[15px] text-on-surface-variant">{label}</td>
                    <td className="px-6 py-3.5 text-center">{cell(free)}</td>
                    <td className="px-6 py-3.5 text-center">{cell(team)}</td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
          {[
            ["When will Team plans launch?", "We're building them now. Free accounts will keep everything they have today."],
            ["What happens if I reach 3 GB?", "Your files stay available to view, download and share. New uploads pause until you free up space."],
            ["Do I need a card to sign up?", "No. Create your account with an email address and a password — that's it."],
          ].map(([q, a]) => (
            <div key={q} className="rounded-2xl bg-surface p-6 shadow-sm">
              <p className="mb-2 font-title-md text-[15px] text-text-primary">{q}</p>
              <p className="font-body-md text-body-md leading-6 text-text-secondary">{a}</p>
            </div>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
