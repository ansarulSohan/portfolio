/**
 * One-time import of the old site's content into MongoDB, plus the first admin.
 *
 *   pnpm seed              fill empty collections; skip ones that already have data
 *   pnpm seed --dry-run    validate and print what would be written; no DB access
 *   pnpm seed --force      replace content collections (profile, projects, experience,
 *                          education, skills, settings); never touches admins or messages
 *
 * Reads MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD from .env.local when present,
 * otherwise from the process environment (e.g. inside the Coolify container).
 */
import { existsSync } from "node:fs";
import bcrypt from "bcryptjs";
import type { Model } from "mongoose";
import { z } from "zod";
import { legacyPortfolio as legacy } from "./data/legacy-portfolio";
import { connectDB, disconnectDB } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/dto";
import { slugify } from "@/lib/slug";
import {
  educationSchema,
  experienceSchema,
  profileSchema,
  projectSchema,
  settingsSchema,
  skillCategorySchema,
  type SkillLevel,
} from "@/lib/validation";
import {
  Admin,
  Education,
  Experience,
  Profile,
  Project,
  Settings,
  SkillCategory,
} from "@/models";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/** "Jun 2023" → "2023-06", "2023" → "2023-01", "Present" → undefined. */
function toMonth(text: string): string | undefined {
  const value = text.trim().toLowerCase();
  if (!value || value === "present") return undefined;
  const match = value.match(/^(?:([a-z]{3})[a-z]*\s+)?(\d{4})$/);
  if (!match) throw new Error(`Unrecognised date "${text}"`);
  const [, name, year] = match;
  const index = name ? MONTHS.indexOf(name) : 0;
  if (index < 0) throw new Error(`Unrecognised month in "${text}"`);
  return `${year}-${String(index + 1).padStart(2, "0")}`;
}

/** "Jun 2023 — Jul 2023" → { start: "2023-06", end: "2023-07" }. */
function toRange(period: string): { start?: string; end?: string } {
  const [start = "", end = ""] = period.split(/\s+[—–-]\s+/);
  return { start: toMonth(start), end: toMonth(end) };
}

/** Old 0–100 bars → a label, which reads more honestly than a percentage. */
function toLevel(level: number): SkillLevel {
  if (level >= 85) return "expert";
  if (level >= 70) return "proficient";
  return "familiar";
}

/** Validate with the same schema the admin uses, with a readable error. */
function parse<S extends z.ZodType>(
  schema: S,
  value: unknown,
  label: string,
): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid ${label}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

const profile = parse(
  profileSchema,
  {
    name: legacy.meta.name,
    title: legacy.meta.title,
    location: legacy.meta.location,
    email: legacy.meta.email,
    socials: { linkedin: legacy.meta.linkedin, github: legacy.meta.github },
    bio: legacy.about.bio.join("\n\n"),
    values: legacy.about.philosophies,
    seo: {},
  },
  "profile",
);

const projects = legacy.projects.map((p, order) => ({
  ...parse(
    projectSchema,
    {
      title: p.title,
      slug: slugify(p.title),
      summary: p.description,
      body: p.description,
      tech: p.tech,
      tags: [],
      links: { github: p.github, live: p.live },
      gallery: [],
      featured: true,
      published: true,
    },
    `project "${p.title}"`,
  ),
  order,
}));

const experience = legacy.experience.map((e, order) => ({
  ...parse(
    experienceSchema,
    {
      role: e.role,
      company: e.company,
      ...toRange(e.period),
      highlights: e.highlights,
      tech: [],
    },
    `experience "${e.role} at ${e.company}"`,
  ),
  order,
}));

const education = legacy.education.map((e, order) => ({
  ...parse(
    educationSchema,
    {
      degree: e.degree,
      institution: e.institution,
      ...toRange(e.year),
      notes: e.notes,
    },
    `education "${e.degree}"`,
  ),
  order,
}));

const skills = legacy.skills.map((category, order) => ({
  ...parse(
    skillCategorySchema,
    {
      name: category.category,
      items: category.items.map((item) => ({
        name: item.name,
        level: toLevel(item.level),
      })),
    },
    `skill category "${category.category}"`,
  ),
  order,
}));

const settings = parse(settingsSchema, DEFAULT_SETTINGS, "settings");

/** Insert into an empty collection; with --force, replace its contents. */
async function seedCollection<T>(
  name: string,
  model: Model<T>,
  docs: object[],
) {
  const existing = await model.countDocuments();
  if (existing > 0 && !FORCE) {
    console.log(
      `  skip   ${name}: already has ${existing} document(s) (use --force to replace)`,
    );
    return;
  }
  if (existing > 0) await model.deleteMany({});
  await model.insertMany(docs);
  console.log(
    `  ${existing > 0 ? "replace" : "insert "} ${name}: ${docs.length} document(s)`,
  );
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  const existing = await Admin.countDocuments();
  if (existing > 0) {
    console.log(
      "  skip   admin: an admin already exists (change the password in /admin/settings)",
    );
    return;
  }
  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set to create the first admin.",
    );
  }
  if (password.length < 12) {
    console.warn(
      "  WARNING: ADMIN_PASSWORD is shorter than 12 characters. Change it after first login.",
    );
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await Admin.create({ email, passwordHash });
  console.log(`  insert  admin: ${email}`);
}

async function main() {
  const plan = {
    profile: [profile],
    projects,
    experience,
    education,
    skillCategories: skills,
    settings: [settings],
  };

  if (DRY_RUN) {
    console.log("Dry run: all content is valid. Would write:\n");
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  await connectDB();
  console.log(`Seeding${FORCE ? " (force)" : ""}...`);
  await seedCollection("profile", Profile, plan.profile);
  await seedCollection("projects", Project, plan.projects);
  await seedCollection("experience", Experience, plan.experience);
  await seedCollection("education", Education, plan.education);
  await seedCollection("skillCategories", SkillCategory, plan.skillCategories);
  await seedCollection("settings", Settings, plan.settings);
  await seedAdmin();
  // Build unique indexes (e.g. project slug) now rather than on first app request.
  await Promise.all([Project.syncIndexes(), Admin.syncIndexes()]);
  console.log("Done.");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => (DRY_RUN ? undefined : disconnectDB()));
