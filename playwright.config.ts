import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, E2E_PORT, e2eEnv } from "./tests/e2e/env";

/*
 * End-to-end tests against a production build on port 3200, using the
 * separate portfolio_e2e database (seeded first, dropped after). Run with
 * `pnpm test:e2e`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // Tests share one database, and the admin specs change content, so run serially.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: E2E_BASE_URL,
    // Animations off: stable screenshots, and axe doesn't measure mid-fade colours.
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Seed a fresh copy of the content + test admin, then build and serve.
    command: `pnpm seed --force && pnpm build && pnpm start -p ${E2E_PORT}`,
    url: `${E2E_BASE_URL}/api/health`,
    env: e2eEnv(),
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
