import "server-only";
import { DeleteCommand, GetCommand, PutCommand, QueryCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomToken } from "../ids";
import { ddb, epochSeconds, now, strip, TABLE } from "./table";

// An item shared with someone outside its workspace, by email. The share lives
// at GSHARE#<token> (the token is in the emailed link) with a pointer in the
// item's partition, so deleting the item cleans it up.
export type GuestShare = {
  token: string;
  itemId: string;
  workspaceId: string;
  email: string;
  role: "VIEWER";
  sharedBy: string;
  createdAt: string;
};

const shareKey = (token: string) => ({ PK: `GSHARE#${token}`, SK: "META" });
const pointerKey = (itemId: string, email: string) => ({ PK: `ITEM#${itemId}`, SK: `GUEST#${email}` });
const codeKey = (email: string) => ({ PK: `GCODE#${email}`, SK: "META" });

export async function getGuestShare(token: string): Promise<GuestShare | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: shareKey(token) }));
  return res.Item ? (strip(res.Item) as GuestShare) : null;
}

export async function getGuestShareFor(itemId: string, email: string): Promise<GuestShare | null> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: pointerKey(itemId, email) }));
  return res.Item ? getGuestShare(res.Item.token as string) : null;
}

export async function listGuestShares(itemId: string): Promise<{ email: string; token: string; sharedBy: string; createdAt: string }[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: TABLE(),
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :g)",
      ExpressionAttributeValues: { ":pk": `ITEM#${itemId}`, ":g": "GUEST#" },
    }),
  );
  return (res.Items ?? []).map((r) => ({ email: r.email, token: r.token, sharedBy: r.sharedBy, createdAt: r.createdAt }));
}

export async function createGuestShare(input: Omit<GuestShare, "token" | "createdAt" | "role">): Promise<GuestShare> {
  const share: GuestShare = { ...input, role: "VIEWER", token: randomToken(24), createdAt: now() };
  await ddb().send(
    new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: TABLE(), Item: { ...shareKey(share.token), GSI1PK: `GUEST#${share.email}`, GSI1SK: share.createdAt, ...share }, ConditionExpression: "attribute_not_exists(PK)" } },
        {
          Put: {
            TableName: TABLE(),
            Item: { ...pointerKey(share.itemId, share.email), token: share.token, email: share.email, sharedBy: share.sharedBy, createdAt: share.createdAt },
            ConditionExpression: "attribute_not_exists(PK)",
          },
        },
      ],
    }),
  );
  return share;
}

export async function deleteGuestShare(itemId: string, email: string) {
  const pointer = await ddb().send(new GetCommand({ TableName: TABLE(), Key: pointerKey(itemId, email) }));
  if (!pointer.Item) return;
  await ddb().send(
    new TransactWriteCommand({
      TransactItems: [
        { Delete: { TableName: TABLE(), Key: pointerKey(itemId, email) } },
        { Delete: { TableName: TABLE(), Key: shareKey(pointer.Item.token as string) } },
      ],
    }),
  );
}

export const guestShareKey = shareKey;

// One-time codes, one live code per email. 10-minute TTL; 5 attempts.
export async function saveGuestCode(email: string, codeHash: string) {
  await ddb().send(
    new PutCommand({
      TableName: TABLE(),
      Item: { ...codeKey(email), codeHash, attempts: 0, sentAt: now(), expiresAt: epochSeconds(new Date(Date.now() + 10 * 60_000)) },
    }),
  );
}

export async function getGuestCode(email: string) {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: codeKey(email) }));
  const c = res.Item as { codeHash: string; attempts: number; sentAt: string; expiresAt: number } | undefined;
  return c && c.expiresAt > epochSeconds(new Date()) ? c : null;
}

export async function countGuestCodeAttempt(email: string) {
  await ddb().send(new UpdateCommand({ TableName: TABLE(), Key: codeKey(email), UpdateExpression: "ADD attempts :one", ExpressionAttributeValues: { ":one": 1 } }));
}

export async function clearGuestCode(email: string) {
  await ddb().send(new DeleteCommand({ TableName: TABLE(), Key: codeKey(email) }));
}

