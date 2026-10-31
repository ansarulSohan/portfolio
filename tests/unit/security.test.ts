import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { contentSecurityPolicy } from "@/lib/csp";
import { signSessionToken, verifySessionToken } from "@/lib/session-token";

const SECRET = "test-secret-that-is-at-least-32-characters-long";

describe("session tokens", () => {
  beforeEach(() => vi.stubEnv("AUTH_SECRET", SECRET));
  afterEach(() => vi.unstubAllEnvs());

  it("round-trips the admin id and session version", async () => {
    const token = await signSessionToken({ sub: "abc", v: 3 });
    expect(await verifySessionToken(token)).toEqual({ sub: "abc", v: 3 });
  });

  it("rejects missing, garbage and tampered tokens", async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken("not.a.jwt")).toBeNull();
    const token = await signSessionToken({ sub: "abc", v: 0 });
    const [header, payload, signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: "someone-else", v: 0 }),
    ).toString("base64url");
    expect(
      await verifySessionToken(`${header}.${forgedPayload}.${signature}`),
    ).toBeNull();
    expect(
      await verifySessionToken(
        `${header}.${payload}.${signature.slice(0, -2)}xx`,
      ),
    ).toBeNull();
  });

  it("rejects tokens signed with another secret, expired, or from another issuer", async () => {
    const sign = (secret: string, issuer: string, exp: number) =>
      new SignJWT({ v: 0 })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("abc")
        .setIssuer(issuer)
        .setIssuedAt()
        .setExpirationTime(exp)
        .sign(new TextEncoder().encode(secret));
    const now = Math.floor(Date.now() / 1000);
    expect(
      await verifySessionToken(
        await sign("x".repeat(40), "portfolio-admin", now + 60),
      ),
    ).toBeNull();
    expect(
      await verifySessionToken(await sign(SECRET, "portfolio-admin", now - 60)),
    ).toBeNull();
    expect(
      await verifySessionToken(await sign(SECRET, "someone-else", now + 60)),
    ).toBeNull();
  });

  it("refuses to sign with a missing or short secret", async () => {
    vi.stubEnv("AUTH_SECRET", "short");
    await expect(signSessionToken({ sub: "abc", v: 0 })).rejects.toThrow(
      /AUTH_SECRET/,
    );
    expect(await verifySessionToken("anything")).toBeNull();
  });
});

describe("content security policy", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is strict in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "S3_ENDPOINT",
      "https://acct.r2.cloudflarestorage.com/portfolio",
    );
    const csp = contentSecurityPolicy();
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain(
      "connect-src 'self' https://acct.r2.cloudflarestorage.com https://*.acct.r2.cloudflarestorage.com",
    );
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("allows eval and websockets only in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const csp = contentSecurityPolicy();
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws:");
  });

  it("survives a missing or invalid bucket endpoint", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("S3_ENDPOINT", "not a url");
    expect(contentSecurityPolicy()).toContain("connect-src 'self';");
  });
});
