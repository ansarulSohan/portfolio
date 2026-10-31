import { expect, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./env";

/** Sign in as the e2e test admin (exists only in the throwaway e2e database). */
export async function signIn(page: Page, next = "/admin") {
  await page.goto(
    `/admin/login${next === "/admin" ? "" : `?next=${encodeURIComponent(next)}`}`,
  );
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[?]/g, "\\?")}$`));
}

/** Wait for the toast a server action shows when it finishes. */
export async function expectToast(page: Page, text: string | RegExp) {
  await expect(
    page.locator("[data-sonner-toast]").filter({ hasText: text }).first(),
  ).toBeVisible();
}
