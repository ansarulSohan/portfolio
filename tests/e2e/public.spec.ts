import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("home page shows the seeded content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/G\.M\. Ansarul Kabir/);
    await expect(
      page.getByRole("heading", { level: 1, name: "G.M. Ansarul Kabir" }),
    ).toBeVisible();
    for (const name of [
      "About",
      "Projects",
      "Experience",
      "Skills",
      "Education",
      "Get in touch",
    ]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    await expect(
      page.getByText("Simula Research Laboratory").first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "MovieDex", exact: true }),
    ).toBeVisible();
  });

  test("skip link moves focus to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("projects list links to a project page", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("link", { name: "MovieDex", exact: true }).click();
    await expect(page).toHaveURL(/\/projects\/moviedex$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "MovieDex" }),
    ).toBeVisible();
    await expect(page.getByText("Built with")).toBeVisible();
  });

  test("unknown pages show the 404 page and stay out of search", async ({
    page,
  }) => {
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();

    await page.goto("/projects/does-not-exist");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await expect(
      page.locator('meta[name="robots"][content*="noindex"]').first(),
    ).toBeAttached();
  });

  test("mobile menu opens and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/projects");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name: "Experience" }).click();
    await expect(page).toHaveURL(/\/#experience$/);
    await expect(dialog).toBeHidden();
    // No sideways scrolling on a phone.
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("sitemap, robots and health", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/projects/moviedex");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/admin/);
    const health = await request.get("/api/health");
    expect(health.status()).toBe(200);
    expect(await health.json()).toEqual({ status: "ok", db: "up" });
  });
});
