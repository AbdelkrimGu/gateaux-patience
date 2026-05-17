import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

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

interface S3Config {
  client: S3Client;
  bucket: string;
  region: string;
}

let cachedConfig: S3Config | null = null;

function getConfig(): S3Config {
  if (cachedConfig) return cachedConfig;

  const region = process.env.S3_REGION || "eu-west-3";
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket) {
    throw new Error("S3_BUCKET is not set in env.");
  }
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY are not set in env.");
  }

  cachedConfig = {
    client: new S3Client({ region, credentials: { accessKeyId, secretAccessKey } }),
    bucket,
    region,
  };
  return cachedConfig;
}

export function isAllowedContentType(contentType: string): boolean {
  return ALLOWED_CONTENT_TYPES.has(contentType.toLowerCase());
}

export function buildPublicUrl(key: string): string {
  const { bucket, region } = getConfig();
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export function extractKeyFromUrl(url: string): string | null {
  // Avoid touching env in this helper so it stays safe to call from build-time
  // contexts. Fall back to a regex match if config isn't initialized.
  const m = url.match(/^https?:\/\/([^/.]+)\.s3\.[^/]+\.amazonaws\.com\/(.+)$/);
  return m ? m[2] : null;
}

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresAt: number;
}

export async function getPresignedUploadUrl(opts: {
  id: string;
  scope?: string;
  contentType: string;
  contentLength?: number;
}): Promise<PresignedUpload> {
  const { id, scope = "cakes", contentType, contentLength } = opts;
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

  const { client, bucket } = getConfig();
  const ext = EXTENSION_BY_TYPE[ct] || "bin";
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "misc";
  const safeScope = scope.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32) || "cakes";
  const key = `${safeScope}/${safeId}/${randomUUID()}.${ext}`;
  const expiresInSeconds = 300;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: ct,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

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
    const { client, bucket } = getConfig();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error(`[s3] delete failed for key=${key}:`, err);
  }
}

export async function deleteS3Objects(keysOrUrls: string[]): Promise<void> {
  const keys = keysOrUrls
    .map((k) => (k.startsWith("http") ? extractKeyFromUrl(k) : k))
    .filter((k): k is string => Boolean(k));
  if (keys.length === 0) return;

  let config: S3Config;
  try {
    config = getConfig();
  } catch (err) {
    console.error("[s3] batch delete skipped — config error:", err);
    return;
  }

  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    try {
      await config.client.send(
        new DeleteObjectsCommand({
          Bucket: config.bucket,
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
        })
      );
    } catch (err) {
      console.error("[s3] batch delete failed:", err);
    }
  }
}
