import { expect, test } from "@playwright/test";
import { E2E_ADMIN } from "./env";
import { expectToast, signIn } from "./helpers";

// One flow builds on the previous step (create → publish → edit → delete).
test.describe.configure({ mode: "serial" });

test.describe("admin", () => {
  test("rejects a wrong password with a generic message", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(E2E_ADMIN.email);
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("#login-error")).toHaveText(
      "Incorrect email or password.",
    );
    await expect(page.getByLabel("Password")).toBeFocused();
    await expect(page.getByLabel("Email")).toHaveValue(E2E_ADMIN.email);
  });

  test("protects admin pages and returns to the requested page after login", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fsettings$/);
    await page.getByLabel("Email").fill(E2E_ADMIN.email);
    await page.getByLabel("Password").fill(E2E_ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/settings$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Settings" }),
    ).toBeVisible();
  });

  test("create, publish, edit and delete a project; the public site follows", async ({
    page,
  }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Projects" }).first().click();
    await page.getByRole("link", { name: "New project" }).click();

    // Validation: saving empty shows field errors and focuses the first one.
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByLabel("Title")).toBeFocused();
    await expect(
      page.getByText("This field is required.").first(),
    ).toBeVisible();

    await page.getByLabel("Title").fill("E2E Test Project");
    await expect(page.getByLabel("URL")).toHaveValue("e2e-test-project");
    await page.getByLabel("Summary").fill("Created by the end-to-end tests.");
    await page.getByLabel("Built with").fill("Playwright");
    await page.getByLabel("Built with").press("Enter");
    await page.getByRole("switch", { name: "Published" }).click();
    await page.getByRole("button", { name: "Create project" }).click();
    await expectToast(page, "Project created.");
    await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f]{24}$/);
    const editUrl = page.url();

    // Public page exists right away (cache tags invalidated by the action).
    await page.goto("/projects/e2e-test-project");
    await expect(
      page.getByRole("heading", { level: 1, name: "E2E Test Project" }),
    ).toBeVisible();
    await expect(page.getByText("Playwright")).toBeVisible();

    // Edit: change the summary and write-up.
    await page.goto(editUrl);
    await page.getByLabel("Summary").fill("Edited by the end-to-end tests.");
    await page
      .getByRole("textbox", { name: "Write-up" })
      .fill("## Approach\n\nTested **end to end**.");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expectToast(page, "Project saved.");
    await page.goto("/projects/e2e-test-project");
    await expect(
      page.getByText("Edited by the end-to-end tests."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Approach" }),
    ).toBeVisible();

    // Delete (with confirmation) → public page is gone.
    await page.goto(editUrl);
    await page.getByRole("button", { name: "Delete" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm.getByRole("button", { name: "Cancel" })).toBeFocused();
    await confirm.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/admin\/projects$/);
    await page.goto("/projects/e2e-test-project");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
  });

  test("profile edits show on the home page", async ({ page }) => {
    await signIn(page, "/admin/profile");
    await page.getByLabel("Tagline").fill("Backend and cloud engineer (e2e)");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expectToast(page, "Profile saved.");
    await page.goto("/");
    await expect(
      page.getByText("Backend and cloud engineer (e2e)"),
    ).toBeVisible();

    // Clearing the field removes it again.
    await page.goto("/admin/profile");
    await page.getByLabel("Tagline").fill("");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expectToast(page, "Profile saved.");
    await page.goto("/");
    await expect(
      page.getByText("Backend and cloud engineer (e2e)"),
    ).toHaveCount(0);
  });

  test("hiding a section removes it from the page and the nav", async ({
    page,
  }) => {
    await signIn(page, "/admin/settings");
    await page.getByRole("switch", { name: "Education" }).click();
    await page.getByRole("button", { name: "Save sections" }).click();
    await expectToast(page, "Settings saved.");
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 2, name: "Education" }),
    ).toHaveCount(0);

    await page.goto("/admin/settings");
    await page.getByRole("switch", { name: "Education" }).click();
    await page.getByRole("button", { name: "Save sections" }).click();
    await expectToast(page, "Settings saved.");
  });

  test("reorders experience with the arrow buttons", async ({ page }) => {
    await signIn(page, "/admin/experience");
    const rows = page
      .getByRole("list", { name: "Experience" })
      .getByRole("listitem");
    const firstTitle = await rows
      .first()
      .getByRole("link")
      .first()
      .textContent();
    await rows.nth(1).getByRole("button", { name: /up$/ }).click();
    await expectToast(page, "Moved up.");
    await expect(rows.nth(1).getByRole("link").first()).toHaveText(
      firstTitle ?? "",
    );
    // Put it back.
    await rows.first().getByRole("button", { name: /down$/ }).click();
    await expectToast(page, "Moved down.");
    await expect(rows.first().getByRole("link").first()).toHaveText(
      firstTitle ?? "",
    );
  });

  test("signs out", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
