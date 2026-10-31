import { describe, expect, it } from "vitest";
import { fieldErrors } from "@/lib/action-result";
import {
  contactSchema,
  experienceSchema,
  profileFormSchema,
  projectFormSchema,
  skillCategorySchema,
} from "@/lib/validation";

const project = {
  title: "Portfolio",
  slug: "portfolio",
  summary: "A site.",
  body: "",
  tech: [],
  tags: [],
  links: { github: "", live: "", caseStudy: "" },
  role: "",
  start: "",
  end: "",
  featured: false,
  published: true,
};

describe("project form", () => {
  it("turns empty optional fields into undefined", () => {
    const parsed = projectFormSchema.parse(project);
    expect(parsed.links.github).toBeUndefined();
    expect(parsed.role).toBeUndefined();
    expect(parsed.start).toBeUndefined();
  });

  it("trims, dedupes and drops blank tags", () => {
    const parsed = projectFormSchema.parse({
      ...project,
      tech: [" React ", "React", "", "Node"],
    });
    expect(parsed.tech).toEqual(["React", "Node"]);
  });

  it("rejects bad slugs", () => {
    for (const slug of [
      "Has Caps",
      "trailing-",
      "-leading",
      "two--dashes",
      "spa ce",
      "",
    ]) {
      expect(
        projectFormSchema.safeParse({ ...project, slug }).success,
        slug,
      ).toBe(false);
    }
  });

  it("only accepts http(s) links", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,x",
      "ftp://x.com",
      "not a url",
    ]) {
      const result = projectFormSchema.safeParse({
        ...project,
        links: { ...project.links, live: url },
      });
      expect(result.success, url).toBe(false);
    }
    expect(
      projectFormSchema.safeParse({
        ...project,
        links: { ...project.links, live: "https://x.com" },
      }).success,
    ).toBe(true);
  });

  it("rejects an end month before the start month, on the end field", () => {
    const result = projectFormSchema.safeParse({
      ...project,
      start: "2024-05",
      end: "2024-01",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(fieldErrors(result.error).end).toMatch(/before/);
  });

  it("does not accept image fields (uploads are managed separately)", () => {
    const parsed = projectFormSchema.parse({
      ...project,
      cover: { url: "https://x", key: "k", alt: "a" },
    });
    expect(parsed).not.toHaveProperty("cover");
  });
});

describe("experience", () => {
  it("requires role, company and a valid start month, with plain messages", () => {
    const result = experienceSchema.safeParse({
      role: "",
      company: "",
      start: "2024-13",
      highlights: [],
      tech: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors.role).toBe("This field is required.");
      expect(errors.company).toBe("This field is required.");
      expect(errors.start).toBe("Choose a month.");
    }
  });

  it("allows an ongoing role (no end)", () => {
    expect(
      experienceSchema.safeParse({
        role: "Dev",
        company: "X",
        start: "2024-01",
        end: "",
        highlights: ["Did"],
        tech: [],
      }).success,
    ).toBe(true);
  });
});

describe("profile form", () => {
  it("requires a valid email and ignores uploads", () => {
    const base = {
      name: "A",
      title: "B",
      email: "nope",
      socials: {},
      bio: "",
      values: [],
      seo: {},
    };
    const result = profileFormSchema.safeParse(base);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(fieldErrors(result.error).email).toBe(
        "Enter a valid email address.",
      );
    expect(
      profileFormSchema.parse({
        ...base,
        email: "a@b.co",
        avatar: { url: "x" },
      }),
    ).not.toHaveProperty("avatar");
  });
});

describe("skills", () => {
  it("only allows known levels", () => {
    expect(
      skillCategorySchema.safeParse({
        name: "X",
        items: [{ name: "Go", level: "guru" }],
      }).success,
    ).toBe(false);
    expect(
      skillCategorySchema.safeParse({
        name: "X",
        items: [{ name: "Go", level: "expert" }],
      }).success,
    ).toBe(true);
  });
});

describe("contact form", () => {
  const message = { name: "Ada", email: "ada@example.com", body: "Hello" };
  it("accepts a normal message", () => {
    expect(contactSchema.safeParse(message).success).toBe(true);
  });
  it("rejects a filled honeypot", () => {
    expect(
      contactSchema.safeParse({ ...message, website: "spam.example" }).success,
    ).toBe(false);
  });
  it("rejects an overlong message", () => {
    expect(
      contactSchema.safeParse({ ...message, body: "x".repeat(5001) }).success,
    ).toBe(false);
  });
});
