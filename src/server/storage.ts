import "server-only";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { aws } from "./aws";
import { config } from "./config";

const bucket = () => config().FILES_BUCKET;
export const PART_SIZE = 16 * 1024 * 1024;
const UPLOAD_URL_TTL = 60 * 60;
const DOWNLOAD_URL_TTL = 5 * 60;

export const fileKey = (itemId: string) => `files/${itemId}`;

export async function presignSinglePut(key: string, contentType: string) {
  return getSignedUrl(aws().s3, new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), {
    expiresIn: UPLOAD_URL_TTL,
  });
}

export async function startMultipart(key: string, contentType: string, size: number) {
  const res = await aws().s3.send(new CreateMultipartUploadCommand({ Bucket: bucket(), Key: key, ContentType: contentType }));
  const uploadId = res.UploadId!;
  const count = Math.ceil(size / PART_SIZE);
  const parts = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      getSignedUrl(aws().s3, new UploadPartCommand({ Bucket: bucket(), Key: key, UploadId: uploadId, PartNumber: i + 1 }), {
        expiresIn: UPLOAD_URL_TTL,
      }).then((url) => ({ partNumber: i + 1, url })),
    ),
  );
  return { uploadId, parts };
}

export async function completeMultipart(key: string, uploadId: string, parts: { partNumber: number; etag: string }[]) {
  await aws().s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts.sort((a, b) => a.partNumber - b.partNumber).map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })) },
    }),
  );
}

export async function abortMultipart(key: string, uploadId: string) {
  await aws().s3.send(new AbortMultipartUploadCommand({ Bucket: bucket(), Key: key, UploadId: uploadId })).catch(() => {});
}

export async function objectSize(key: string): Promise<number | null> {
  try {
    const res = await aws().s3.send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return res.ContentLength ?? null;
  } catch {
    return null;
  }
}

export async function deleteObjects(keys: string[]) {
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    if (!batch.length) continue;
    await aws().s3.send(
      new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true } }),
    );
  }
}

// Short-lived download/preview URL with the real file name.
export async function presignGet(key: string, fileName: string, contentType: string | undefined, inline: boolean) {
  const encoded = encodeURIComponent(fileName).replace(/['()*]/g, (c) => "%" + c.charCodeAt(0).toString(16));
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  // Never render user HTML/SVG inline on a page: force those to download.
  const risky = !contentType || /html|svg|xml|javascript/i.test(contentType);
  const disposition = inline && !risky ? "inline" : "attachment";
  return getSignedUrl(
    aws().s3,
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ResponseContentDisposition: `${disposition}; filename="${ascii}"; filename*=UTF-8''${encoded}`,
      ResponseContentType: contentType || "application/octet-stream",
    }),
    { expiresIn: DOWNLOAD_URL_TTL },
  );
}
