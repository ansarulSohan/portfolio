import { expect, test, type Page } from "@playwright/test";
import { MODES, serious, useMode } from "./axe";
import { E2E_BASE_URL } from "./env";
import { expectToast, signIn } from "./helpers";

// One flow builds on the previous step (enable → write → comment → clean up).
// Admin steps share one signed-in page (sign-ins are rate limited); visitor
// steps use each test's own fresh, signed-out page.
test.describe.configure({ mode: "serial" });

async function setBlog(page: Page, on: boolean) {
  await page.goto("/admin/settings");
  const toggle = page.getByRole("switch", { name: /^Blog/ });
  if ((await toggle.getAttribute("aria-checked")) !== String(on)) {
    await toggle.click();
    await page.getByRole("button", { name: "Save sections" }).click();
    await expectToast(page, "Settings saved.");
  }
}

async function newPost(
  page: Page,
  fields: { title: string; excerpt: string; body: string; publishAt?: string },
) {
  await page.goto("/admin/blog/new");
  await page.getByLabel("Title").fill(fields.title);
  await page.getByLabel("Excerpt").fill(fields.excerpt);
  await page.getByRole("textbox", { name: "Text" }).fill(fields.body);
  await page.getByLabel("Tags").fill("Testing");
  await page.getByLabel("Tags").press("Enter");
  await page.getByRole("switch", { name: "Published" }).click();
  if (fields.publishAt) {
    await page
      .getByLabel("Publish date and time (Norway time)")
      .fill(fields.publishAt);
  }
  await page.getByRole("button", { name: "Create post" }).click();
  await expectToast(page, "Post created.");
  await expect(page).toHaveURL(/\/admin\/blog\/[0-9a-f]{24}$/);
  return page.url();
}

async function deletePost(page: Page, editUrl: string) {
  await page.goto(editUrl);
  await page.getByRole("button", { name: "Delete" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page).toHaveURL(/\/admin\/blog$/);
}

test.describe("blog", () => {
  let publishedUrl = "";
  let scheduledUrl = "";
  let admin: Page;

  test.beforeAll(async ({ browser }) => {
    admin = await browser.newPage({
      baseURL: E2E_BASE_URL,
      reducedMotion: "reduce",
    });
    await signIn(admin);
  });
  test.afterAll(async () => admin.close());

  test("is hidden until it's turned on", async ({ page }) => {
    await page.goto("/blog");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    expect((await page.request.get("/blog/rss.xml")).status()).toBe(404);

    await setBlog(admin, true);
    await page.goto("/");
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", {
        name: "Blog",
      }),
    ).toBeVisible();
  });

  test("published posts appear on the blog, the post page and RSS", async ({
    page,
  }) => {
    publishedUrl = await newPost(admin, {
      title: "E2E Blog Post",
      excerpt: "Written by the end-to-end tests.",
      body: "## Hello\n\nThis is **the body**.",
    });

    await page.goto("/blog");
    await expect(
      page.getByRole("heading", { level: 2, name: "E2E Blog Post" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "E2E Blog Post" }).click();
    await expect(page).toHaveURL(/\/blog\/e2e-blog-post$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "E2E Blog Post" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Hello" }),
    ).toBeVisible();

    // Tag filter.
    await page.goto("/blog?tag=Testing");
    await expect(
      page
        .getByRole("navigation", { name: "Filter by tag" })
        .getByRole("link", { name: "Testing" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("heading", { level: 2, name: "E2E Blog Post" }),
    ).toBeVisible();

    const rss = await page.request.get("/blog/rss.xml");
    expect(rss.status()).toBe(200);
    expect(rss.headers()["content-type"]).toContain("application/rss+xml");
    const xml = await rss.text();
    expect(xml).toContain("<title>E2E Blog Post</title>");
    expect(xml).toMatch(/<link>https?:\/\/[^<]+\/blog\/e2e-blog-post<\/link>/);
  });

  test("scheduled posts stay hidden until their time", async ({ page }) => {
    scheduledUrl = await newPost(admin, {
      title: "E2E Scheduled Post",
      excerpt: "Not out yet.",
      body: "Coming soon.",
      publishAt: "2099-01-01T09:00",
    });
    await expect(admin.getByText("Goes live 1 January 2099.")).toBeVisible();

    await page.goto("/blog");
    await expect(page.getByText("E2E Blog Post")).toBeVisible();
    await expect(page.getByText("E2E Scheduled Post")).toHaveCount(0);
    await page.goto("/blog/e2e-scheduled-post");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    expect(
      await (await page.request.get("/blog/rss.xml")).text(),
    ).not.toContain("E2E Scheduled Post");
  });

  test("comments wait for approval, and spam hides them", async ({ page }) => {
    await page.goto("/blog/e2e-blog-post");
    const form = page.locator("form").filter({ hasText: "Post comment" });

    // Validation first.
    await form.getByRole("button", { name: "Post comment" }).click();
    await expect(form.getByLabel("Name")).toBeFocused();

    await form.getByLabel("Name").fill("Ada Reader");
    await form.getByLabel("Email").fill("ada@example.com");
    await form.getByLabel("Comment").fill("Great post from the e2e tests.");
    await form.getByRole("button", { name: "Post comment" }).click();
    await expect(
      page.getByText("Your comment will appear once it's approved."),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByText("Great post from the e2e tests.")).toHaveCount(
      0,
    );

    await admin.goto("/admin/comments");
    await expect(
      admin.getByText("Great post from the e2e tests."),
    ).toBeVisible();
    await expect(admin.getByText("ada@example.com")).toBeVisible();
    await admin
      .getByRole("button", { name: "Approve comment by Ada Reader" })
      .click();
    await expectToast(admin, "Approved.");

    await page.goto("/blog/e2e-blog-post");
    await expect(
      page.getByText("Great post from the e2e tests."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "1 comment" }),
    ).toBeVisible();
    // The email is never shown publicly.
    await expect(page.getByText("ada@example.com")).toHaveCount(0);

    await admin.goto("/admin/comments?status=approved");
    await admin
      .getByRole("button", { name: "Hide as spam comment by Ada Reader" })
      .click();
    await expectToast(admin, "Marked as spam.");
    await page.goto("/blog/e2e-blog-post");
    await expect(page.getByText("Great post from the e2e tests.")).toHaveCount(
      0,
    );
  });

  for (const mode of Object.keys(MODES) as (keyof typeof MODES)[]) {
    test(`blog pages pass axe (${mode})`, async ({ page }) => {
      await useMode(page, mode);
      for (const path of ["/blog", "/blog/e2e-blog-post"]) {
        await page.goto(path);
        await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
        expect(await serious(page), path).toEqual([]);
      }
    });
  }

  test("deleting posts and turning the blog off removes them", async ({
    page,
  }) => {
    await deletePost(admin, publishedUrl);
    await deletePost(admin, scheduledUrl);
    await page.goto("/blog/e2e-blog-post");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();

    await setBlog(admin, false);
    await page.goto("/blog");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
  });
});
