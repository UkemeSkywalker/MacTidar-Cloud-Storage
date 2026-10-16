import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { Logo } from "@/components/Logo";
import { currentUser } from "@/server/session";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in · MacTidar Cloud" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string; verified?: string; email?: string }> }) {
  const { next, reset, verified, email } = await searchParams;
  if (await currentUser()) redirect(next?.startsWith("/") ? next : "/files");

  return (
    <main className="grid min-h-screen w-full grid-cols-1 bg-canvas lg:grid-cols-12">
      <BrandPanel />

      {/* Sign-in form */}
      <div className="flex flex-col items-center justify-between bg-surface px-6 py-12 lg:col-span-7 lg:px-20 lg:py-14">
        <div className="flex w-full max-w-[440px] items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto">
            <span className="mr-2 font-label-md text-label-md text-text-secondary">Need assistance?</span>
            <a className="font-label-md text-label-md font-semibold text-primary-container hover:underline" href="mailto:admin@mactidar.com">
              Contact Support
            </a>
          </div>
        </div>
        <div className="my-auto w-full max-w-[440px] py-8">
          <div className="mb-8">
            <h2 className="mb-2 font-headline-lg text-headline-lg font-semibold tracking-tight text-text-primary">Welcome back</h2>
            <p className="font-body-md text-body-md text-text-secondary">Sign in to your MacTidar workspace to access your files.</p>
          </div>
          {verified && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-tertiary-fixed/40 p-3 text-on-tertiary-fixed-variant">
              <Icon name="mark_email_read" className="text-[18px]" />
              <span className="font-body-sm text-body-sm">Email verified. Sign in to finish setting up your account.</span>
            </div>
          )}
          {reset && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-tertiary-fixed/40 p-3 text-on-tertiary-fixed-variant">
              <Icon name="check_circle" className="text-[18px]" />
              <span className="font-body-sm text-body-sm">Password updated. Sign in with your new password.</span>
            </div>
          )}
          <SignInForm next={next?.startsWith("/") ? next : "/files"} initialEmail={email ?? ""} />
        </div>
        <div className="flex w-full max-w-[440px] items-center justify-center gap-2 pt-6 text-text-secondary">
          <Icon name="lock" className="text-[15px] text-tertiary" />
          <span className="font-label-sm text-label-sm tracking-wide">Protected by MacTidar Cloud security</span>
        </div>
      </div>
    </main>
  );
}
