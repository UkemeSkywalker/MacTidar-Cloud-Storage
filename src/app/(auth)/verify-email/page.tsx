import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { turnstileSiteKey } from "@/server/turnstile";
import { VerifyForm } from "./VerifyForm";

export const metadata = { title: "Verify your email · MacTidar Cloud" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; resend?: string }> }) {
  const { email = "", resend } = await searchParams;
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-12">
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-0 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-fixed/30 blur-3xl" />
      <div className="relative mb-8">
        <Logo height={48} />
      </div>
      <div className="relative w-full max-w-[640px] overflow-hidden rounded-2xl bg-surface shadow-xl">
        <div className="h-1 bg-gradient-to-r from-primary-fixed-dim via-primary-container to-file-doc" />
        <div className="flex flex-col items-center px-8 pb-8 pt-10 sm:px-10">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft">
            <Icon name="mark_email_read" className="text-[36px] text-primary-container" />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant ring-4 ring-surface">
              <Icon name="lock" className="text-[14px]" />
            </span>
          </div>
          <h1 className="mb-1 font-headline-lg text-[28px] text-text-primary">Check your inbox</h1>
          <p className="mb-7 text-center font-body-md text-[15px] text-text-secondary">
            We sent a 6-digit code to <span className="font-semibold text-text-primary">{email || "your email"}</span>
          </p>
          <VerifyForm email={email} autoResend={!!resend} siteKey={turnstileSiteKey()} />
        </div>
        <div className="flex items-center justify-center gap-2 bg-surface-container-low py-3 font-label-md text-label-md text-on-surface-variant">
          <Icon name="verified_user" className="text-[16px] text-tertiary" /> Your connection is encrypted (HTTPS)
        </div>
      </div>
    </main>
  );
}
