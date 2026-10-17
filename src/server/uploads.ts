import "server-only";
import { DeleteCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { getItem, itemRecord, releaseName, validateName, withUniqueName, type Item } from "./db/items";
import { ddb, keys, now, TABLE } from "./db/table";
import { getTeamSettings, releaseBytes, reserveBytes } from "./db/team";
import type { Viewer } from "./session";
import { badRequest, forbidden, HttpError, notFound } from "./errors";
import { newId } from "./ids";
import { formatBytes } from "@/lib/format";
import { requireAccess } from "./permissions";
import { newItemOwner } from "./files";
import { abortMultipart, completeMultipart, fileKey, objectSize, PART_SIZE, presignSinglePut, startMultipart } from "./storage";

export async function startUpload(user: Viewer, input: { parentId: string; name: string; size: number; type: string }) {
  const { item: parent } = await requireAccess(user, input.parentId, "EDITOR");
  if (parent.type !== "folder") throw badRequest("Uploads must go into a folder.");
  const name = validateName(input.name);
  const team = await getTeamSettings(parent.workspaceId);
  if (input.size > team.maxFileBytes) {
    throw new HttpError(413, `Exceeds the maximum file size (${formatBytes(team.maxFileBytes, 0)}).`, "too_large");
  }
  if (!(await reserveBytes(parent.workspaceId, input.size))) {
    throw new HttpError(413, `Not enough storage left (${formatBytes(Math.max(0, team.freeBytes))} free).`, "quota");
  }

  const id = newId();
  const key = fileKey(id);
  const type = input.type || "application/octet-stream";
  try {
    const multipart = input.size > PART_SIZE ? await startMultipart(key, type, input.size) : null;
    const at = now();
    const finalName = await withUniqueName(
      parent.id,
      name,
      (finalName) => {
        const item: Item = {
          id,
          workspaceId: parent.workspaceId,
          type: "file",
          name: finalName,
          nameLower: finalName.toLowerCase(),
          parentId: parent.id,
          rootId: parent.rootId,
          path: `${parent.path}${id}/`,
          ownerId: newItemOwner(user, parent),
          createdBy: user.id,
          size: input.size,
          mimeType: type,
          s3Key: key,
          status: "UPLOADING",
          createdAt: at,
          updatedAt: at,
          updatedBy: user.id,
          ...(multipart ? { uploadId: multipart.uploadId } : {}),
        };
        return [{ Put: { TableName: TABLE(), Item: { ...itemRecord(item), GSI2PK: "PENDING", GSI2SK: at } } }];
      },
      { autoRename: true },
    );
    return multipart
      ? { id, name: finalName, mode: "multipart" as const, partSize: PART_SIZE, parts: multipart.parts }
      : { id, name: finalName, mode: "single" as const, url: await presignSinglePut(key, type) };
  } catch (err) {
    await releaseBytes(parent.workspaceId, input.size);
    throw err;
  }
}

async function requirePending(user: Viewer, id: string) {
  const item = await getItem(id);
  if (!item || item.status !== "UPLOADING") throw notFound("This upload doesn't exist or already finished.");
  if (item.createdBy !== user.id) throw forbidden();
  return item;
}

export async function completeUpload(user: Viewer, id: string, parts?: { partNumber: number; etag: string }[]) {
  const item = await requirePending(user, id);
  if (item.uploadId) {
    if (!parts?.length) throw badRequest("Missing uploaded parts.");
    await completeMultipart(item.s3Key!, item.uploadId, parts);
  }
  const actual = await objectSize(item.s3Key!);
  if (actual !== item.size) {
    await cancelUpload(user, id);
    throw badRequest("The uploaded file didn't match the expected size. Please try again.");
  }
  const at = now();
  await ddb().send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: TABLE(),
            Key: keys.item(item.id),
            UpdateExpression: "SET #s = :active, GSI1PK = :pk, GSI1SK = :sk, updatedAt = :at REMOVE GSI2PK, GSI2SK, uploadId",
            ConditionExpression: "#s = :uploading",
            ExpressionAttributeNames: { "#s": "status" },
            ExpressionAttributeValues: {
              ":active": "ACTIVE",
              ":uploading": "UPLOADING",
              ":pk": `PARENT#${item.parentId}`,
              ":sk": `1#${item.nameLower}`,
              ":at": at,
            },
          },
        },
        {
          Update: {
            TableName: TABLE(),
            Key: keys.workspace(item.workspaceId),
            UpdateExpression: "SET usedBytes = usedBytes + :b",
            ExpressionAttributeValues: { ":b": item.size },
          },
        },
        {
          Update: {
            TableName: TABLE(),
            Key: keys.member(item.workspaceId, user.id),
            UpdateExpression: "SET usedBytes = if_not_exists(usedBytes, :zero) + :b",
            ExpressionAttributeValues: { ":b": item.size, ":zero": 0 },
          },
        },
      ],
    }),
  );
  return { ...item, status: "ACTIVE" as const };
}

// Cancels an unfinished upload and gives the reserved space back.
export async function cancelUpload(user: Viewer | null, id: string) {
  const item = user ? await requirePending(user, id) : await getItem(id);
  if (!item || item.status !== "UPLOADING") return;
  if (item.uploadId) await abortMultipart(item.s3Key!, item.uploadId);
  await ddb().send(new DeleteCommand({ TableName: TABLE(), Key: keys.item(item.id) }));
  await releaseName(item.parentId, item.nameLower);
  await releaseBytes(item.workspaceId, item.size);
}
