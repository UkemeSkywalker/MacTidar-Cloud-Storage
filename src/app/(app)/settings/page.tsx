import { requirePageUser } from "@/server/session";
import { SettingsView } from "./SettingsView";

export const metadata = { title: "Settings · MacTidar Cloud" };

export default async function SettingsPage() {
  const user = await requirePageUser();
  return (
    <SettingsView
      user={{ id: user.id, name: user.name, email: user.email, role: user.role, notifyShares: user.notifyShares !== false, createdAt: user.createdAt }}
    />
  );
}
