import { expect, test } from "@playwright/test";

test.describe("display & accessibility preferences", () => {
  test("theme toggle persists across reloads and is applied before hydration", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/\bdark\b/);

    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(html).toHaveClass(/\bdark\b/);

    // With JavaScript bundles blocked, only the inline <head> script can apply
    // the stored theme, which proves there's no light-then-dark flash.
    await page.route(/\/_next\/static\/.*\.js/, (route) => route.abort());
    await page.reload();
    await expect(html).toHaveClass(/\bdark\b/);
  });

  test("follows the system theme by default", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  });

  test("accessibility menu options apply and reset", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Accessibility and display settings" })
      .click();
    const menu = page.getByRole("dialog");

    await menu.getByRole("radio", { name: "Larger" }).click();
    await menu.getByRole("switch", { name: "High contrast" }).click();
    await menu.getByRole("switch", { name: "Hyperlegible font" }).click();
    await menu.getByRole("switch", { name: "Underline links" }).click();
    await menu.getByRole("switch", { name: "Wider text spacing" }).click();

    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-text", "xl");
    await expect(html).toHaveAttribute("data-contrast", "more");
    await expect(html).toHaveAttribute("data-font", "hyperlegible");
    await expect(html).toHaveAttribute("data-links", "underline");
    await expect(html).toHaveAttribute("data-spacing", "wide");
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).fontSize,
      ),
    ).toBe("20px");

    await page.reload();
    await expect(html).toHaveAttribute("data-contrast", "more");

    await page
      .getByRole("button", { name: "Accessibility and display settings" })
      .click();
    await page.getByRole("button", { name: "Reset to defaults" }).click();
    await expect(html).not.toHaveAttribute("data-text");
    await expect(html).not.toHaveAttribute("data-contrast");
    await expect(html).not.toHaveAttribute("data-font");
  });

  test("respects the OS reduced-motion setting", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const duration = await page
      .locator("section.animate-fade-up")
      .first()
      .evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.01);
  });
});
