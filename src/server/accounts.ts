import "server-only";
import { cognitoProfile } from "./cognito";
import { createUser, getUser, type User } from "./db/users";
import { createWorkspace, listUserWorkspaces } from "./db/workspaces";

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "My";

// Every person has exactly one personal workspace.
export async function ensurePersonalWorkspace(user: User) {
  const existing = (await listUserWorkspaces(user.id)).find((w) => w.workspace.type === "PERSONAL" && w.workspace.ownerId === user.id);
  if (existing) return { workspace: existing.workspace, created: false };
  const { workspace } = await createWorkspace({ name: `${firstName(user.name)}'s Personal`, type: "PERSONAL", ownerId: user.id });
  return { workspace, created: true };
}

// On first sign-in after self sign-up: create the profile from Cognito.
export async function provisionAccount(userId: string): Promise<{ user: User; isNew: boolean }> {
  const existing = await getUser(userId);
  if (existing) return { user: existing, isNew: false };
  const profile = await cognitoProfile(userId);
  const user = await createUser({ id: userId, email: profile.email, name: profile.name || profile.email.split("@")[0] });
  return { user, isNew: true };
}
