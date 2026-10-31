/**
 * Environment for end-to-end runs. Tests never touch the real content:
 * the app and seed script point at a separate `portfolio_e2e` database on the
 * same cluster, which global-teardown.ts drops afterwards.
 *
 * The admin credentials and session secret below are test-only values for
 * that throwaway database.
 */
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export const E2E_PORT = 3200;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const E2E_DB_NAME = "portfolio_e2e";

export const E2E_ADMIN = {
  email: "e2e-admin@example.test",
  password: "e2e-only-password-not-real-123",
};

/** MONGODB_URI with its database swapped for the e2e one. */
export function e2eMongoUri(): string {
  const source = process.env.E2E_MONGODB_URI ?? process.env.MONGODB_URI;
  if (!source)
    throw new Error("Set MONGODB_URI (or E2E_MONGODB_URI) to run e2e tests.");
  const url = new URL(source);
  url.pathname = `/${E2E_DB_NAME}`;
  return url.toString();
}

/** Variables passed to the seed script and the app server. */
export function e2eEnv(): Record<string, string> {
  return {
    MONGODB_URI: e2eMongoUri(),
    ADMIN_EMAIL: E2E_ADMIN.email,
    ADMIN_PASSWORD: E2E_ADMIN.password,
    AUTH_SECRET: "e2e-only-session-secret-0123456789abcdef",
    NEXT_PUBLIC_SITE_URL: E2E_BASE_URL,
  };
}
