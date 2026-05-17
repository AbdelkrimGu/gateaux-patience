import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const region = process.env.AWS_REGION || "eu-west-3";
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucket) {
  throw new Error("S3_BUCKET is not set in env.");
}
if (!accessKeyId || !secretAccessKey) {
  throw new Error("AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are not set in env.");
}

export const s3Client = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

export const s3Bucket = bucket;
export const s3Region = region;
export const MAX_UPLOAD_BYTES = Number(process.env.S3_MAX_UPLOAD_BYTES) || 100 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export function isAllowedContentType(contentType: string): boolean {
  return ALLOWED_CONTENT_TYPES.has(contentType.toLowerCase());
}

export function buildPublicUrl(key: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export function extractKeyFromUrl(url: string): string | null {
  const hostFragment = `${bucket}.s3.${region}.amazonaws.com/`;
  const idx = url.indexOf(hostFragment);
  if (idx === -1) return null;
  return url.slice(idx + hostFragment.length);
}

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresAt: number;
}

export async function getPresignedUploadUrl(opts: {
  cakeId: string;
  contentType: string;
  contentLength?: number;
}): Promise<PresignedUpload> {
  const { cakeId, contentType, contentLength } = opts;
  const ct = contentType.toLowerCase();

  if (!isAllowedContentType(ct)) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }
  if (
    MAX_UPLOAD_BYTES > 0 &&
    typeof contentLength === "number" &&
    contentLength > MAX_UPLOAD_BYTES
  ) {
    throw new Error(
      `File exceeds max size (${(contentLength / 1024 / 1024).toFixed(1)}MB > ${(
        MAX_UPLOAD_BYTES /
        1024 /
        1024
      ).toFixed(0)}MB)`
    );
  }

  const ext = EXTENSION_BY_TYPE[ct] || "bin";
  const safeCakeId = cakeId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "misc";
  const key = `cakes/${safeCakeId}/${randomUUID()}.${ext}`;

  const expiresInSeconds = 300;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: ct,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

  return {
    uploadUrl,
    publicUrl: buildPublicUrl(key),
    key,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
}

export async function deleteS3Object(keyOrUrl: string): Promise<void> {
  const key = keyOrUrl.startsWith("http") ? extractKeyFromUrl(keyOrUrl) : keyOrUrl;
  if (!key) return;
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error(`[s3] delete failed for key=${key}:`, err);
  }
}

export async function deleteS3Objects(keysOrUrls: string[]): Promise<void> {
  const keys = keysOrUrls
    .map((k) => (k.startsWith("http") ? extractKeyFromUrl(k) : k))
    .filter((k): k is string => Boolean(k));
  if (keys.length === 0) return;

  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    try {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
        })
      );
    } catch (err) {
      console.error("[s3] batch delete failed:", err);
    }
  }
}
