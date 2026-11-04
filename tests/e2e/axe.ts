import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/** Colour modes every public page is checked in, and the prefs that select them. */
export const MODES = {
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

export async function serious(page: Page) {
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

/** Apply a mode before the page loads. */
export async function useMode(page: Page, mode: keyof typeof MODES) {
  const { colorScheme, prefs } = MODES[mode];
  await page.emulateMedia({ colorScheme });
  await page.addInitScript((value) => {
    localStorage.setItem("prefs:v1", JSON.stringify(value));
  }, prefs);
}
