import "server-only";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UPLOAD_PREFIX, UPLOAD_RULES, type UploadKind } from "./uploads";

/*
 * S3-compatible storage (Cloudflare R2, AWS S3, MinIO). Browsers upload
 * straight to the bucket with short-lived presigned PUT URLs; the server only
 * signs, verifies and deletes. Objects are served from S3_PUBLIC_URL.
 */

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. See .env.example.`);
  return value;
}

let client: S3Client | null = null;

function s3(): S3Client {
  client ??= new S3Client({
    // Cloudflare shows the S3 API address with the bucket appended
    // (https://<account>.r2.cloudflarestorage.com/<bucket>). The SDK adds the
    // bucket itself, so keep only the origin to avoid /<bucket>/<bucket>/… keys.
    endpoint: new URL(env("S3_ENDPOINT")).origin,
    region: process.env.S3_REGION || "auto",
    credentials: {
      accessKeyId: env("S3_ACCESS_KEY_ID"),
      secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
    },
    // Recent SDKs add CRC32 checksum headers to every PutObject by default.
    // Browsers can't compute them for presigned uploads, and R2 rejects the
    // mismatch, so only send checksums when an operation requires them.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

/** Public URL for an object key, e.g. https://cdn.example.com/uploads/project/…png */
export function publicUrl(key: string): string {
  return `${env("S3_PUBLIC_URL").replace(/\/+$/, "")}/${key}`;
}

/** True if this key/url pair was created by this app (not an arbitrary URL). */
export function isOwnUpload(key: string, url: string): boolean {
  return (
    key.startsWith(UPLOAD_PREFIX) &&
    !key.includes("..") &&
    url === publicUrl(key)
  );
}

/** A random, unguessable key: uploads/<kind>/<uuid>.<ext> */
export function newKey(kind: UploadKind, contentType: string): string {
  const ext = UPLOAD_RULES[kind].types[contentType];
  return `${UPLOAD_PREFIX}${kind}/${randomUUID()}.${ext}`;
}

/**
 * Presigned PUT valid for 5 minutes. Content-Type and Content-Length are part
 * of the signature (signableHeaders), so the bucket rejects an upload with a
 * different type or size than the one the server approved.
 */
export async function presignUpload(
  key: string,
  contentType: string,
  size: number,
): Promise<string> {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: env("S3_BUCKET"),
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    }),
    {
      expiresIn: 300,
      signableHeaders: new Set(["content-type", "content-length"]),
    },
  );
}

/** Size and type of an uploaded object, or null if it doesn't exist. */
export async function headObject(
  key: string,
): Promise<{ size: number; contentType: string } | null> {
  try {
    const head = await s3().send(
      new HeadObjectCommand({ Bucket: env("S3_BUCKET"), Key: key }),
    );
    return {
      size: head.ContentLength ?? 0,
      contentType: head.ContentType ?? "",
    };
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (status === 404 || status === 403) return null;
    throw error;
  }
}

/** Best effort: a leftover object costs a little storage, never correctness. */
export async function deleteObject(
  key: string | undefined | null,
): Promise<void> {
  if (!key || !key.startsWith(UPLOAD_PREFIX)) return;
  try {
    await s3().send(
      new DeleteObjectCommand({ Bucket: env("S3_BUCKET"), Key: key }),
    );
  } catch (error) {
    console.error(`Failed to delete ${key} from the bucket`, error);
  }
}
