/**
 * Signing and verifying the admin session token (a JWT in an httpOnly cookie).
 * No `server-only` or `next/headers` imports, so proxy.ts can use it too.
 */
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionClaims {
  /** Admin document id. */
  sub: string;
  /**
   * Admin.sessionVersion when the token was issued. Bumping the version
   * (password change, "sign out everywhere") invalidates older tokens.
   */
  v: number;
}

const ISSUER = "portfolio-admin";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to at least 32 characters (generate one with `openssl rand -base64 32`).",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ v: claims.v })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

/** The claims of a valid, unexpired token, or null for anything else. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string" || typeof payload.v !== "number") {
      return null;
    }
    return { sub: payload.sub, v: payload.v };
  } catch {
    return null;
  }
}
