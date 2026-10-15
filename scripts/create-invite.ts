// Creates an invite without email and prints the link. Used to bootstrap the
// first admin (no one can invite before an admin exists).
//
//   npm run create-invite -- someone@mactidar.com ADMIN
import { config } from "@/server/config";
import { createInvite } from "@/server/db/invites";

async function main() {
  const [email, role = "ADMIN"] = process.argv.slice(2);
  if (!email || !["ADMIN", "MEMBER"].includes(role)) {
    console.error("Usage: npm run create-invite -- <email> [ADMIN|MEMBER]");
    process.exit(1);
  }
  const { token } = await createInvite({
    email,
    role: role as "ADMIN" | "MEMBER",
    invitedBy: "system",
    invitedByName: "MacTidar",
  });
  console.log(`Invite link for ${email} (${role}), valid for 7 days:\n${config().APP_URL}/invite/${token}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
