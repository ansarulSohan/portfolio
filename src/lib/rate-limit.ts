import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { connectDB } from "./db";
import { RateLimit } from "@/models/RateLimit";

/**
 * The client IP from the reverse proxy (Coolify's Traefik sets X-Forwarded-For;
 * the left-most entry is the original client). Falls back to "unknown".
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/** Salted so stored hashes can't be reversed by hashing every IPv4 address. */
export function hashIp(ip: string): string {
  const salt = process.env.AUTH_SECRET ?? "";
  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Fixed-window limiter: allows `limit` hits per `windowMs` for `key`.
 * Atomic (one upsert), so concurrent requests can't slip past the limit.
 */
export async function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  await connectDB();
  const now = Date.now();
  const doc = await RateLimit.findOneAndUpdate(
    { key, expiresAt: { $gt: new Date(now) } },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(now + windowMs) },
    },
    { upsert: true, returnDocument: "after" },
  ).catch(async (error: unknown) => {
    // Duplicate key: either a concurrent request just created this window, or an
    // expired window hasn't been removed by the TTL monitor yet (it runs ~60s).
    if ((error as { code?: number }).code !== 11000) throw error;
    const live = await RateLimit.findOneAndUpdate(
      { key, expiresAt: { $gt: new Date(now) } },
      { $inc: { count: 1 } },
      { returnDocument: "after" },
    );
    return (
      live ??
      RateLimit.findOneAndUpdate(
        { key },
        { $set: { count: 1, expiresAt: new Date(now + windowMs) } },
        { returnDocument: "after" },
      )
    );
  });
  const count = doc?.count ?? 1;
  const expiresAt = doc?.expiresAt?.getTime() ?? now + windowMs;
  return {
    allowed: count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((expiresAt - now) / 1000)),
  };
}
