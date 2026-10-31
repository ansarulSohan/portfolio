import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/*
 * Automated WCAG 2.2 A/AA checks with axe on the main public pages, in light,
 * dark and high-contrast modes. Fails on "serious" or "critical" issues.
 * (Automated checks catch roughly a third of issues; keyboard and screen
 * reader passes are still needed by hand.)
 */

const PAGES = [
  "/",
  "/projects",
  "/projects/moviedex",
  "/does-not-exist",
  "/admin/login",
];

const MODES = {
  light: { colorScheme: "light" as const, prefs: { theme: "light" } },
  dark: { colorScheme: "dark" as const, prefs: { theme: "dark" } },
  "high contrast": {
    colorScheme: "light" as const,
    prefs: { theme: "light", contrast: "on" },
  },
  "high contrast dark": {
    colorScheme: "dark" as const,
    prefs: { theme: "dark", contrast: "on" },
  },
};

async function serious(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
          .map((n) => n.target.join(" "))
          .slice(0, 5)
          .join("\n  ")}`,
    );
}

for (const [mode, { colorScheme, prefs }] of Object.entries(MODES)) {
  test.describe(`axe: ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.addInitScript((value) => {
        localStorage.setItem("prefs:v1", JSON.stringify(value));
      }, prefs);
    });

    for (const path of PAGES) {
      test(path, async ({ page }) => {
        await page.goto(path);
        // Wait for streamed content to replace the loading skeletons.
        await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
        expect(await serious(page)).toEqual([]);
      });
    }
  });
}

test("accessibility menu (open) has no serious issues", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Accessibility and display settings" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await serious(page)).toEqual([]);
});
