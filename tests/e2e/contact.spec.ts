import { expect, test } from "@playwright/test";
import { expectToast, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("contact form", () => {
  test("shows field errors and focuses the first invalid field", async ({
    page,
  }) => {
    await page.goto("/#contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByLabel("Name")).toBeFocused();
    await expect(page.getByLabel("Name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(
      page.getByText("Please enter a valid email address."),
    ).toBeVisible();
  });

  test("sends a message that arrives in the admin inbox", async ({ page }) => {
    await page.goto("/#contact");
    await page.getByLabel("Name").fill("E2E Visitor");
    await page.getByLabel("Email").fill("visitor@example.test");
    await page.getByLabel("Subject (optional)").fill("Hello from e2e");
    await page
      .getByLabel("Message")
      .fill("This message was sent by the end-to-end tests.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Your message has been sent" }),
    ).toBeVisible();
    await expect(page.getByLabel("Name")).toHaveValue("");

    await signIn(page, "/admin/messages");
    const message = page.locator("details").filter({ hasText: "E2E Visitor" });
    await expect(message.getByText("New")).toBeVisible();
    await message.locator("summary").click();
    await expectToast(page, "Marked as read.");
    await expect(
      message.getByText("This message was sent by the end-to-end tests."),
    ).toBeVisible();

    await message.getByRole("button", { name: "Delete" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .click();
    await expectToast(page, "Message deleted.");
    await expect(
      page.locator("details").filter({ hasText: "E2E Visitor" }),
    ).toHaveCount(0);
  });
});
