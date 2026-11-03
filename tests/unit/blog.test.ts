import { describe, expect, it } from "vitest";
import {
  buildRss,
  dateToZonedInput,
  escapeXml,
  postState,
  readingMinutes,
  secondsUntil,
  zonedInputToDate,
} from "@/lib/blog";
import { commentSchema, postFormSchema } from "@/lib/validation";

const post = {
  title: "Hello",
  slug: "hello",
  excerpt: "A first post.",
  body: "Some text.",
  tags: ["a", " a ", ""],
  status: "draft",
  publishAt: "",
  commentsOpen: true,
};

describe("post form", () => {
  it("accepts a draft without a time and tidies tags", () => {
    const parsed = postFormSchema.parse(post);
    expect(parsed.publishAt).toBeUndefined();
    expect(parsed.tags).toEqual(["a"]);
  });

  it("rejects a malformed time and a bad slug", () => {
    expect(
      postFormSchema.safeParse({ ...post, publishAt: "tomorrow" }).success,
    ).toBe(false);
    expect(postFormSchema.safeParse({ ...post, slug: "Hello!" }).success).toBe(
      false,
    );
  });
});

describe("comment form", () => {
  const comment = {
    postId: "a".repeat(24),
    name: "Ada",
    email: "ada@example.com",
    body: "Nice post.",
    website: "",
  };

  it("accepts a normal comment", () => {
    expect(commentSchema.safeParse(comment).success).toBe(true);
  });

  it("rejects a filled honeypot, a bad post id and an empty body", () => {
    expect(
      commentSchema.safeParse({ ...comment, website: "spam" }).success,
    ).toBe(false);
    expect(commentSchema.safeParse({ ...comment, postId: "x" }).success).toBe(
      false,
    );
    expect(commentSchema.safeParse({ ...comment, body: "  " }).success).toBe(
      false,
    );
  });
});

describe("Norway time", () => {
  it("converts winter and summer wall times to the right instant", () => {
    expect(zonedInputToDate("2026-01-15T10:00")?.toISOString()).toBe(
      "2026-01-15T09:00:00.000Z",
    );
    expect(zonedInputToDate("2026-07-15T10:00")?.toISOString()).toBe(
      "2026-07-15T08:00:00.000Z",
    );
  });

  it("round-trips through the input format", () => {
    for (const value of ["2026-03-29T12:30", "2026-10-25T18:05"]) {
      const date = zonedInputToDate(value);
      expect(dateToZonedInput(date?.toISOString())).toBe(value);
    }
  });

  it("rejects malformed input", () => {
    expect(zonedInputToDate("2026-01-15")).toBeNull();
    expect(dateToZonedInput(undefined)).toBe("");
  });
});

describe("postState", () => {
  const now = Date.parse("2026-11-01T12:00:00Z");
  it("tells drafts, scheduled and published posts apart", () => {
    expect(postState({ status: "draft" }, now)).toBe("draft");
    expect(postState({ status: "published" }, now)).toBe("draft");
    expect(
      postState(
        { status: "published", publishAt: "2026-11-02T00:00:00Z" },
        now,
      ),
    ).toBe("scheduled");
    expect(
      postState(
        { status: "published", publishAt: "2026-10-01T00:00:00Z" },
        now,
      ),
    ).toBe("published");
  });

  it("caches until the next scheduled post, within limits", () => {
    expect(secondsUntil(null, now)).toBe(3600);
    expect(secondsUntil(new Date(now + 10_000), now)).toBe(60);
    expect(secondsUntil(new Date(now + 600_000), now)).toBe(600);
    expect(secondsUntil(new Date(now + 9e6), now)).toBe(3600);
  });
});

describe("readingMinutes", () => {
  it("is at least one minute and ignores code blocks and images", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("word ".repeat(1000))).toBe(5);
    expect(
      readingMinutes("```\n" + "code ".repeat(5000) + "\n```\n![alt](x)"),
    ).toBe(1);
  });
});

describe("RSS", () => {
  it("escapes XML and lists items with absolute links", () => {
    expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;Jerry&apos;&lt;/a&gt;",
    );
    const xml = buildRss({
      title: "Blog & notes",
      description: "Latest",
      siteUrl: "https://example.com/blog",
      feedUrl: "https://example.com/blog/rss.xml",
      items: [
        {
          title: "Hello <world>",
          url: "https://example.com/blog/hello",
          excerpt: "First",
          publishedAt: "2026-11-01T12:00:00.000Z",
          tags: ["DevOps"],
        },
      ],
    });
    expect(xml).toContain("<title>Blog &amp; notes</title>");
    expect(xml).toContain("<title>Hello &lt;world&gt;</title>");
    expect(xml).toContain(
      '<guid isPermaLink="true">https://example.com/blog/hello</guid>',
    );
    expect(xml).toContain("<pubDate>Sun, 01 Nov 2026 12:00:00 GMT</pubDate>");
    expect(xml).toContain("<category>DevOps</category>");
  });
});
