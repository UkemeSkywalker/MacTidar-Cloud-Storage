import "server-only";
import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomToken, sha256 } from "../ids";
import { ddb, epochSeconds, keys, now, strip, TABLE } from "./table";
import type { Role } from "./users";

export type Invite = {
  workspaceId: string;
  id: string; // sha256 of the token; the token itself is never stored
  email: string;
  role: Role;
  invitedBy: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: number; // epoch seconds (TTL)
};

const INVITE_DAYS = 7;

export async function createInvite(input: { workspaceId: string; email: string; role: Role; invitedBy: string; invitedByName: string }) {
  const token = randomToken();
  const invite: Invite = {
    id: sha256(token),
    workspaceId: input.workspaceId,
    email: input.email.toLowerCase(),
    role: input.role,
    invitedBy: input.invitedBy,
    invitedByName: input.invitedByName,
    createdAt: now(),
    expiresAt: epochSeconds(new Date(Date.now() + INVITE_DAYS * 86400_000)),
  };
  await ddb().send(
    new PutCommand({
      TableName: TABLE(),
      Item: { ...keys.invite(invite.id), GSI1PK: `INVITES#${invite.workspaceId}`, GSI1SK: invite.createdAt, ...invite },
    }),
  );
  return { invite, token };
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
  return getInvite(sha256(token));
}

export async function getInvite(id: string): Promise<Invite | null> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.invite(id) }));
  const invite = res.Item ? (strip(res.Item) as Invite) : null;
  // TTL deletion can lag, so check expiry explicitly.
  if (!invite || invite.expiresAt < epochSeconds(new Date())) return null;
  return invite;
}

export async function listInvites(workspaceId: string): Promise<Invite[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: { ":pk": `INVITES#${workspaceId}` },
      ScanIndexForward: false,
    }),
  );
  const nowS = epochSeconds(new Date());
  return (res.Items ?? []).map((i) => strip(i) as Invite).filter((i) => i.expiresAt >= nowS);
}

export async function deleteInvite(id: string) {
  await ddb().send(new DeleteCommand({ TableName: TABLE(), Key: keys.invite(id) }));
}
