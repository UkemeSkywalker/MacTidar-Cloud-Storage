import { Logo } from "@/components/Logo";
import { requirePageUser } from "@/server/session";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata = { title: "Set up your workspace · MacTidar Cloud" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const user = await requirePageUser();
  const personal = user.workspaces.find((w) => w.type === "PERSONAL");
  const { step } = await searchParams;
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-canvas px-4 py-12">
      <div className="pointer-events-none absolute left-1/2 top-40 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-primary-fixed/30 blur-3xl" />
      <div className="relative mb-8">
        <Logo />
      </div>
      <OnboardingFlow email={user.email} personalId={personal?.id ?? null} startAtCompany={step === "company"} />
    </main>
  );
}
