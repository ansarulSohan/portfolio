import "server-only";
import { cacheLife, cacheTag } from "next/cache";
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

// Public, cached reads. Content only changes through the admin, which calls
// updateTag() after each write, so the "hours" lifetime is just a safety net
// for edits made directly in Atlas.

export async function getProfile(): Promise<ProfileDTO | null> {
  "use cache";
  cacheTag(TAGS.profile);
  cacheLife("hours");
  await connectDB();
  const doc = await Profile.findOne().lean<Lean<ProfileDoc>>();
  return doc ? toProfileDTO(doc) : null;
}

export async function getSettings(): Promise<SettingsDTO> {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife("hours");
  await connectDB();
  const doc = await Settings.findOne().lean<Lean<SettingsDoc>>();
  return toSettingsDTO(doc);
}

/** Published projects in manual order; `featuredOnly` for the home page. */
export async function getPublishedProjects(
  options: { featuredOnly?: boolean } = {},
): Promise<ProjectDTO[]> {
  "use cache";
  cacheTag(TAGS.projects);
  cacheLife("hours");
  await connectDB();
  const filter = options.featuredOnly
    ? { published: true, featured: true }
    : { published: true };
  const docs = await Project.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .lean<Lean<ProjectDoc>[]>();
  return docs.map(toProjectDTO);
}

/** A published project by slug, or null (unpublished projects 404 publicly). */
export async function getPublishedProject(
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

export async function getExperience(): Promise<ExperienceDTO[]> {
  "use cache";
  cacheTag(TAGS.experience);
  cacheLife("hours");
  await connectDB();
  const docs = await Experience.find()
    .sort({ order: 1, start: -1 })
    .lean<Lean<ExperienceDoc>[]>();
  return docs.map(toExperienceDTO);
}

export async function getEducation(): Promise<EducationDTO[]> {
  "use cache";
  cacheTag(TAGS.education);
  cacheLife("hours");
  await connectDB();
  const docs = await Education.find()
    .sort({ order: 1, start: -1 })
    .lean<Lean<EducationDoc>[]>();
  return docs.map(toEducationDTO);
}

export async function getSkillCategories(): Promise<SkillCategoryDTO[]> {
  "use cache";
  cacheTag(TAGS.skills);
  cacheLife("hours");
  await connectDB();
  const docs = await SkillCategory.find()
    .sort({ order: 1 })
    .lean<Lean<SkillCategoryDoc>[]>();
  return docs.map(toSkillCategoryDTO);
}
