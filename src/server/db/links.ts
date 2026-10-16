import "server-only";
import { DeleteCommand, GetCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomToken } from "../ids";
import { ddb, epochSeconds, keys, now, TABLE } from "./table";

export type PublicLink = {
  token: string;
  workspaceId?: string;
  itemId: string;
  createdBy: string;
  allowDownload: boolean;
  passwordHash?: string;
  expiresAt?: number; // epoch seconds; also the TTL attribute
  failedAttempts?: number;
  lockedUntil?: number;
  // Set when the link is disabled for abuse (automatically or by a platform admin).
  suspendedAt?: string;
  suspendedReason?: string;
  createdAt: string;
};

export async function getLink(token: string): Promise<PublicLink | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.link(token) }));
  if (!res.Item) return null;
  const { PK, SK, ...link } = res.Item;
  void PK; void SK;
  return link as PublicLink;
}

export const isExpired = (link: PublicLink) => !!link.expiresAt && link.expiresAt <= epochSeconds(new Date());

export async function getLinkForItem(itemId: string): Promise<PublicLink | null> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.linkPointer(itemId) }));
  return res.Item ? getLink(res.Item.token as string) : null;
}

export async function createLink(input: Omit<PublicLink, "token" | "createdAt">) {
  const link: PublicLink = { ...input, token: randomToken(16), createdAt: now() };
  await ddb().send(
    new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: TABLE(), Item: { ...keys.link(link.token), ...link }, ConditionExpression: "attribute_not_exists(PK)" } },
        { Put: { TableName: TABLE(), Item: { ...keys.linkPointer(link.itemId), token: link.token } } },
        {
          Update: {
            TableName: TABLE(),
            Key: keys.item(link.itemId),
            UpdateExpression: "SET linkToken = :t",
            ConditionExpression: "attribute_exists(PK)",
            ExpressionAttributeValues: { ":t": link.token },
          },
        },
      ],
    }),
  );
  return link;
}

export async function updateLink(token: string, fields: { allowDownload: boolean; passwordHash?: string | null; expiresAt?: number | null }) {
  const set = ["allowDownload = :d", "failedAttempts = :zero"];
  const remove = ["lockedUntil"];
  const values: Record<string, unknown> = { ":d": fields.allowDownload, ":zero": 0 };
  if (fields.passwordHash === null) remove.push("passwordHash");
  else if (fields.passwordHash !== undefined) {
    set.push("passwordHash = :p");
    values[":p"] = fields.passwordHash;
  }
  if (fields.expiresAt === null) remove.push("expiresAt");
  else if (fields.expiresAt !== undefined) {
    set.push("expiresAt = :e");
    values[":e"] = fields.expiresAt;
  }
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.link(token),
      UpdateExpression: `SET ${set.join(", ")} REMOVE ${remove.join(", ")}`,
      ExpressionAttributeValues: values,
    }),
  );
}

export async function deleteLink(link: PublicLink) {
  await ddb().send(new DeleteCommand({ TableName: TABLE(), Key: keys.link(link.token) }));
  await ddb().send(new DeleteCommand({ TableName: TABLE(), Key: keys.linkPointer(link.itemId) }));
  await ddb()
    .send(
      new UpdateCommand({
        TableName: TABLE(),
        Key: keys.item(link.itemId),
        UpdateExpression: "REMOVE linkToken",
        ConditionExpression: "attribute_exists(PK)",
      }),
    )
    .catch(() => {});
}

const MAX_ATTEMPTS = 10;
const LOCK_SECONDS = 15 * 60;

export async function recordFailedAttempt(link: PublicLink) {
  const attempts = (link.failedAttempts ?? 0) + 1;
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.link(link.token),
      UpdateExpression: attempts >= MAX_ATTEMPTS ? "SET failedAttempts = :zero, lockedUntil = :until" : "SET failedAttempts = :n",
      ExpressionAttributeValues:
        attempts >= MAX_ATTEMPTS ? { ":zero": 0, ":until": epochSeconds(new Date()) + LOCK_SECONDS } : { ":n": attempts },
    }),
  );
  return attempts >= MAX_ATTEMPTS;
}

export const isLocked = (link: PublicLink) => !!link.lockedUntil && link.lockedUntil > epochSeconds(new Date());

export async function setLinkSuspended(token: string, reason: string | null) {
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.link(token),
      UpdateExpression: reason ? "SET suspendedAt = :at, suspendedReason = :r" : "REMOVE suspendedAt, suspendedReason",
      ConditionExpression: "attribute_exists(PK)",
      ExpressionAttributeValues: reason ? { ":at": now(), ":r": reason } : undefined,
    }),
  );
}
