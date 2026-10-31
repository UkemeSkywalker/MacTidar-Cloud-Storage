import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";

// Left-hand marketing panel shared by the sign-in and sign-up pages.
export function BrandPanel() {
  return (
    <>
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-fixed via-surface-container-low to-secondary-container p-8 lg:col-span-5 lg:flex lg:p-14">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-fixed-dim/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative z-10">
          <Logo height={48} />
        </div>
        <div className="relative z-10 flex max-w-lg flex-col items-start">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1 shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-file-sheet" />
            <span className="font-label-md text-label-md text-text-primary">Free 3 GB · No credit card</span>
          </div>
          <h1 className="mb-4 text-[32px] font-bold leading-[40px] tracking-tight text-text-primary">
            Your team&apos;s files, safely in one place
          </h1>
          <p className="mb-8 font-body-md text-body-md leading-relaxed text-secondary">
            Cloud storage for you and your team. Upload, organise and share files — with teammates or anyone, on your
            terms.
          </p>
          <div className="relative flex w-full items-center justify-center py-4">
            <div className="relative flex aspect-square w-full max-w-[340px] items-center justify-center rounded-2xl bg-surface/40 p-6 shadow-sm backdrop-blur-sm">
              <div className="absolute h-40 w-56 rotate-[-6deg] rounded-2xl bg-surface-container-lowest/80 shadow-md" />
              <div className="absolute flex h-44 w-60 rotate-[3deg] flex-col justify-between rounded-2xl bg-primary-container p-5 text-on-primary shadow-xl transition-transform duration-500 hover:rotate-0">
                <div className="flex items-center justify-between">
                  <Icon name="folder_open" className="text-[28px] text-primary-fixed" />
                  <span className="rounded-full bg-surface/20 px-2 py-0.5 text-[10px] font-medium tracking-wide">PRIVATE</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-3/4 rounded-full bg-surface/30" />
                  <div className="h-2 w-1/2 rounded-full bg-surface/20" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface/30">
                    <Icon name="lock" className="text-[13px]" />
                  </div>
                  <span className="text-[11px] font-medium text-primary-fixed">Encrypted at rest</span>
                </div>
              </div>
              <div className="absolute -bottom-3 -left-2 z-20 flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-2.5 shadow-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant">
                  <Icon name="verified_user" className="text-[16px]" />
                </div>
                <div>
                  <p className="font-label-sm text-label-sm font-semibold text-text-primary">Private by default</p>
                  <p className="text-[10px] leading-none text-text-secondary">You decide who sees what</p>
                </div>
              </div>
              <div className="absolute -right-2 -top-3 z-20 flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2 shadow-md">
                <Icon name="cloud_done" className="text-[18px] text-file-sheet" />
                <span className="font-label-md text-label-md text-text-primary">Stored on AWS</span>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-6 pt-6">
          <div className="flex items-center gap-2">
            <Icon name="security" className="text-[18px] text-primary" />
            <span className="font-label-md text-label-md text-text-primary">256-bit AES encryption</span>
          </div>
          <div className="hidden h-3 w-px bg-outline-variant sm:block" />
          <div className="flex items-center gap-2">
            <Icon name="check_circle" className="text-[18px] text-tertiary" />
            <span className="font-label-md text-label-md text-text-primary">Private by default</span>
          </div>
        </div>
      </div>

    </>
  );
}
