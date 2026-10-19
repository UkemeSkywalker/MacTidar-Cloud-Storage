import Link from "next/link";
import { PublicBrowser } from "@/app/s/[token]/PublicBrowser";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { listChildren } from "@/server/db/items";
import { resolveGuest } from "@/server/guests";
import { itemInLink } from "@/server/linkAccess";
import { turnstileSiteKey } from "@/server/turnstile";
import { GuestVerify } from "./GuestVerify";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shared with you · MacTidar Cloud", robots: { index: false, follow: false } };

// A file or folder shared with someone outside its workspace, by email.
export default async function GuestSharePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ folder?: string }> }) {
  const { token } = await params;
  const { folder: folderId } = await searchParams;
  const g = await resolveGuest(token);

  let body: React.ReactNode;
  if (g.state === "missing" || g.state === "blocked") {
    body = (
      <Card>
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
          <Icon name={g.state === "blocked" ? "lock" : "link_off"} className="text-[38px]" />
        </div>
        <h1 className="mb-2 text-center text-[26px] font-semibold text-text-primary">{g.state === "blocked" ? "This share has been turned off" : "This share is no longer available"}</h1>
        <p className="mb-6 max-w-sm text-center font-body-md text-[15px] text-text-secondary">
          {g.state === "blocked"
            ? "Sharing outside the workspace was switched off. Ask the person who shared it with you to send it again."
            : "It may have been removed, or the item was deleted. Ask the person who shared it with you for a new invite."}
        </p>
        <Link href="/" className="flex h-11 items-center justify-center gap-2 rounded-full bg-surface-container-high px-6 font-title-md text-title-md text-text-primary hover:bg-surface-container-highest">
          <Icon name="cloud" className="text-[20px]" /> Go to MacTidar Cloud
        </Link>
      </Card>
    );
  } else if (g.state === "verify") {
    body = (
      <GuestVerify
        token={token}
        siteKey={turnstileSiteKey()}
        email={g.share.email}
        sharerName={g.sharerName}
        item={{ name: g.item.name, type: g.item.type, size: g.item.size ?? 0 }}
      />
    );
  } else {
    const { root } = g;
    const current = folderId ? await itemInLink(root, folderId) : root;
    const folder = current && current.type === "folder" ? current : null;
    const children = folder ? await listChildren(folder.id) : [];
    const files = root.type === "file" ? [root] : children;
    body = (
      <>
        <div className="mx-auto mb-6 flex max-w-[1400px] items-center gap-3 rounded-xl bg-primary-soft p-4 font-body-md text-body-md text-primary">
          <Icon name="badge" className="text-[20px]" />
          <span>
            {g.signedIn ? "You're signed in as" : "You're viewing as a guest:"} <b>{g.viewer}</b>. Your access lasts while {g.sharerName.split(" ")[0]} keeps this shared with you.
          </span>
        </div>
        <PublicBrowser
          token={token}
          mode="guest"
          sharerName={g.sharerName}
          root={{ id: root.id, name: root.name, type: root.type, size: root.size ?? 0, mimeType: root.mimeType }}
          folder={folder ? { id: folder.id, name: folder.name, isRoot: folder.id === root.id } : null}
          allowDownload
          expiresAt={null}
          items={files.map((i) => ({
            id: i.id,
            type: i.type,
            name: i.name,
            size: i.size ?? 0,
            mimeType: i.mimeType,
            createdAt: i.createdAt,
            updatedAt: i.updatedAt,
            ownerId: i.ownerId,
            ownerName: g.sharerName,
            sharedCount: 0,
            hasLink: false,
          }))}
        />
      </>
    );
  }

  const open = g.state === "open";
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-16 items-center justify-between gap-3 bg-surface px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <Logo />
          <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Guest</span>
        </div>
        {open && !g.signedIn ? (
          <Link href="/sign-up" className="flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 font-title-md text-title-md text-on-primary shadow-sm hover:bg-primary">
            Create free account
          </Link>
        ) : !open ? (
          <Link href="/sign-in" className="flex items-center gap-2 rounded-full px-4 py-2 font-title-md text-title-md text-text-primary shadow-sm hover:bg-surface-container-low">
            <Icon name="login" className="text-[20px]" /> Sign in
          </Link>
        ) : null}
      </header>
      <main className="w-full flex-1 px-4 py-10 lg:px-10">{body}</main>
      <footer className="flex items-center justify-center gap-2 px-4 py-8 text-center font-body-md text-body-md text-text-secondary">
        <Icon name="cloud" className="text-[18px] text-primary" /> Powered by <span className="font-semibold text-text-primary">MacTidar Cloud</span>
      </footer>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-[560px] flex-col items-center rounded-2xl bg-surface p-10 shadow-sm">{children}</div>;
}
