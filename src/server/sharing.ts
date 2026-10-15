import "server-only";
import { config } from "./config";
import { getItems, pathIds, type Item } from "./db/items";
import { createLink, deleteLink, getLinkForItem, updateLink, type PublicLink } from "./db/links";
import { deleteShare, getShare, listSharesOn, putShare } from "./db/shares";
import { getUser, listMembers, type User } from "./db/users";
import { sendEmail } from "./email";
import { badRequest, forbidden, notFound } from "./errors";
import { hashLinkPassword } from "./linkAccess";
import { atLeast, requireAccess, type AccessRole } from "./permissions";
import { recordRecent } from "./recent";

export type AccessEntry = {
  userId: string;
  name: string;
  email: string;
  role: AccessRole;
  inheritedFrom?: { id: string; name: string };
};

export async function accessList(user: User, itemId: string) {
  const { item, role } = await requireAccess(user, itemId, "VIEWER");
  const members = await listMembers();
  const byId = new Map(members.map((m) => [m.id, m]));
  const ancestors = pathIds(item.path).slice(0, -1);
  const folderNames = await getItems(ancestors);

  const entries = new Map<string, AccessEntry>();
  const owner = byId.get(item.ownerId);
  entries.set(item.ownerId, { userId: item.ownerId, name: owner?.name ?? "Former member", email: owner?.email ?? "", role: "OWNER" });

  // Nearest share wins; inherited ones come from parent folders.
  for (const id of [...ancestors, item.id]) {
    for (const s of await listSharesOn(id)) {
      const m = byId.get(s.userId);
      if (!m || s.userId === item.ownerId) continue;
      entries.set(s.userId, {
        userId: s.userId,
        name: m.name,
        email: m.email,
        role: s.role,
        inheritedFrom: id === item.id ? undefined : { id, name: id.startsWith("root-") ? "My Files" : (folderNames.get(id)?.name ?? "a parent folder") },
      });
    }
  }
  const link = await getLinkForItem(item.id);
  return {
    item,
    myRole: role,
    entries: [...entries.values()],
    members: members.filter((m) => m.status === "ACTIVE").map((m) => ({ id: m.id, name: m.name, email: m.email })),
    link: link ? publicLinkInfo(link) : null,
  };
}

export const publicLinkInfo = (link: PublicLink) => ({
  url: `${config().APP_URL}/s/${link.token}`,
  allowDownload: link.allowDownload,
  hasPassword: !!link.passwordHash,
  expiresAt: link.expiresAt ? new Date(link.expiresAt * 1000).toISOString() : null,
});

export async function shareWith(user: User, itemId: string, targetId: string, role: "VIEWER" | "EDITOR") {
  const { item } = await requireAccess(user, itemId, "EDITOR");
  if (!item.parentId) throw badRequest("Share folders inside My Files instead of My Files itself.");
  const target = await getUser(targetId);
  if (!target || target.status !== "ACTIVE") throw notFound("That teammate doesn't exist.");
  if (target.id === item.ownerId) throw badRequest(`${target.name} owns this item already.`);
  if (target.id === user.id) throw badRequest("You can't change your own access.");
  const created = await putShare(item.id, target.id, role, user.id);
  if (created) {
    recordRecent(target.id, item.id, "shared").catch(() => {});
    notifyShare(user, target, item, role).catch(() => {});
  }
}

export async function unshare(user: User, itemId: string, targetId: string) {
  const { item } = await requireAccess(user, itemId, "EDITOR");
  if (!(await getShare(item.id, targetId))) throw notFound("That person doesn't have direct access to this item.");
  await deleteShare(item.id, targetId);
}

async function notifyShare(from: User, to: User, item: Item, role: string) {
  const link = `${config().APP_URL}${item.type === "folder" ? `/folders/${item.id}` : "/shared"}`;
  const what = item.type === "folder" ? "a folder" : "a file";
  await sendEmail(
    to.email,
    `${from.name} shared "${item.name}" with you`,
    `${from.name} shared ${what} with you on MacTidar Cloud: ${item.name} (${role.toLowerCase()} access).\n\nOpen it: ${link}`,
    `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#111827">
      <p style="font-size:16px"><b>${from.name}</b> shared ${what} with you</p>
      <p style="font-size:18px;font-weight:600">${item.name.replace(/[<>&]/g, "")}</p>
      <p style="color:#6B7280">You have ${role.toLowerCase()} access.</p>
      <p><a href="${link}" style="display:inline-block;background:#2563EB;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Open in MacTidar</a></p>
    </div>`,
  );
}

export type LinkSettings = { allowDownload: boolean; password?: string | null; expiresInDays?: number | null };

export async function saveLink(user: User, itemId: string, settings: LinkSettings) {
  const { item, role } = await requireAccess(user, itemId, "VIEWER");
  if (!atLeast(role, "OWNER")) throw forbidden("Only the owner can create or change public links.");
  if (!item.parentId) throw badRequest("Create links for files or folders inside My Files.");
  if (settings.password !== undefined && settings.password !== null && settings.password.length < 4) {
    throw badRequest("Link passwords need at least 4 characters.");
  }
  const expiresAt =
    settings.expiresInDays === undefined ? undefined : settings.expiresInDays === null ? null : Math.floor(Date.now() / 1000) + settings.expiresInDays * 86400;
  const passwordHash =
    settings.password === undefined ? undefined : settings.password === null ? null : await hashLinkPassword(settings.password);

  const existing = await getLinkForItem(item.id);
  if (existing) {
    await updateLink(existing.token, { allowDownload: settings.allowDownload, passwordHash, expiresAt });
  } else {
    await createLink({
      itemId: item.id,
      createdBy: user.id,
      allowDownload: settings.allowDownload,
      ...(passwordHash ? { passwordHash } : {}),
      ...(expiresAt ? { expiresAt } : {}),
    });
  }
  const link = await getLinkForItem(item.id);
  return link ? publicLinkInfo(link) : null;
}

export async function removeLink(user: User, itemId: string) {
  const { item, role } = await requireAccess(user, itemId, "VIEWER");
  if (!atLeast(role, "OWNER")) throw forbidden("Only the owner can disable public links.");
  const link = await getLinkForItem(item.id);
  if (link) await deleteLink(link);
}
