import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { ResetFlow } from "./ResetFlow";

export const metadata = { title: "Reset password · MacTidar Cloud" };

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-canvas px-4 py-8 md:py-12">
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary-fixed/30 to-transparent blur-3xl" />
      <header className="mb-10 flex w-full max-w-[960px] flex-col items-center justify-between gap-4 sm:flex-row">
        <Link href="/sign-in" className="group inline-flex items-center gap-2 font-title-md text-title-md text-primary transition-colors hover:text-on-primary-fixed-variant">
          <Icon name="arrow_back" className="text-[18px] transition-transform group-hover:-translate-x-0.5" />
          <span>Back to sign in</span>
        </Link>
        <div className="flex items-center gap-3">
          <Logo />
          <div className="h-5 w-px bg-secondary-fixed-dim" />
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-secondary">Account Security</span>
        </div>
        <div className="hidden items-center gap-2 font-label-md text-label-md text-text-secondary sm:flex">
          <Icon name="lock" className="text-[16px] text-tertiary" />
          <span>Secured connection</span>
        </div>
      </header>
      <ResetFlow />
    </main>
  );
}
