import "server-only";
import { cacheLife, cacheTag, io } from "next/cache";
import { connectDB } from "./db";
import { TAGS } from "./cache-tags";
import {
  toEducationDTO,
  toExperienceDTO,
  toProfileDTO,
  toProjectDTO,
  toSettingsDTO,
  toSkillCategoryDTO,
  type EducationDTO,
  type ExperienceDTO,
  type Lean,
  type ProfileDTO,
  type ProjectDTO,
  type SettingsDTO,
  type SkillCategoryDTO,
} from "./dto";
import {
  Education,
  Experience,
  Profile,
  Project,
  Settings,
  SkillCategory,
  type EducationDoc,
  type ExperienceDoc,
  type ProfileDoc,
  type ProjectDoc,
  type SettingsDoc,
  type SkillCategoryDoc,
} from "@/models";

/*
 * Public reads. Each exported function awaits io() and then calls a
 * "use cache" function:
 *
 * - io() suspends during `next build`, so the database is never queried at
 *   build time. The Docker image builds without MONGODB_URI, and callers must
 *   sit inside <Suspense> (the fallback ships in the static shell).
 * - At request time io() resolves immediately and the cached result is served
 *   from memory. Admin writes call updateTag() so edits show on the next request.
 *   The "hours" lifetime is only a safety net for edits made directly in Atlas.
 */

async function cachedProfile(): Promise<ProfileDTO | null> {
  "use cache";
  cacheTag(TAGS.profile);
  cacheLife("hours");
  await connectDB();
  const doc = await Profile.findOne().lean<Lean<ProfileDoc>>();
  return doc ? toProfileDTO(doc) : null;
}

async function cachedSettings(): Promise<SettingsDTO> {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife("hours");
  await connectDB();
  const doc = await Settings.findOne().lean<Lean<SettingsDoc>>();
  return toSettingsDTO(doc);
}

async function cachedPublishedProjects(
  featuredOnly: boolean,
): Promise<ProjectDTO[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("hours");
  await connectDB();
  const filter = featuredOnly
    ? { published: true, featured: true }
    : { published: true };
  const docs = await Project.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .lean<Lean<ProjectDoc>[]>();
  return docs.map(toProjectDTO);
}

async function cachedPublishedProject(
  slug: string,
): Promise<ProjectDTO | null> {
  "use cache";
  cacheTag(TAGS.projects, TAGS.project(slug));
  cacheLife("hours");
  await connectDB();
  const doc = await Project.findOne({ slug, published: true }).lean<
    Lean<ProjectDoc>
  >();
  return doc ? toProjectDTO(doc) : null;
}

async function cachedExperience(): Promise<ExperienceDTO[]> {
  "use cache";
  cacheTag(TAGS.experience);
  cacheLife("hours");
  await connectDB();
  const docs = await Experience.find()
    .sort({ order: 1, start: -1 })
    .lean<Lean<ExperienceDoc>[]>();
  return docs.map(toExperienceDTO);
}

async function cachedEducation(): Promise<EducationDTO[]> {
  "use cache";
  cacheTag(TAGS.education);
  cacheLife("hours");
  await connectDB();
  const docs = await Education.find()
    .sort({ order: 1, start: -1 })
    .lean<Lean<EducationDoc>[]>();
  return docs.map(toEducationDTO);
}

async function cachedSkillCategories(): Promise<SkillCategoryDTO[]> {
  "use cache";
  cacheTag(TAGS.skills);
  cacheLife("hours");
  await connectDB();
  const docs = await SkillCategory.find()
    .sort({ order: 1 })
    .lean<Lean<SkillCategoryDoc>[]>();
  return docs.map(toSkillCategoryDTO);
}

export async function getProfile(): Promise<ProfileDTO | null> {
  await io();
  return cachedProfile();
}

export async function getSettings(): Promise<SettingsDTO> {
  await io();
  return cachedSettings();
}

/** Published projects in manual order; `featuredOnly` for the home page. */
export async function getPublishedProjects(
  options: { featuredOnly?: boolean } = {},
): Promise<ProjectDTO[]> {
  await io();
  return cachedPublishedProjects(options.featuredOnly ?? false);
}

/** A published project by slug, or null (unpublished projects 404 publicly). */
export async function getPublishedProject(
  slug: string,
): Promise<ProjectDTO | null> {
  await io();
  return cachedPublishedProject(slug);
}

export async function getExperience(): Promise<ExperienceDTO[]> {
  await io();
  return cachedExperience();
}

export async function getEducation(): Promise<EducationDTO[]> {
  await io();
  return cachedEducation();
}

export async function getSkillCategories(): Promise<SkillCategoryDTO[]> {
  await io();
  return cachedSkillCategories();
}
