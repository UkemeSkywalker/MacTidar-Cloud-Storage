import { z } from "zod";
import { createWorkspace } from "@/server/db/workspaces";
import { route } from "@/server/errors";
import { inviteMember } from "@/server/invitations";
import { requireUser, setActiveWorkspace } from "@/server/session";

const body = z.object({
  name: z.string().trim().min(2, "Enter your company name.").max(60),
  invites: z.array(z.string().trim().toLowerCase().email("One of the email addresses isn't valid.")).max(20).default([]),
});

// Creates a company workspace with the caller as its admin.
export const POST = route(async (req) => {
  const user = await requireUser();
  const { name, invites } = body.parse(await req.json());
  const { workspace } = await createWorkspace({ name, type: "COMPANY", ownerId: user.id });
  const results = [];
  for (const email of [...new Set(invites)].filter((e) => e !== user.email)) {
    results.push(await inviteMember({ id: user.id, name: user.name }, workspace.id, { email, role: "MEMBER" }));
  }
  await setActiveWorkspace(workspace.id);
  return Response.json({ id: workspace.id, invites: results });
});
