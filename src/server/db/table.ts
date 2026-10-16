import "server-only";
import { aws } from "../aws";
import { config } from "../config";

export const ddb = () => aws().ddb;
export const TABLE = () => config().TABLE_NAME;

export const now = () => new Date().toISOString();
export const epochSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

// Key builders — see docs/architecture.md §5.
export const keys = {
  workspace: (id: string) => ({ PK: `WS#${id}`, SK: "META" }),
  member: (workspaceId: string, userId: string) => ({ PK: `WS#${workspaceId}`, SK: `MEMBER#${userId}` }),
  user: (id: string) => ({ PK: `USER#${id}`, SK: "PROFILE" }),
  invite: (hash: string) => ({ PK: `INVITE#${hash}`, SK: "META" }),
  item: (id: string) => ({ PK: `ITEM#${id}`, SK: "META" }),
  nameLock: (parentId: string, nameLower: string) => ({ PK: `ITEM#${parentId}`, SK: `NAME#${nameLower}` }),
  share: (itemId: string, userId: string) => ({ PK: `ITEM#${itemId}`, SK: `SHARE#${userId}` }),
  linkPointer: (itemId: string) => ({ PK: `ITEM#${itemId}`, SK: "LINK" }),
  link: (token: string) => ({ PK: `LINK#${token}`, SK: "META" }),
  star: (userId: string, itemId: string) => ({ PK: `USER#${userId}`, SK: `STAR#${itemId}` }),
  recent: (userId: string, itemId: string) => ({ PK: `USER#${userId}`, SK: `RECENT#${itemId}` }),
};

// Strips key/index attributes before returning records to callers.
export function strip<T extends Record<string, unknown>>(record: T) {
  const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, GSI3PK, GSI3SK, ...rest } = record;
  void PK; void SK; void GSI1PK; void GSI1SK; void GSI2PK; void GSI2SK; void GSI3PK; void GSI3SK;
  return rest;
}
