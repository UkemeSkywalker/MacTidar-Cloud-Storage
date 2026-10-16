import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { listChildren } from "@/server/db/items";
import { getUser } from "@/server/db/users";
import { itemInLink, resolveLink } from "@/server/linkAccess";
import { PublicBrowser } from "./PublicBrowser";
import { ReportAbuse } from "./ReportAbuse";
import { UnlockForm } from "./UnlockForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shared with you · MacTidar Cloud", robots: { index: false, follow: false } };

export default async function PublicLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  const { token } = await params;
  const { folder: folderId } = await searchParams;
  const resolved = await resolveLink(token);
  const sharer = "link" in resolved ? await getUser(resolved.link.createdBy) : null;
  const sharerName = sharer?.name ?? "A MacTidar teammate";

  let body: React.ReactNode;
  if (resolved.state === "suspended") {
    body = (
      <StateCard>
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#fef3c7] text-warning">
          <Icon name="gpp_maybe" className="text-[44px]" />
        </div>
        <h1 className="mb-2 text-center text-[28px] font-semibold text-text-primary">This link has been disabled</h1>
        <p className="mb-6 max-w-sm text-center font-body-md text-[15px] text-text-secondary">
          The content behind this link was reported and is being reviewed. If you think this is a mistake, contact admin@mactidar.com.
        </p>
        <Link href="/" className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-surface-container-high font-title-md text-title-md text-text-primary hover:bg-surface-container-highest">
          <Icon name="cloud" className="text-[20px]" /> Go to MacTidar
        </Link>
      </StateCard>
    );
  } else if (resolved.state === "missing" || resolved.state === "expired") {
    body = (
      <StateCard>
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-error-container/60 text-danger">
          <Icon name="link_off" className="text-[44px]" />
          <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface text-warning shadow">
            <Icon name="schedule" className="text-[18px]" />
          </span>
        </div>
        <h1 className="mb-2 text-center text-[28px] font-semibold text-text-primary">This link has expired</h1>
        <p className="mb-6 max-w-sm text-center font-body-md text-[15px] text-text-secondary">
          This shared link is no longer available. Ask the person who shared it for a new link.
        </p>
        {resolved.state === "expired" && (
          <dl className="mb-6 w-full space-y-3 rounded-xl bg-surface-container-low p-4 font-body-md text-body-md">
            <div className="flex justify-between gap-4">
              <dt className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">Resource</dt>
              <dd className="flex items-center gap-1.5">
                <Icon name={resolved.root?.type === "folder" ? "folder" : "description"} className="text-[18px] text-primary" /> {resolved.root?.name}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">Expired on</dt>
              <dd className="text-danger">{new Date((resolved.link.expiresAt ?? 0) * 1000).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">Shared by</dt>
              <dd>{sharerName}</dd>
            </div>
          </dl>
        )}
        <Link href="/sign-in" className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-surface-container-high font-title-md text-title-md text-text-primary hover:bg-surface-container-highest">
          <Icon name="cloud" className="text-[20px]" /> Go to MacTidar
        </Link>
      </StateCard>
    );
  } else if (resolved.state === "locked") {
    body = (
      <StateCard>
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-fixed/60 text-primary">
          <Icon name="lock" className="text-[44px]" />
          <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-primary-container ring-4 ring-surface" />
        </div>
        <h1 className="mb-2 text-center text-[28px] font-semibold text-text-primary">This link is password protected</h1>
        <p className="mb-3 text-center font-body-md text-[15px] text-text-secondary">
          Enter the password to view <span className="font-semibold text-text-primary">&lsquo;{resolved.root.name}&rsquo;</span>
        </p>
        <p className="mb-6 flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1 font-body-sm text-body-sm text-text-secondary">
          <Icon name={resolved.root.type === "folder" ? "folder_shared" : "description"} className="text-[16px]" /> Shared by {sharerName}
        </p>
        <UnlockForm token={token} sharerName={sharerName} />
      </StateCard>
    );
  } else {
    const { root, link } = resolved;
    const current = folderId ? await itemInLink(root, folderId) : root;
    const folder = current && current.type === "folder" ? current : null;
    const children = folder ? await listChildren(folder.id) : [];
    const files = root.type === "file" ? [root] : children;
    body = (
      <PublicBrowser
        token={token}
        sharerName={sharerName}
        root={{ id: root.id, name: root.name, type: root.type, size: root.size ?? 0, mimeType: root.mimeType }}
        folder={folder ? { id: folder.id, name: folder.name, isRoot: folder.id === root.id } : null}
        allowDownload={link.allowDownload}
        expiresAt={link.expiresAt ? new Date(link.expiresAt * 1000).toISOString() : null}
        items={files.map((i) => ({
          id: i.id,
          type: i.type,
          name: i.name,
          size: i.size ?? 0,
          mimeType: i.mimeType,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
          ownerId: i.ownerId,
          ownerName: sharerName,
          sharedCount: 0,
          hasLink: true,
        }))}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-16 items-center justify-between bg-surface px-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:px-10">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Public transfer</span>
        </div>
        <Link href="/sign-in" className="flex items-center gap-2 rounded-full px-4 py-2 font-title-md text-title-md text-text-primary shadow-sm hover:bg-surface-container-low">
          <Icon name="login" className="text-[20px]" /> Sign in
        </Link>
      </header>
      <main className="w-full flex-1 px-4 py-10 lg:px-10">{body}</main>
      <footer className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center font-body-md text-body-md text-text-secondary sm:flex-row">
        <span className="flex items-center gap-2">
          <Icon name="cloud" className="text-[18px] text-primary" /> Powered by <span className="font-semibold text-text-primary">MacTidar Cloud</span>
        </span>
        {(resolved.state === "open" || resolved.state === "locked") && (
          <>
            <span className="hidden h-1 w-1 rounded-full bg-outline-variant sm:block" />
            <ReportAbuse token={token} />
          </>
        )}
      </footer>
    </div>
  );
}

function StateCard({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-[560px] flex-col items-center rounded-2xl bg-surface p-10 shadow-sm">{children}</div>;
}
