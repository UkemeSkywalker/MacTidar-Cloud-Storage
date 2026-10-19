import { getMembership, getWorkspace } from "@/server/db/workspaces";
import { requirePageUser } from "@/server/session";
import { SettingsView } from "./SettingsView";

export const metadata = { title: "Settings · MacTidar Cloud" };

export default async function SettingsPage() {
  const user = await requirePageUser();
  const [ws, membership] = await Promise.all([getWorkspace(user.workspaceId), getMembership(user.workspaceId, user.id)]);
  return (
    <SettingsView
      user={{ id: user.id, name: user.name, email: user.email, role: user.role, notifyShares: user.notifyShares !== false, createdAt: user.createdAt }}
      personal={ws?.type === "PERSONAL" ? { name: ws.name, sharingEnabled: !!ws.sharingEnabled, usedBytes: ws.usedBytes, quotaBytes: ws.quotaBytes } : null}
      company={
        ws?.type === "COMPANY"
          ? { name: ws.name, isAdmin: user.role === "ADMIN", externalSharing: !!ws.externalSharing, allowedDomains: ws.allowedDomains ?? [], mine: !!membership?.outsideSharing }
          : null
      }
    />
  );
}
