import "server-only";
import {
  BatchGetCommand,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
  type TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { badRequest } from "../errors";
import { ddb, keys, now, strip, TABLE } from "./table";

export type ItemType = "folder" | "file";
export type ItemStatus = "UPLOADING" | "ACTIVE" | "TRASHED";

export type Item = {
  id: string;
  type: ItemType;
  name: string;
  nameLower: string;
  parentId: string | null;
  rootId: string;
  path: string; // "/root/a/b/<id>/"
  ownerId: string;
  createdBy: string;
  size: number;
  mimeType?: string;
  s3Key?: string;
  status: ItemStatus;
  trashRootId?: string;
  trashedAt?: string;
  trashedBy?: string;
  sharedCount?: number;
  linkToken?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  uploadId?: string;
};

export const listingSortKey = (type: ItemType, nameLower: string) => `${type === "folder" ? 0 : 1}#${nameLower}`;
export const pathIds = (path: string) => path.split("/").filter(Boolean);

export function validateName(raw: string) {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) throw badRequest("Enter a name.");
  if (name.length > 200) throw badRequest("Names can be at most 200 characters.");
  if (/[\\/]/.test(name)) throw badRequest("Names can't contain / or \\.");
  if (name === "." || name === "..") throw badRequest("That name isn't allowed.");
  return name;
}

export async function getItem(id: string): Promise<Item | null> {
  const res = await ddb().send(new GetCommand({ TableName: TABLE(), Key: keys.item(id) }));
  return res.Item ? (strip(res.Item) as Item) : null;
}

export async function getItems(ids: string[]): Promise<Map<string, Item>> {
  const out = new Map<string, Item>();
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 100) {
    let request: Record<string, { Keys: Record<string, string>[] }> | undefined = {
      [TABLE()]: { Keys: unique.slice(i, i + 100).map((id) => keys.item(id)) },
    };
    while (request && Object.keys(request).length) {
      const res = await ddb().send(new BatchGetCommand({ RequestItems: request }));
      for (const it of res.Responses?.[TABLE()] ?? []) out.set(it.id as string, strip(it) as Item);
      request = res.UnprocessedKeys as typeof request;
    }
  }
  return out;
}

export async function listChildren(folderId: string): Promise<Item[]> {
  const items: Item[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb().send(
      new QueryCommand({
        TableName: TABLE(),
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": `PARENT#${folderId}` },
        ExclusiveStartKey: start,
      }),
    );
    items.push(...(res.Items ?? []).map((i) => strip(i) as Item));
    start = res.LastEvaluatedKey;
  } while (start);
  return items.filter((i) => i.status === "ACTIVE");
}

// Every item below (and including) the given folder path in the same tree.
export async function listSubtree(rootId: string, path: string): Promise<Item[]> {
  const items: Item[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const res = await ddb().send(
      new QueryCommand({
        TableName: TABLE(),
        IndexName: "GSI3",
        KeyConditionExpression: "GSI3PK = :pk AND begins_with(GSI3SK, :path)",
        ExpressionAttributeValues: { ":pk": `ROOT#${rootId}`, ":path": path },
        ExclusiveStartKey: start,
      }),
    );
    items.push(...(res.Items ?? []).map((i) => strip(i) as Item));
    start = res.LastEvaluatedKey;
  } while (start);
  return items;
}

const isConditionFailure = (err: unknown) =>
  (err as { name?: string }).name === "TransactionCanceledException" &&
  ((err as { CancellationReasons?: { Code?: string }[] }).CancellationReasons ?? []).some((r) => r.Code === "ConditionalCheckFailed");

function withSuffix(name: string, n: number) {
  if (n === 0) return name;
  const dot = name.lastIndexOf(".");
  return dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
}

// Runs a transaction that claims a unique name in `parentId`. With autoRename,
// clashes become "name (1).ext", "name (2).ext"… otherwise a clash throws.
export async function withUniqueName(
  parentId: string,
  name: string,
  build: (name: string) => NonNullable<TransactWriteCommandInput["TransactItems"]>,
  { autoRename, releaseOld }: { autoRename: boolean; releaseOld?: { parentId: string; nameLower: string } },
): Promise<string> {
  for (let n = 0; n < 100; n++) {
    const candidate = withSuffix(name, n);
    const lock = keys.nameLock(parentId, candidate.toLowerCase());
    const sameLock = releaseOld && releaseOld.parentId === parentId && releaseOld.nameLower === candidate.toLowerCase();
    const items: NonNullable<TransactWriteCommandInput["TransactItems"]> = [
      ...(sameLock ? [] : [{ Put: { TableName: TABLE(), Item: { ...lock }, ConditionExpression: "attribute_not_exists(PK)" } }]),
      ...(releaseOld && !sameLock
        ? [{ Delete: { TableName: TABLE(), Key: keys.nameLock(releaseOld.parentId, releaseOld.nameLower) } }]
        : []),
      ...build(candidate),
    ];
    try {
      await ddb().send(new TransactWriteCommand({ TransactItems: items }));
      return candidate;
    } catch (err) {
      if (!isConditionFailure(err)) throw err;
      if (!autoRename) throw badRequest("An item with this name already exists in this folder. Choose a different name.", "name_taken");
    }
  }
  throw badRequest("Couldn't find a free name for this item.");
}

export async function releaseName(parentId: string | null, nameLower: string) {
  if (!parentId) return;
  await ddb().send(
    new TransactWriteCommand({ TransactItems: [{ Delete: { TableName: TABLE(), Key: keys.nameLock(parentId, nameLower) } }] }),
  );
}

export function itemRecord(item: Item) {
  return {
    ...keys.item(item.id),
    ...(item.status === "ACTIVE" && item.parentId
      ? { GSI1PK: `PARENT#${item.parentId}`, GSI1SK: listingSortKey(item.type, item.nameLower) }
      : {}),
    GSI3PK: `ROOT#${item.rootId}`,
    GSI3SK: item.path,
    ...item,
  };
}

export async function setItemFields(id: string, set: Record<string, unknown>, remove: string[] = []) {
  const entries = Object.entries(set);
  const parts = [];
  if (entries.length) parts.push("SET " + entries.map(([k]) => `#${k} = :${k}`).join(", "));
  if (remove.length) parts.push("REMOVE " + remove.map((k) => `#${k}`).join(", "));
  await ddb().send(
    new UpdateCommand({
      TableName: TABLE(),
      Key: keys.item(id),
      UpdateExpression: parts.join(" "),
      ExpressionAttributeNames: Object.fromEntries([...entries.map(([k]) => k), ...remove].map((k) => [`#${k}`, k])),
      ExpressionAttributeValues: entries.length ? Object.fromEntries(entries.map(([k, v]) => [`:${k}`, v])) : undefined,
    }),
  );
}

export { now };
