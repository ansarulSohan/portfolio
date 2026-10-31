import { describe, expect, it } from "vitest";
import { toUpdate } from "@/lib/admin-crud";
import { safeAdminPath } from "@/lib/auth";
import { DEFAULT_PREFS, normalizePrefs, PREFS_SCRIPT } from "@/lib/prefs";
import { formatMonth, formatRange } from "@/lib/site";
import { slugify } from "@/lib/slug";
import { checkFile } from "@/lib/uploads";

describe("slugify", () => {
  it.each([
    ["My Project: v2!", "my-project-v2"],
    ["  Crème brûlée  ", "creme-brulee"],
    ["Node.js / Express", "node-js-express"],
    ["***", ""],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("caps length at 80 without a trailing dash", () => {
    const slug = slugify("word ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("month formatting", () => {
  it("formats months and ranges", () => {
    expect(formatMonth("2023-06")).toBe("Jun 2023");
    expect(formatRange("2023-06", "2023-07")).toBe("Jun 2023 – Jul 2023");
    expect(formatRange("2023-06")).toBe("Jun 2023 – Present");
    expect(formatRange("2023-06", "2023-06")).toBe("Jun 2023");
    expect(formatRange(undefined, undefined)).toBe("");
  });
});

describe("display preferences", () => {
  it("falls back to defaults for missing or invalid values", () => {
    expect(normalizePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(
      normalizePrefs({ theme: "purple", text: "huge", hyperlegible: "yes" }),
    ).toEqual(DEFAULT_PREFS);
  });

  it("keeps valid values", () => {
    const prefs = normalizePrefs({
      theme: "dark",
      text: "xl",
      contrast: "on",
      underlineLinks: true,
    });
    expect(prefs).toMatchObject({
      theme: "dark",
      text: "xl",
      contrast: "on",
      underlineLinks: true,
    });
  });

  it("inline script is valid JavaScript", () => {
    expect(() => new Function(PREFS_SCRIPT)).not.toThrow();
  });
});

describe("upload rules", () => {
  it("accepts allowed types within size limits", () => {
    expect(checkFile("avatar", "image/webp", 1024)).toBeNull();
    expect(checkFile("resume", "application/pdf", 9 * 1024 * 1024)).toBeNull();
  });

  it("rejects SVG, wrong types, empty and oversized files", () => {
    expect(checkFile("project", "image/svg+xml", 1024)).toMatch(
      /isn't supported/,
    );
    expect(checkFile("resume", "image/png", 1024)).toMatch(/isn't supported/);
    expect(checkFile("avatar", "image/png", 0)).toMatch(/empty/);
    expect(checkFile("avatar", "image/png", 6 * 1024 * 1024)).toMatch(
      /too large/,
    );
  });

  it("does not treat inherited object keys as allowed types", () => {
    expect(checkFile("avatar", "constructor", 10)).not.toBeNull();
    expect(checkFile("avatar", "__proto__", 10)).not.toBeNull();
  });
});

describe("post-login redirect", () => {
  it.each([
    ["/admin/projects", "/admin/projects"],
    ["/admin/projects?x=1", "/admin/projects?x=1"],
    ["https://evil.example/admin", "/admin"],
    ["//evil.example/admin", "/admin"],
    ["/admin\\..\\evil", "/admin"],
    ["/admin/login", "/admin"],
    ["/", "/admin"],
    [null, "/admin"],
  ])("%s → %s", (input, expected) => {
    expect(safeAdminPath(input)).toBe(expected);
  });
});

describe("toUpdate", () => {
  it("unsets cleared fields and sets the rest", () => {
    expect(toUpdate({ a: 1, b: undefined, c: { d: undefined } })).toEqual({
      $set: { a: 1, c: { d: undefined } },
      $unset: { b: 1 },
    });
  });
  it("omits $unset when nothing was cleared", () => {
    expect(toUpdate({ a: 1 })).toEqual({ $set: { a: 1 } });
  });
});
