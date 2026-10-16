import Link from "next/link";
import { Icon } from "@/components/Icon";
import { MarketingFooter, MarketingHeader } from "./chrome";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

// Shared layout for Terms of Service and Privacy Policy
// (designs/terms_of_service_mactidar_cloud).
export function LegalPage({
  title,
  updated,
  pledge,
  sections,
  other,
}: {
  title: string;
  updated: string;
  pledge: string;
  sections: LegalSection[];
  other: { href: string; label: string };
}) {
  return (
    <div className="min-h-screen scroll-smooth bg-canvas font-body-md text-body-md text-on-surface">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-28 lg:px-12">
        <nav className="mb-2 flex items-center gap-2 font-body-sm text-body-sm text-text-secondary">
          <span>Legal &amp; policies</span>
          <Icon name="chevron_right" className="text-[16px]" />
          <span className="text-text-primary">{title}</span>
        </nav>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-bold tracking-tight text-text-primary">{title}</h1>
            <p className="mt-1 flex items-center gap-1.5 font-body-md text-body-md text-text-secondary">
              <Icon name="schedule" className="text-[16px]" /> Last updated: {updated}
            </p>
          </div>
          <a href="mailto:admin@mactidar.com" className="flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 font-title-md text-title-md shadow-sm hover:bg-surface-container-low">
            <Icon name="help" className="text-[18px]" /> Questions?
          </a>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-surface p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">Contents</span>
                <span className="font-label-md text-label-md text-primary">{sections.length} sections</span>
              </div>
              <ol className="space-y-0.5">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="block rounded-lg px-3 py-2 font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-text-primary">
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
            <Link href={other.href} className="mt-4 flex items-center justify-between rounded-2xl bg-surface p-5 font-title-md text-title-md text-primary shadow-sm hover:bg-primary-soft">
              {other.label} <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </aside>
          <div className="min-w-0 space-y-6">
            <div className="flex gap-4 rounded-2xl bg-primary-soft p-6 shadow-[inset_0_0_0_1px_#dbeafe]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-white">
                <Icon name="verified_user" className="text-[22px]" />
              </span>
              <div>
                <p className="font-title-md text-[16px] text-primary">Our plain-language pledge</p>
                <p className="mt-1 font-body-md text-[15px] leading-6 text-on-surface-variant">{pledge}</p>
              </div>
            </div>
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl bg-surface p-7 shadow-sm sm:p-9">
                <h2 className="mb-4 font-headline-sm text-[20px] text-text-primary">
                  <span className="text-primary">{String(i + 1).padStart(2, "0")}.</span> {s.title}
                </h2>
                <div className="space-y-3 font-body-md text-[15px] leading-7 text-on-surface-variant [&_a]:font-medium [&_a]:text-primary [&_a:hover]:underline [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-text-primary">
                  {s.body}
                </div>
              </section>
            ))}
            <div className="flex justify-end">
              <a href="#" className="flex items-center gap-1 font-body-md text-body-md text-text-secondary hover:text-text-primary">
                Back to top <Icon name="arrow_upward" className="text-[16px]" />
              </a>
            </div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
