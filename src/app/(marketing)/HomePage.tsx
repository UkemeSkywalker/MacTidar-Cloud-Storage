import Link from "next/link";
// Public homepage, converted from designs/homepage_with_visible_footer_mactidar_cloud.
/* eslint-disable @next/next/no-img-element */
import { MarketingFooter, MarketingHeader } from "./chrome";
export function HomePage() {
  return (
    <div className="min-h-screen scroll-smooth bg-canvas font-body-md text-body-md text-on-surface">
<MarketingHeader /><main className="w-full pt-16 bg-canvas"><div className="flex flex-col w-full">
{/* SECTION 2: HERO */}
<section className="relative bg-surface overflow-hidden py-24 lg:py-28">
<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
<div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
{/* Left: Value Prop */}
<div className="lg:col-span-6 flex flex-col items-start gap-6">
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low text-primary font-label-md text-label-md shadow-sm">
<span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
<span className="">Free 3 GB · No credit card required</span>
</div>
<h1 className="font-headline-lg text-4xl lg:text-[56px] lg:leading-[1.1] font-bold text-text-primary tracking-tight">
            Your work, safely in one place.
          </h1>
<p className="font-body-md text-lg lg:text-[20px] text-text-secondary leading-relaxed max-w-lg">
            Store, preview and share your files with your team — or anyone — on your terms.
          </p>
<div className="flex flex-wrap items-center gap-4 pt-2">
<Link className="inline-flex items-center gap-2 bg-primary-container text-on-primary font-title-md text-title-md px-8 py-4 rounded-full shadow-lg shadow-primary-container/20 hover:opacity-95 transition-all transform hover:-translate-y-0.5" data-path="get-started" href="/sign-up">
<span className="">Get started free</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</Link>
<a className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary font-title-md text-title-md px-4 py-3 transition-colors" href="#who-its-for">
<span className="">See how it works</span>
<span className="material-symbols-outlined text-[18px]">arrow_downward</span>
</a>
</div>
{/* Social Proof Avatars */}
<div className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4">
<div className="flex items-center -space-x-2.5">
<img loading="lazy" decoding="async" alt="Team member" className="w-10 h-10 rounded-full object-cover shadow-sm bg-surface ring-2 ring-surface" src="/images/home/ada-portrait.jpg" />
<img loading="lazy" decoding="async" alt="Designer" className="w-10 h-10 rounded-full object-cover shadow-sm bg-surface ring-2 ring-surface" src="/images/home/designer-headphones.jpg" />
<img loading="lazy" decoding="async" alt="Creative" className="w-10 h-10 rounded-full object-cover shadow-sm bg-surface ring-2 ring-surface" src="/images/home/creative-lagos.jpg" />
<img loading="lazy" decoding="async" alt="Photographer" className="w-10 h-10 rounded-full object-cover shadow-sm bg-surface ring-2 ring-surface" src="/images/home/photographer-accra.jpg" />

</div>
<p className="font-body-sm text-body-sm text-text-secondary">
              Made for freelancers, creatives and growing teams across Africa
            </p>
</div>
</div>
{/* Right: Editorial Image + Floating UI Cards */}
<div className="lg:col-span-6 relative flex justify-center">
<div className="relative w-full max-w-lg lg:max-w-none">
<img loading="lazy" decoding="async" alt="Diverse creative team collaborating in a bright modern studio" className="w-full h-[460px] lg:h-[540px] object-cover rounded-[32px] shadow-xl" src="/images/home/hero-team-studio.jpg" />
{/* Card A: Upload Notification (Top-Right) */}
<div className="absolute -top-4 -right-3 sm:right-4 bg-surface rounded-2xl p-4 shadow-xl max-w-xs flex flex-col gap-2 animate-bounce-subtle">
<div className="flex items-center justify-between gap-3">
<div className="flex items-center gap-2.5">
<span className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
<span className="material-symbols-outlined text-[18px]">folder_zip</span>
</span>
<div>
<p className="font-title-md text-title-md text-text-primary leading-tight">Brand Kit 2026.zip</p>
<p className="font-label-sm text-label-sm text-file-sheet font-medium">Uploaded ✓</p>
</div>
</div>
<span className="font-label-sm text-label-sm text-text-secondary">42 MB</span>
</div>
<div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
<div className="bg-file-sheet h-full rounded-full w-full"></div>
</div>
</div>
{/* Card B: Shared Card (Left Mid) */}
<div className="absolute top-1/2 -translate-y-1/2 -left-4 sm:-left-6 bg-surface rounded-2xl p-3.5 shadow-xl flex items-center gap-3">
<div className="flex -space-x-2">
<img loading="lazy" decoding="async" alt="Ada" className="w-7 h-7 rounded-full object-cover ring-2 ring-surface" src="/images/home/ada-portrait.jpg" />
<div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-[10px] ring-2 ring-surface">TB</div>
</div>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-text-primary font-medium">Shared with Ada &amp; Tunde</span>
<span className="font-label-sm text-label-sm text-primary font-medium">Editor access</span>
</div>
<span className="material-symbols-outlined text-outline-variant text-[18px] ml-1">check_circle</span>
</div>
{/* Card C: Link Security Card (Bottom Right) */}
<div className="absolute -bottom-5 right-2 sm:right-6 bg-surface rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
<span className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
<span className="material-symbols-outlined text-[18px]">lock</span>
</span>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-text-primary">Expires in 7 days</span>
<span className="font-label-sm text-label-sm text-text-secondary flex items-center gap-1">
<span className="">🔒 Password protected</span>
</span>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/* SECTION 3: WHO IT'S FOR STRIP */}
<section className="bg-canvas py-28 lg:py-32" id="who-its-for">
<div className="max-w-7xl mx-auto px-6 lg:px-12">
<div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
<span className="font-label-md text-label-md text-primary uppercase tracking-wider mb-2 font-semibold">Audiences</span>
<h2 className="font-headline-lg text-3xl lg:text-4xl text-text-primary mb-3">Built around the way you work</h2>
<p className="font-body-md text-body-md text-text-secondary text-base">Tailored for individuals and organizations collaborating across the continent.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
{/* Card 1 */}
<div className="rounded-2xl bg-surface overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
<div className="h-64 overflow-hidden relative">
<img loading="lazy" decoding="async" alt="Photographer reviewing shots in Accra studio" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="/images/home/photographer-accra.jpg" />
<div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-surface/90 backdrop-blur-sm text-text-primary font-label-sm text-label-sm">
              Creatives
            </div>
</div>
<div className="p-8 flex flex-col flex-1 justify-between gap-6">
<div className="flex flex-col gap-2">
<h3 className="font-headline-sm text-headline-sm text-text-primary">Freelancers &amp; creatives</h3>
<p className="font-body-md text-body-md text-text-secondary leading-relaxed">Send clients beautiful, password-protected links with custom expiry dates.</p>
</div>
<Link className="inline-flex items-center gap-1.5 font-title-md text-title-md text-primary hover:text-primary-container transition-colors" href="/sign-up">
<span className="">Explore creator tools</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>
</div>
{/* Card 2 */}
<div className="rounded-2xl bg-surface overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
<div className="h-64 overflow-hidden relative">
<img loading="lazy" decoding="async" alt="Two business partners in Nairobi cafe" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="/images/home/nairobi-cafe.jpg" />
<div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-surface/90 backdrop-blur-sm text-text-primary font-label-sm text-label-sm">
              Small Business
            </div>
</div>
<div className="p-8 flex flex-col flex-1 justify-between gap-6">
<div className="flex flex-col gap-2">
<h3 className="font-headline-sm text-headline-sm text-text-primary">Small businesses</h3>
<p className="font-body-md text-body-md text-text-secondary leading-relaxed">Keep invoices, contracts and brand photos organized in shared vaults.</p>
</div>
<Link className="inline-flex items-center gap-1.5 font-title-md text-title-md text-primary hover:text-primary-container transition-colors" href="/sign-up">
<span className="">Explore business storage</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>
</div>
{/* Card 3 */}
<div className="rounded-2xl bg-surface overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
<div className="h-64 overflow-hidden relative">
<img loading="lazy" decoding="async" alt="Team collaborating around office conference table" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="/images/home/team-conference.jpg" />
<div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-surface/90 backdrop-blur-sm text-text-primary font-label-sm text-label-sm">
              Agencies
            </div>
</div>
<div className="p-8 flex flex-col flex-1 justify-between gap-6">
<div className="flex flex-col gap-2">
<h3 className="font-headline-sm text-headline-sm text-text-primary">Teams &amp; agencies</h3>
<p className="font-body-md text-body-md text-text-secondary leading-relaxed">One shared space with the right access roles and permissions for everyone.</p>
</div>
<Link className="inline-flex items-center gap-1.5 font-title-md text-title-md text-primary hover:text-primary-container transition-colors" href="/sign-up">
<span className="">Explore agency workspaces</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>
</div>
</div>
</div>
</section>
{/* SECTION 4: FEATURE STORY (ZIG-ZAG) */}
<section id="features" className="scroll-mt-20 bg-surface py-28 lg:py-32">
<div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-32">
{/* Row A */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
<div className="lg:col-span-6 relative">
<img loading="lazy" decoding="async" alt="Professional smiling while working at modern desk" className="w-full h-[420px] object-cover rounded-3xl shadow-lg" src="/images/home/desk-professional.jpg" />
{/* Overlapping Folder Card */}
<div className="absolute -bottom-6 -right-4 sm:right-6 bg-surface p-5 rounded-2xl shadow-xl max-w-xs w-full">
<div className="flex items-center justify-between pb-3 mb-3 bg-surface-container-low px-3 py-2 rounded-lg">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-file-folder text-[20px]">folder</span>
<span className="font-title-md text-title-md text-text-primary">My Files</span>
</div>
<span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full">3 Folders</span>
</div>
<div className="flex flex-col gap-2">
<div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-surface-container-low transition-colors">
<span className="font-body-sm text-body-sm text-text-primary flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-file-folder">folder</span> Designs
                </span>
<span className="font-label-sm text-label-sm text-text-secondary">1.2 GB</span>
</div>
<div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-surface-container-low transition-colors">
<span className="font-body-sm text-body-sm text-text-primary flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-file-sheet">folder</span> Invoices 2026
                </span>
<span className="font-label-sm text-label-sm text-text-secondary">420 MB</span>
</div>
<div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-primary-fixed/30">
<span className="font-body-sm text-body-sm text-primary font-medium flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-primary">folder</span> Contracts
                </span>
<span className="font-label-sm text-label-sm text-primary">Drop here</span>
</div>
</div>
</div>
</div>
<div className="lg:col-span-6 flex flex-col gap-6">
<span className="font-label-md text-label-md text-primary uppercase font-semibold">Centralized Library</span>
<h2 className="font-headline-lg text-3xl lg:text-4xl text-text-primary">Everything in one place</h2>
<p className="font-body-md text-body-md text-text-secondary text-base leading-relaxed">
            Keep assets structured and accessible. From high-resolution media to confidential contracts, organize your workflow effortlessly.
          </p>
<ul className="flex flex-col gap-3.5">
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Drag and drop any file up to 5 GB</span>
</li>
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Folders that stay tidy and easy to navigate</span>
</li>
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Preview photos, videos and PDFs instantly</span>
</li>
</ul>
<div className="pt-2">
<Link className="inline-flex items-center gap-1.5 font-title-md text-title-md text-primary hover:text-primary-container transition-colors" href="/sign-up">
<span className="">Explore your files</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>
</div>
</div>
{/* Row B (Alternating) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
<div className="lg:col-span-6 order-2 lg:order-1 flex flex-col gap-6">
<span className="font-label-md text-label-md text-primary uppercase font-semibold">Collaboration Controls</span>
<h2 className="font-headline-lg text-3xl lg:text-4xl text-text-primary">Share with your team, your way</h2>
<p className="font-body-md text-body-md text-text-secondary text-base leading-relaxed">
            Collaborate without ambiguity. Give clients and teammates exactly the right permission level and withdraw access at any moment.
          </p>
<ul className="flex flex-col gap-3.5">
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Viewer or Editor access in one click</span>
</li>
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Share a folder, everything inside follows</span>
</li>
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Remove access any time with instant revocation</span>
</li>
</ul>
<div className="pt-2">
<Link className="inline-flex items-center gap-1.5 font-title-md text-title-md text-primary hover:text-primary-container transition-colors" href="/sign-up">
<span className="">How sharing works</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>
</div>
<div className="lg:col-span-6 order-1 lg:order-2 relative">
<img loading="lazy" decoding="async" alt="Two diverse African colleagues leaning in together to collaborate and smiling at a shared laptop screen in a bright modern workspace" className="w-full h-[420px] object-cover rounded-3xl shadow-lg" src="/images/home/colleagues-collab.jpg" />
{/* Overlapping Share Dialog UI Card */}
<div className="absolute -bottom-6 -left-4 sm:left-6 bg-surface p-5 rounded-2xl shadow-xl max-w-sm w-full">
<div className="flex items-center justify-between pb-3 mb-3 bg-surface-container-low px-3 py-2 rounded-lg">
<span className="font-title-md text-title-md text-text-primary">Share &quot;Client Deliverables&quot;</span>
<span className="material-symbols-outlined text-text-secondary text-[18px]">group</span>
</div>
<div className="flex flex-col gap-2.5">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<img loading="lazy" decoding="async" alt="Ada" className="w-8 h-8 rounded-full object-cover" src="/images/home/ada-portrait.jpg" />
<div>
<p className="font-title-md text-title-md text-text-primary">Ada Okon</p>
<p className="font-label-sm text-label-sm text-text-secondary">ada@studio.ng</p>
</div>
</div>
<span className="px-2.5 py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-medium">Editor</span>
</div>
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-label-md text-label-md font-semibold">TB</div>
<div>
<p className="font-title-md text-title-md text-text-primary">Tunde Bello</p>
<p className="font-label-sm text-label-sm text-text-secondary">tunde@partner.io</p>
</div>
</div>
<span className="px-2.5 py-1 rounded-full bg-surface-container-high text-text-secondary font-label-sm text-label-sm font-medium">Viewer</span>
</div>
</div>
</div>
</div>
</div>
{/* Row C */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
<div className="lg:col-span-6 relative">
<img loading="lazy" decoding="async" alt="Creative professional managing digital files in Lagos" className="w-full h-[420px] object-cover rounded-3xl shadow-lg" src="/images/home/creative-lagos.jpg" />
{/* Overlapping Public Link Card */}
<div className="absolute -bottom-6 -right-4 sm:right-6 bg-surface p-5 rounded-2xl shadow-xl max-w-sm w-full flex flex-col gap-3">
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-text-primary">Public link settings</span>
<span className="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-full font-medium">Active</span>
</div>
<div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
<span className="font-label-sm text-label-sm text-text-secondary">cloud.mactidar.com/s/9x21…</span>
<button className="text-primary font-title-md text-label-md">Copy</button>
</div>
<div className="flex items-center justify-between pt-1">
<div className="flex items-center gap-1.5 text-text-secondary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
<span className="">Password set</span>
</div>
<span className="px-2.5 py-1 rounded-full bg-warning/15 text-warning font-label-sm text-label-sm font-semibold">Expires 30 Oct</span>
</div>
</div>
</div>
<div className="lg:col-span-6 flex flex-col gap-6">
<span className="font-label-md text-label-md text-primary uppercase font-semibold">Public Sharing</span>
<h2 className="font-headline-lg text-3xl lg:text-4xl text-text-primary">Send to anyone, safely</h2>
<p className="font-body-md text-body-md text-text-secondary text-base leading-relaxed">
            Distribute assets to external stakeholders without opening up your entire workspace. Control access lifecycle effortlessly.
          </p>
<ul className="flex flex-col gap-3.5">
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Password-protect any link</span>
</li>
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Set links to expire on custom dates</span>
</li>
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Turn downloads on or off per link</span>
</li>
</ul>
<div className="pt-2">
<Link className="inline-flex items-center gap-1.5 font-title-md text-title-md text-primary hover:text-primary-container transition-colors" href="/sign-up">
<span className="">About secure links</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>
</div>
</div>
</div>
</section>
{/* SECTION 5: CTA BANNER 1 (FULL-WIDTH IMAGE BANNER) */}
<section className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
<div className="relative rounded-3xl overflow-hidden min-h-[380px] flex items-center shadow-lg">
<img loading="lazy" decoding="async" alt="Team celebrating together" className="absolute inset-0 w-full h-full object-cover" src="/images/home/team-celebrating.jpg" />
<div className="absolute inset-0 bg-gradient-to-r from-[#0B1B3F] via-[#0B1B3F]/90 to-transparent"></div>
<div className="relative z-10 p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center">
<div className="lg:col-span-7 flex flex-col items-start gap-4 text-on-primary">
<span className="px-3 py-1 rounded-full bg-surface/15 backdrop-blur-md text-on-primary font-label-md text-label-md">
            Free forever tier
          </span>
<h2 className="font-headline-lg text-3xl sm:text-4xl text-on-primary font-bold">
            Start with 3 GB free. Upgrade never required.
          </h2>
<p className="font-body-md text-body-md text-on-primary/80 max-w-lg">
            Set up in under a minute — no credit card needed. Your files are encrypted and stored in Africa.
          </p>
<div className="pt-2">
<Link className="inline-flex items-center gap-2 bg-surface text-primary font-title-md text-title-md px-8 py-3.5 rounded-full shadow-md hover:bg-surface-container-low transition-colors" data-path="get-started" href="/sign-up">
<span className="">Get started free</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</Link>
</div>
</div>
<div className="lg:col-span-5 flex flex-col gap-3">
<div className="p-4 rounded-xl bg-surface/10 backdrop-blur-md text-on-primary flex items-center gap-3 shadow-sm">
<span className="material-symbols-outlined text-tertiary-fixed text-[24px]">cloud_done</span>
<div>
<p className="font-title-md text-title-md text-on-primary leading-tight">Free 3 GB storage</p>
<p className="font-label-sm text-label-sm text-on-primary/70">Forever personal allowance</p>
</div>
</div>
<div className="p-4 rounded-xl bg-surface/10 backdrop-blur-md text-on-primary flex items-center gap-3 shadow-sm">
<span className="material-symbols-outlined text-primary-fixed text-[24px]">dns</span>
<div>
<p className="font-title-md text-title-md text-on-primary leading-tight">Data stored in Africa</p>
<p className="font-label-sm text-label-sm text-on-primary/70">AWS Cape Town facility</p>
</div>
</div>
<div className="p-4 rounded-xl bg-surface/10 backdrop-blur-md text-on-primary flex items-center gap-3 shadow-sm">
<span className="material-symbols-outlined text-tertiary-fixed-dim text-[24px]">verified_user</span>
<div>
<p className="font-title-md text-title-md text-on-primary leading-tight">Encrypted with AES-256 at rest</p>
<p className="font-label-sm text-label-sm text-on-primary/70">Industry standard transit via HTTPS</p>
</div>
</div>
</div>
</div>
</div>
</section>
{/* SECTION 6: "AND THERE'S MORE" COMPACT FEATURE GRID */}
<section className="bg-canvas py-28 lg:py-32">
<div className="max-w-7xl mx-auto px-6 lg:px-12">
<div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
<span className="font-label-md text-label-md text-primary uppercase tracking-wider mb-2 font-semibold">Refined Workflow</span>
<h2 className="font-headline-lg text-3xl lg:text-4xl text-text-primary mb-3">Small details that save you time</h2>
<p className="font-body-md text-body-md text-text-secondary text-base">Carefully engineered interactions designed to keep focus where it belongs.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{/* Tile 1 */}
<div className="bg-surface rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
<div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">archive</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-text-primary mb-1">Download folders as .zip</h3>
<p className="font-body-md text-body-md text-text-secondary">One-click packaging for fast delivery to clients or colleagues.</p>
</div>
</div>
{/* Tile 2 */}
<div className="bg-surface rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
<div className="w-10 h-10 rounded-full bg-file-folder/15 flex items-center justify-center text-file-folder">
<span className="material-symbols-outlined text-[20px]">search</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-text-primary mb-1">Find any file in seconds</h3>
<p className="font-body-md text-body-md text-text-secondary">Search every file and folder name you can access.</p>
</div>
</div>
{/* Tile 3 */}
<div className="bg-surface rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
<div className="w-10 h-10 rounded-full bg-warning/15 flex items-center justify-center text-warning">
<span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-text-primary mb-1">Star what matters</h3>
<p className="font-body-md text-body-md text-text-secondary">Quick access to priority documents, proposals and media deliverables.</p>
</div>
</div>
{/* Tile 4 */}
<div className="bg-surface rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
<div className="w-10 h-10 rounded-full bg-file-image/15 flex items-center justify-center text-file-image">
<span className="material-symbols-outlined text-[20px]">history</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-text-primary mb-1">Recent files, one click away</h3>
<p className="font-body-md text-body-md text-text-secondary">Resume work right where you stopped without drilling down directories.</p>
</div>
</div>
{/* Tile 5 */}
<div className="bg-surface rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
<div className="w-10 h-10 rounded-full bg-file-sheet/15 flex items-center justify-center text-file-sheet">
<span className="material-symbols-outlined text-[20px]">restore_from_trash</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-text-primary mb-1">Undo deletes for 30 days</h3>
<p className="font-body-md text-body-md text-text-secondary">Restore misplaced files safely from trash before permanent removal.</p>
</div>
</div>
{/* Tile 6 */}
<div className="bg-surface rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
<div className="w-10 h-10 rounded-full bg-file-doc/15 flex items-center justify-center text-file-doc">
<span className="material-symbols-outlined text-[20px]">domain</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-text-primary mb-1">Switch personal &amp; company</h3>
<p className="font-body-md text-body-md text-text-secondary">Unified login with separate permissions for freelance and studio work.</p>
</div>
</div>
</div>
</div>
</section>
{/* SECTION 7: HOW IT WORKS */}
<section className="bg-surface py-28 lg:py-32">
<div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">
<div className="text-center max-w-2xl mb-20">
<span className="font-label-md text-label-md text-primary uppercase font-semibold">Onboarding</span>
<h2 className="font-headline-lg text-3xl lg:text-4xl text-text-primary mb-3 mt-1">Up and running in three steps</h2>
<p className="font-body-md text-body-md text-text-secondary text-base">Simple, lightweight cloud architecture built for direct productivity.</p>
</div>
<div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 relative">
{/* Connecting Line for desktop */}
<div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-surface-container -translate-y-12 z-0"></div>
{/* Step 1 */}
<div className="relative z-10 flex flex-col items-center text-center gap-5">
<div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm text-headline-sm shadow-md">
            1
          </div>
<div>
<h3 className="font-headline-sm text-headline-sm text-text-primary mb-1">Create your free account</h3>
<p className="font-body-md text-body-md text-text-secondary max-w-xs">Enter your email and set a password. No credit card required.</p>
</div>
{/* Miniature UI Thumbnail */}
<div className="w-full bg-surface-container-low p-4 rounded-2xl shadow-sm text-left flex flex-col gap-2.5">
<div className="h-2 w-16 bg-surface-container-highest rounded"></div>
<div className="h-8 bg-surface rounded-lg shadow-inner flex items-center px-3 text-text-secondary font-label-sm text-label-sm">
              ada@domain.ng
            </div>
<div className="h-8 bg-primary-container text-on-primary rounded-full flex items-center justify-center font-label-sm text-label-sm">
              Create Account
            </div>
</div>
</div>
{/* Step 2 */}
<div className="relative z-10 flex flex-col items-center text-center gap-5">
<div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm text-headline-sm shadow-md">
            2
          </div>
<div>
<h3 className="font-headline-sm text-headline-sm text-text-primary mb-1">Add your files</h3>
<p className="font-body-md text-body-md text-text-secondary max-w-xs">Drag and drop images, PDFs, archives, or videos up to 5 GB each.</p>
</div>
{/* Miniature UI Thumbnail */}
<div className="w-full bg-surface-container-low p-4 rounded-2xl shadow-sm text-left flex flex-col items-center justify-center gap-2 py-6">
<span className="material-symbols-outlined text-primary text-[28px]">cloud_upload</span>
<span className="font-label-sm text-label-sm text-text-primary font-medium">Drop files to upload</span>
<span className="font-label-sm text-[10px] text-text-secondary">Up to 5 GB per file</span>
</div>
</div>
{/* Step 3 */}
<div className="relative z-10 flex flex-col items-center text-center gap-5">
<div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm text-headline-sm shadow-md">
            3
          </div>
<div>
<h3 className="font-headline-sm text-headline-sm text-text-primary mb-1">Share or send a link</h3>
<p className="font-body-md text-body-md text-text-secondary max-w-xs">Invite colleagues as Viewers/Editors or share a password-protected link.</p>
</div>
{/* Miniature UI Thumbnail */}
<div className="w-full bg-surface-container-low p-4 rounded-2xl shadow-sm text-left flex flex-col gap-2">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-text-primary font-semibold">Share link ready</span>
<span className="material-symbols-outlined text-tertiary text-[16px]">lock</span>
</div>
<div className="flex items-center gap-2 bg-surface px-2.5 py-1.5 rounded-lg">
<span className="font-label-sm text-[11px] text-text-secondary truncate">mactidar.com/s/72a19</span>
<span className="font-label-sm text-[10px] bg-primary-fixed text-primary px-1.5 py-0.5 rounded">Copy</span>
</div>
</div>
</div>
</div>
<div className="mt-16">
<Link className="inline-flex items-center gap-2 bg-primary-container text-on-primary font-title-md text-title-md px-8 py-3.5 rounded-full shadow-lg shadow-primary-container/20 hover:opacity-95 transition-all" data-path="get-started" href="/sign-up">
<span className="">Get started free</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</Link>
</div>
</div>
</section>
{/* SECTION 8: FOR COMPANIES (SPLIT SECTION) */}
<section id="teams" className="scroll-mt-20 bg-canvas py-28 lg:py-32">
<div className="max-w-7xl mx-auto px-6 lg:px-12">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
{/* Left: Founder photo + floating members list */}
<div className="lg:col-span-6 relative">
<img loading="lazy" decoding="async" alt="African female founder leading team in modern glass boardroom" className="w-full h-[480px] object-cover rounded-3xl shadow-lg" src="/images/home/founder-boardroom.jpg" />
{/* Floating Workspace Members List Card */}
<div className="absolute -bottom-6 -right-4 sm:right-6 bg-surface p-5 rounded-2xl shadow-xl max-w-sm w-full flex flex-col gap-3">
<div className="flex items-center justify-between pb-2 bg-surface-container-low px-3 py-2 rounded-lg">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-[18px]">corporate_fare</span>
<span className="font-title-md text-title-md text-text-primary">Apex Studio Workspace</span>
</div>
<span className="font-label-sm text-label-sm text-text-secondary">2 / 5 members</span>
</div>
<div className="flex flex-col gap-2">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-semibold">U</div>
<div>
<p className="font-title-md text-title-md text-text-primary">Ukeme</p>
<p className="font-label-sm text-label-sm text-text-secondary">ukeme@apex.ng</p>
</div>
</div>
<span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary font-medium">Admin</span>
</div>
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<img loading="lazy" decoding="async" alt="Ada" className="w-7 h-7 rounded-full object-cover" src="/images/home/ada-portrait.jpg" />
<div>
<p className="font-title-md text-title-md text-text-primary">Ada Okon</p>
<p className="font-label-sm text-label-sm text-text-secondary">ada@apex.ng</p>
</div>
</div>
<span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container-high text-text-secondary font-medium">Member</span>
</div>
</div>
{/* Storage Meter */}
<div className="pt-2 bg-surface-container-lowest flex flex-col gap-1.5">
<div className="flex justify-between font-label-sm text-label-sm text-text-secondary">
<span className="">Team Storage</span>
<span className="font-medium text-text-primary">2.1 GB used</span>
</div>
<div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
<div className="bg-primary h-full rounded-full w-2/5"></div>
</div>
</div>
</div>
</div>
{/* Right: Text & Actions */}
<div className="lg:col-span-6 flex flex-col gap-6">
<span className="font-label-md text-label-md text-primary uppercase font-semibold">For teams</span>
<h2 className="font-headline-lg text-3xl lg:text-[40px] leading-tight text-text-primary font-bold">
            Bring your whole team
          </h2>
<p className="font-body-md text-body-md text-text-secondary text-base leading-relaxed">
            Eliminate file silos across departments. Centralize your team&apos;s collective output under institutional governance while maintaining strict privacy boundaries.
          </p>
<ul className="flex flex-col gap-3.5">
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Invite your team in seconds by email</span>
</li>
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Admins and members, clearly separated</span>
</li>
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">One storage pool for the entire company</span>
</li>
<li className="flex items-start gap-3 text-text-primary font-body-md text-body-md">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">check_circle</span>
<span className="">Outside sharing stays off until an admin allows it</span>
</li>
</ul>
<div className="flex flex-wrap items-center gap-4 pt-4">
<a className="inline-flex items-center gap-2 bg-primary-container text-on-primary font-title-md text-title-md px-8 py-3.5 rounded-full shadow-md hover:opacity-95 transition-all" data-path="for-teams" href="#teams">
<span className="">Create a company workspace</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</a>
<a className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary font-title-md text-title-md px-4 py-2 transition-colors" data-path="contact" href="mailto:admin@mactidar.com">
<span className="">Talk to us</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</a>
</div>
</div>
</div>
</div>
</section>
{/* SECTION 9: TESTIMONIALS */}
<section className="bg-surface py-28 lg:py-32">
<div className="max-w-7xl mx-auto px-6 lg:px-12">
<div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
<span className="font-label-md text-label-md text-primary uppercase font-semibold">User Stories</span>
<h2 className="font-headline-lg text-3xl lg:text-4xl text-text-primary mb-3">People who keep their work here</h2>
<p className="font-body-md text-body-md text-text-secondary text-base">Trusted by creators and studios managing client deliveries every day.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
{/* Testimonial 1 */}
<div className="bg-canvas rounded-2xl p-8 flex flex-col justify-between gap-6 shadow-sm">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-text-secondary font-label-sm text-label-sm">Sample testimonial</span>
<span className="material-symbols-outlined text-outline-variant text-[24px]">format_quote</span>
</div>
<p className="font-body-md text-body-md text-text-primary leading-relaxed italic">
              “I send every client delivery as a password link now. It looks professional and I sleep better.”
            </p>
</div>
<div className="flex items-center gap-3.5 pt-4">
<img loading="lazy" decoding="async" alt="Amaka O." className="w-11 h-11 rounded-full object-cover" src="/images/home/ada-portrait.jpg" />
<div>
<p className="font-title-md text-title-md text-text-primary">Amaka O.</p>
<p className="font-body-sm text-body-sm text-text-secondary">Photographer, Lagos</p>
</div>
</div>
</div>
{/* Testimonial 2 (Raised / Spotlighted) */}
<div className="bg-surface rounded-2xl p-8 flex flex-col justify-between gap-6 shadow-xl ring-2 ring-primary/20 transform md:-translate-y-2">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-semibold">Sample testimonial</span>
<span className="material-symbols-outlined text-primary text-[24px]">format_quote</span>
</div>
<p className="font-body-md text-body-md text-text-primary leading-relaxed italic">
              “Our whole studio finally works from one folder without worrying about sync conflicts or lost files.”
            </p>
</div>
<div className="flex items-center gap-3.5 pt-4">
<img loading="lazy" decoding="async" alt="Kwame A." className="w-11 h-11 rounded-full object-cover" src="/images/home/designer-headphones.jpg" />
<div>
<p className="font-title-md text-title-md text-text-primary">Kwame A.</p>
<p className="font-body-sm text-body-sm text-text-secondary">Creative Director, Accra</p>
</div>
</div>
</div>
{/* Testimonial 3 */}
<div className="bg-canvas rounded-2xl p-8 flex flex-col justify-between gap-6 shadow-sm">
<div className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-text-secondary font-label-sm text-label-sm">Sample testimonial</span>
<span className="material-symbols-outlined text-outline-variant text-[24px]">format_quote</span>
</div>
<p className="font-body-md text-body-md text-text-primary leading-relaxed italic">
              “Setting up the team took five minutes. Admin controls give us complete peace of mind.”
            </p>
</div>
<div className="flex items-center gap-3.5 pt-4">
<img loading="lazy" decoding="async" alt="Wanjiru M." className="w-11 h-11 rounded-full object-cover" src="/images/home/creative-lagos.jpg" />
<div>
<p className="font-title-md text-title-md text-text-primary">Wanjiru M.</p>
<p className="font-body-sm text-body-sm text-text-secondary">Operations Lead, Nairobi</p>
</div>
</div>
</div>
</div>
</div>
</section>
{/* SECTION 10: SECURITY & PRIVACY (DARK NAVY SECTION) */}
<section id="security" className="scroll-mt-20 bg-[#0B1B3F] text-on-primary py-28 lg:py-32 relative overflow-hidden">
<div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
{/* Left Column */}
<div className="lg:col-span-5 flex flex-col gap-6">
<span className="px-3 py-1 rounded-full bg-surface/10 text-on-primary font-label-md text-label-md w-fit">
            Privacy First
          </span>
<h2 className="font-headline-lg text-3xl lg:text-4xl text-on-primary font-bold leading-tight">
            Private by default. Secure by design.
          </h2>
<p className="font-body-md text-body-md text-on-primary/80 text-base leading-relaxed">
            Your files are yours. We don&apos;t sell your data or use it for ads. 
          </p>
<div className="pt-2">
<a className="inline-flex items-center gap-1.5 text-primary-fixed hover:text-on-primary font-title-md text-title-md transition-colors" data-path="security" href="#security">
<span className="">Read about security</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</a>
</div>
{/* Subtle Map Pin Graphic */}
<div className="mt-4 p-4 rounded-2xl bg-surface/5 backdrop-blur-sm flex items-center gap-3 w-fit">
<span className="material-symbols-outlined text-tertiary-fixed text-[24px]">location_on</span>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-primary">Cape Town, South Africa</span>
<span className="font-label-sm text-label-sm text-on-primary/70">Where your files live</span>
</div>
</div>
</div>
{/* Right Column: 2x2 Feature Grid */}
<div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
{/* Item 1 */}
<div className="p-6 rounded-2xl bg-surface/10 backdrop-blur-md flex flex-col gap-4 shadow-sm">
<div className="w-10 h-10 rounded-xl bg-surface/15 flex items-center justify-center text-primary-fixed">
<span className="material-symbols-outlined text-[20px]">enhanced_encryption</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-on-primary mb-1">Encrypted everywhere</h3>
<p className="font-body-sm text-body-sm text-on-primary/75">
                Files encrypted at rest using AES-256 and securely in transit via HTTPS.
              </p>
</div>
</div>
{/* Item 2 */}
<div className="p-6 rounded-2xl bg-surface/10 backdrop-blur-md flex flex-col gap-4 shadow-sm">
<div className="w-10 h-10 rounded-xl bg-surface/15 flex items-center justify-center text-tertiary-fixed">
<span className="material-symbols-outlined text-[20px]">dns</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-on-primary mb-1">Stored in Africa</h3>
<p className="font-body-sm text-body-sm text-on-primary/75">
                Hosted in Amazon Web Services&apos; Cape Town region, close to your team.
              </p>
</div>
</div>
{/* Item 3 */}
<div className="p-6 rounded-2xl bg-surface/10 backdrop-blur-md flex flex-col gap-4 shadow-sm">
<div className="w-10 h-10 rounded-xl bg-surface/15 flex items-center justify-center text-primary-fixed-dim">
<span className="material-symbols-outlined text-[20px]">schedule_send</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-on-primary mb-1">Password links &amp; expiry</h3>
<p className="font-body-sm text-body-sm text-on-primary/75">
                Time-box external file access and require custom passwords on all shared links.
              </p>
</div>
</div>
{/* Item 4 */}
<div className="p-6 rounded-2xl bg-surface/10 backdrop-blur-md flex flex-col gap-4 shadow-sm">
<div className="w-10 h-10 rounded-xl bg-surface/15 flex items-center justify-center text-on-tertiary-container">
<span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-on-primary mb-1">Strict admin control</h3>
<p className="font-body-sm text-body-sm text-on-primary/75">
                Outside company sharing is off by default until an administrator enables it.
              </p>
</div>
</div>
</div>
</div>
</div>
</section>
{/* SECTION 11: CTA BANNER 2 (TEAM INVITE BANNER) */}
<section className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
<div className="rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8 sm:p-12 lg:p-16 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
<div className="lg:col-span-7 flex flex-col items-start gap-4">
<span className="font-label-md text-label-md text-primary font-semibold uppercase">Workspace Expansion</span>
<h2 className="font-headline-lg text-3xl sm:text-4xl text-text-primary font-bold">
          Your team is one invite away.
        </h2>
<p className="font-body-md text-body-md text-text-secondary max-w-lg">
          Create a company workspace and add your colleagues by email. Everyone gets the right access, inside your own company workspace.
        </p>
<div className="flex flex-wrap items-center gap-4 pt-2">
<a className="inline-flex items-center gap-2 bg-primary-container text-on-primary font-title-md text-title-md px-8 py-3.5 rounded-full shadow-md hover:opacity-95 transition-all" data-path="for-teams" href="#teams">
<span className="">Create a company workspace</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</a>
<Link className="font-title-md text-title-md text-text-secondary hover:text-text-primary px-3 py-2 transition-colors" data-path="get-started" href="/sign-up">
            Or start with a personal account
          </Link>
</div>
</div>
{/* Avatar Cluster */}
<div className="lg:col-span-5 flex justify-center">
<div className="relative w-64 h-64 flex items-center justify-center">
<div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse"></div>
<img loading="lazy" decoding="async" alt="Member" className="w-14 h-14 rounded-full object-cover shadow-md absolute top-2 left-6" src="/images/home/ada-portrait.jpg" />
<img loading="lazy" decoding="async" alt="Member" className="w-16 h-16 rounded-full object-cover shadow-md absolute top-8 right-4" src="/images/home/designer-headphones.jpg" />
<img loading="lazy" decoding="async" alt="Member" className="w-12 h-12 rounded-full object-cover shadow-md absolute bottom-4 left-8" src="/images/home/creative-lagos.jpg" />
<img loading="lazy" decoding="async" alt="Member" className="w-14 h-14 rounded-full object-cover shadow-md absolute bottom-6 right-8" src="/images/home/photographer-accra.jpg" />
<img loading="lazy" decoding="async" alt="Member" className="w-12 h-12 rounded-full object-cover shadow-md absolute left-0 top-24" src="/images/home/nairobi-cafe.jpg" />
<div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm text-headline-sm shadow-md z-10">
<span className="material-symbols-outlined text-[22px]">person_add</span>
</div>
</div>
</div>
</div>
</section>
{/* SECTION 12: PRICING TEASER */}
<section className="bg-canvas py-28 lg:py-32" id="pricing">
<div className="max-w-7xl mx-auto px-6 lg:px-12">
<div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
<span className="font-label-md text-label-md text-primary uppercase font-semibold">Predictable Access</span>
<h2 className="font-headline-lg text-3xl lg:text-4xl text-text-primary mb-3">Simple pricing</h2>
<p className="font-body-md text-body-md text-text-secondary text-base">Start free forever. Upgraded team plans are coming soon.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
{/* Card 1: Free Tier */}
<div className="bg-surface rounded-2xl p-8 shadow-md ring-2 ring-primary flex flex-col justify-between gap-8 relative">
<div className="flex flex-col gap-6">
<div className="flex items-center justify-between">
<div>
<h3 className="font-headline-sm text-xl text-text-primary font-bold">Free</h3>
<p className="font-body-sm text-body-sm text-text-secondary">For individuals and solo creators</p>
</div>
<span className="px-3 py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-semibold">Available now</span>
</div>
<div className="flex items-baseline gap-1">
<span className="font-headline-lg text-4xl font-bold text-text-primary">₦0</span>
<span className="font-body-sm text-body-sm text-text-secondary">/ month</span>
</div>
<ul className="flex flex-col gap-3 pt-2">
<li className="flex items-center gap-2.5 font-body-sm text-body-sm text-text-primary">
<span className="material-symbols-outlined text-primary text-[18px]">check</span>
<span className="">3 GB secure cloud storage</span>
</li>
<li className="flex items-center gap-2.5 font-body-sm text-body-sm text-text-primary">
<span className="material-symbols-outlined text-primary text-[18px]">check</span>
<span className="">1 personal workspace</span>
</li>
<li className="flex items-center gap-2.5 font-body-sm text-body-sm text-text-primary">
<span className="material-symbols-outlined text-primary text-[18px]">check</span>
<span className="">Secure password-protected public links</span>
</li>
<li className="flex items-center gap-2.5 font-body-sm text-body-sm text-text-primary">
<span className="material-symbols-outlined text-primary text-[18px]">check</span>
<span className="">Instant in-browser file previews</span>
</li>
<li className="flex items-center gap-2.5 font-body-sm text-body-sm text-text-primary">
<span className="material-symbols-outlined text-primary text-[18px]">check</span>
<span className="">One-click .zip folder downloads</span>
</li>
<li className="flex items-center gap-2.5 font-body-sm text-body-sm text-text-primary">
<span className="material-symbols-outlined text-primary text-[18px]">check</span>
<span className="">30-day trash recovery window</span>
</li>
</ul>
</div>
<Link className="w-full text-center bg-primary-container text-on-primary font-title-md text-title-md py-3.5 rounded-full shadow-md hover:opacity-95 transition-all" data-path="get-started" href="/sign-up">
            Get started free
          </Link>
</div>
{/* Card 2: Team Plan Teaser */}
<div className="bg-surface rounded-2xl p-8 shadow-sm flex flex-col justify-between gap-8 opacity-90">
<div className="flex flex-col gap-6">
<div className="flex items-center justify-between">
<div>
<h3 className="font-headline-sm text-xl text-text-primary font-bold">Team</h3>
<p className="font-body-sm text-body-sm text-text-secondary">For growing companies and agencies</p>
</div>
<span className="px-3 py-1 rounded-full bg-surface-container-high text-text-secondary font-label-sm text-label-sm font-semibold">Coming soon</span>
</div>
<div className="flex items-baseline gap-1">
<span className="font-headline-lg text-4xl font-bold text-text-primary">—</span>
</div>
<ul className="flex flex-col gap-3 pt-2">
<li className="flex items-center gap-2.5 font-body-sm text-body-sm text-text-secondary">
<span className="material-symbols-outlined text-outline text-[18px]">check</span>
<span className="">Pooled company storage</span>
</li>
<li className="flex items-center gap-2.5 font-body-sm text-body-sm text-text-secondary">
<span className="material-symbols-outlined text-outline text-[18px]">check</span>
<span className="">Centralized administrative governance</span>
</li>
<li className="flex items-center gap-2.5 font-body-sm text-body-sm text-text-secondary">
<span className="material-symbols-outlined text-outline text-[18px]">check</span>
<span className="">Restricted external sharing controls</span>
</li>
<li className="flex items-center gap-2.5 font-body-sm text-body-sm text-text-secondary">
<span className="material-symbols-outlined text-outline text-[18px]">check</span>
<span className="">Priority support assistance</span>
</li>
</ul>
</div>
<button className="w-full text-center bg-surface-container-low text-text-primary font-title-md text-title-md py-3.5 rounded-full hover:bg-surface-container transition-colors">
            Notify me
          </button>
</div>
</div>
<div className="text-center mt-12">
<Link className="inline-flex items-center gap-1.5 font-title-md text-title-md text-primary hover:text-primary-container transition-colors" data-path="pricing" href="/pricing">
<span className="">See full pricing</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</Link>
</div>
</div>
</section>
{/* SECTION 13: FAQ ACCORDION */}
<section className="scroll-mt-20 bg-surface py-28 lg:py-32" id="faq">
<div className="max-w-3xl mx-auto px-6 lg:px-12">
<div className="flex flex-col items-center text-center mb-16">
<span className="font-label-md text-label-md text-primary uppercase font-semibold">Answers</span>
<h2 className="font-headline-lg text-3xl lg:text-4xl text-text-primary mb-3 mt-1">Frequently asked questions</h2>
<p className="font-body-md text-body-md text-text-secondary text-base">Everything you need to know about MacTidar Cloud storage.</p>
</div>
<div className="flex flex-col gap-4">
{/* Item 1 (Expanded) */}
<details className="group bg-surface-container-low rounded-2xl p-6 shadow-sm transition-all" open><summary className="w-full flex items-center justify-between text-left font-title-md text-title-md text-text-primary cursor-pointer list-none [&::-webkit-details-marker]:hidden"><span>Is it really free?</span><span className="material-symbols-outlined text-text-secondary text-[20px] transition-transform transition-transform group-open:rotate-180">keyboard_arrow_down</span></summary><div className="mt-3 font-body-md text-body-md text-text-secondary leading-relaxed">Yes. MacTidar Cloud includes 3 GB of secure cloud storage completely free for life. No credit card required.</div></details>
{/* Item 2 */}
<details className="group bg-surface-container-low rounded-2xl p-6 shadow-sm transition-all"><summary className="w-full flex items-center justify-between text-left font-title-md text-title-md text-text-primary cursor-pointer list-none [&::-webkit-details-marker]:hidden"><span>Where are my files stored?</span><span className="material-symbols-outlined text-text-secondary text-[20px] transition-transform transition-transform group-open:rotate-180">keyboard_arrow_down</span></summary><div className="mt-3 font-body-md text-body-md text-text-secondary leading-relaxed">Your data is hosted securely in Africa at the AWS Cape Town facility, protected by AES-256 encryption at rest.</div></details>
{/* Item 3 */}
<details className="group bg-surface-container-low rounded-2xl p-6 shadow-sm transition-all"><summary className="w-full flex items-center justify-between text-left font-title-md text-title-md text-text-primary cursor-pointer list-none [&::-webkit-details-marker]:hidden"><span>Can people without an account see what I share?</span><span className="material-symbols-outlined text-text-secondary text-[20px] transition-transform transition-transform group-open:rotate-180">keyboard_arrow_down</span></summary><div className="mt-3 font-body-md text-body-md text-text-secondary leading-relaxed">Yes, through a secure link you control, with optional password protection and expiration dates.</div></details>
{/* Item 4 */}
<details className="group bg-surface-container-low rounded-2xl p-6 shadow-sm transition-all"><summary className="w-full flex items-center justify-between text-left font-title-md text-title-md text-text-primary cursor-pointer list-none [&::-webkit-details-marker]:hidden"><span>Can I use it for my company?</span><span className="material-symbols-outlined text-text-secondary text-[20px] transition-transform transition-transform group-open:rotate-180">keyboard_arrow_down</span></summary><div className="mt-3 font-body-md text-body-md text-text-secondary leading-relaxed">Yes. Company workspaces allow team pools, centralized administration, and restricted outside sharing.</div></details>
{/* Item 5 */}
<details className="group bg-surface-container-low rounded-2xl p-6 shadow-sm transition-all"><summary className="w-full flex items-center justify-between text-left font-title-md text-title-md text-text-primary cursor-pointer list-none [&::-webkit-details-marker]:hidden"><span>What happens if I delete something by mistake?</span><span className="material-symbols-outlined text-text-secondary text-[20px] transition-transform transition-transform group-open:rotate-180">keyboard_arrow_down</span></summary><div className="mt-3 font-body-md text-body-md text-text-secondary leading-relaxed">Deleted files remain safely recoverable in your Trash for 30 days before permanent purging.</div></details>
{/* Item 6 */}
<details className="group bg-surface-container-low rounded-2xl p-6 shadow-sm transition-all"><summary className="w-full flex items-center justify-between text-left font-title-md text-title-md text-text-primary cursor-pointer list-none [&::-webkit-details-marker]:hidden"><span>How do I delete my account?</span><span className="material-symbols-outlined text-text-secondary text-[20px] transition-transform transition-transform group-open:rotate-180">keyboard_arrow_down</span></summary><div className="mt-3 font-body-md text-body-md text-text-secondary leading-relaxed">Email admin@mactidar.com from your account&apos;s address and we&apos;ll permanently delete your account and all of its files.</div></details>
</div>
<div className="text-center mt-10">
<a className="inline-flex items-center gap-1.5 font-title-md text-title-md text-primary hover:text-primary-container transition-colors" data-path="contact" href="mailto:admin@mactidar.com">
<span className="">Still have questions? Contact us</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</a>
</div>
</div>
</section>
{/* SECTION 14: FINAL CTA BANNER */}
<section className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
<div className="rounded-3xl bg-gradient-to-r from-primary-container to-primary text-on-primary p-8 sm:p-12 lg:p-16 shadow-xl relative overflow-hidden">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
<div className="lg:col-span-7 flex flex-col items-start gap-4">
<h2 className="font-headline-lg text-3xl sm:text-5xl text-on-primary font-bold leading-tight">
            Your files deserve a better home.
          </h2>
<p className="font-body-md text-body-md text-on-primary/85 text-lg max-w-lg">
            Get started free — 3 GB included, no credit card required. Join creators and teams across Africa.
          </p>
<div className="pt-4">
<Link className="inline-flex items-center gap-2 bg-surface text-primary font-title-md text-title-md px-8 py-4 rounded-full shadow-lg hover:bg-surface-container-low transition-colors" data-path="get-started" href="/sign-up">
<span className="">Get started free</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</Link>
</div>
</div>
{/* Overlapping Editorial Portrait */}
<div className="lg:col-span-5 flex justify-center lg:justify-end">
<div className="relative w-72 h-72 sm:w-80 sm:h-80">
<img loading="lazy" decoding="async" alt="Designer with headphones on laptop" className="w-full h-full object-cover rounded-2xl shadow-2xl ring-4 ring-surface/20" src="/images/home/designer-headphones.jpg" />
<div className="absolute -bottom-3 -left-3 bg-surface text-text-primary px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2">
<span className="material-symbols-outlined text-file-sheet text-[18px]">check_circle</span>
<span className="font-label-sm text-label-sm font-semibold">Ready in 60s</span>
</div>
</div>
</div>
</div>
</div>
</section>
</div></main><MarketingFooter />

    </div>
  );
}
