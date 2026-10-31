import { expect, test } from "@playwright/test";

test.describe("security headers", () => {
  test("pages send a strict CSP and hardening headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    const csp = headers["content-security-policy"];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-eval");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("the browser enforces the CSP (connect-src blocks other hosts)", async ({
    page,
  }) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (/Content Security Policy/i.test(message.text()))
        violations.push(message.text());
    });
    await page.goto("/");
    // A normal page load must not trip the policy.
    expect(violations).toEqual([]);

    // Note: eval can't be tested here. Chrome exempts DevTools-injected code
    // (page.evaluate / addScriptTag) from 'unsafe-eval', so it always runs.
    // A network request to a host outside connect-src is checked normally.
    const result = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          document.addEventListener("securitypolicyviolation", (event) =>
            resolve(`blocked by ${event.effectiveDirective}`),
          );
          fetch("https://example.com/").then(
            () => resolve("allowed"),
            () =>
              setTimeout(() => resolve("failed without a CSP violation"), 500),
          );
        }),
    );
    expect(result).toBe("blocked by connect-src");
  });

  test("the site can't be framed by another origin", async ({ page }) => {
    await page.setContent(
      '<iframe id="f" src="http://localhost:3200/" width="400" height="300"></iframe>',
    );
    const frame = page.frame({ url: /localhost:3200/ });
    // A blocked frame never gets the site's document (no h1 inside it).
    const heading = frame
      ? await frame
          .locator("h1")
          .count()
          .catch(() => 0)
      : 0;
    expect(heading).toBe(0);
  });

  test("admin pages are not indexable or cacheable", async ({ request }) => {
    const response = await request.get("/admin/login");
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    expect(response.headers()["cache-control"]).toContain("no-store");
  });
});
