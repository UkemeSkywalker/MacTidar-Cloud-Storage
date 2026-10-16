import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { currentUser } from "@/server/session";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Create your account · MacTidar Cloud" };

export default async function SignUpPage() {
  if (await currentUser()) redirect("/files");
  return (
    <main className="grid min-h-screen w-full grid-cols-1 bg-canvas lg:grid-cols-12">
      <BrandPanel />
      <div className="flex flex-col items-center justify-between bg-surface px-6 py-12 lg:col-span-7 lg:px-20 lg:py-14">
        <div className="flex w-full max-w-[440px] items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto">
            <span className="mr-2 font-label-md text-label-md text-text-secondary">Already have an account?</span>
            <Link className="font-label-md text-label-md font-semibold text-primary-container hover:underline" href="/sign-in">
              Sign in
            </Link>
          </div>
        </div>
        <div className="my-auto w-full max-w-[440px] py-8">
          <div className="mb-8">
            <h2 className="mb-2 font-headline-lg text-headline-lg font-semibold tracking-tight text-text-primary">Create your account</h2>
            <p className="flex items-center gap-1.5 font-body-md text-body-md text-text-secondary">
              <Icon name="cloud_done" className="text-[18px] text-tertiary" /> Free forever · 3 GB of storage · No credit card
            </p>
          </div>
          <SignUpForm />
        </div>
        <div className="flex w-full max-w-[440px] items-center justify-center gap-2 pt-6 text-text-secondary">
          <Icon name="lock" className="text-[15px] text-tertiary" />
          <span className="font-label-sm text-label-sm tracking-wide">Your files are private by default</span>
        </div>
      </div>
    </main>
  );
}
