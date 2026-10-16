import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { getInviteByToken } from "@/server/db/invites";
import { findUserByEmail } from "@/server/db/users";
import { getWorkspace, listWorkspaceMembers } from "@/server/db/workspaces";
import { currentUser } from "@/server/session";
import { JoinCard } from "./JoinCard";
import { AcceptForm } from "./AcceptForm";

export const metadata = { title: "Accept invitation · MacTidar Cloud" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  const firstName = invite?.invitedByName.split(" ")[0];
  const [workspace, existing, viewer] = invite
    ? await Promise.all([getWorkspace(invite.workspaceId), findUserByEmail(invite.email), currentUser()])
    : [null, null, null];
  const memberCount = workspace ? (await listWorkspaceMembers(workspace.id)).filter((m) => m.status === "ACTIVE").length : 0;

  // Existing accounts join with one click instead of creating a new password.
  if (invite && workspace && existing) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-canvas px-4 py-10">
        <div className="mb-8">
          <Logo />
        </div>
        <JoinCard
          token={token}
          inviterName={invite.invitedByName}
          workspaceName={workspace.name}
          memberCount={memberCount}
          role={invite.role}
          inviteEmail={invite.email}
          signedInAs={viewer?.email ?? null}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-canvas px-4 py-10 sm:px-6">
      <div className="relative w-full max-w-[480px]">
        <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-tertiary/5 blur-3xl" />
        <div className="relative flex w-full flex-col items-center rounded-xl bg-surface p-8 shadow-xl sm:p-9">
          <div className="mb-6">
            <Logo />
          </div>
          {invite ? (
            <>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 font-label-md text-label-md text-primary">
                <Icon name="group_add" fill className="text-[15px]" />
                <span>Team Invitation</span>
              </div>
              <h1 className="mb-2 text-center font-headline-lg text-headline-lg tracking-tight text-text-primary">
                {firstName} invited you to join {workspace?.name ?? "MacTidar"}
              </h1>
              <p className="mb-6 text-center font-body-md text-body-md text-text-secondary">
                Set up your account to start collaborating with your team on MacTidar Cloud.
              </p>
              <AcceptForm token={token} email={invite.email} />
            </>
          ) : (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-danger">
                <Icon name="link_off" className="text-[28px]" />
              </div>
              <h1 className="mb-2 text-center font-headline-lg text-headline-lg text-text-primary">This invitation isn&apos;t valid</h1>
              <p className="mb-6 text-center font-body-md text-body-md text-text-secondary">
                It may have expired or already been used. Ask your admin to send you a new invite.
              </p>
            </>
          )}
          <div className="mt-6 w-full rounded-lg bg-surface-container-low/40 py-2.5 text-center">
            <p className="font-body-sm text-body-sm text-text-secondary">
              Already have an account?
              <Link className="ml-1 font-title-md text-primary hover:underline" href="/sign-in">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-text-secondary">
          <Icon name="verified_user" className="text-[16px] text-tertiary" />
          <span className="font-label-sm text-label-sm">Your password is handled securely by AWS Cognito</span>
        </div>
      </div>
    </main>
  );
}
