import "server-only";
import { cacheLife, cacheTag, io } from "next/cache";
import { connectDB } from "./db";
import { TAGS } from "./cache-tags";
import { secondsUntil } from "./blog";
import {
  toCommentDTO,
  toEducationDTO,
  toExperienceDTO,
  toPostDTO,
  toPostSummaryDTO,
  toProfileDTO,
  toProjectDTO,
  toSettingsDTO,
  toSkillCategoryDTO,
  type CommentDTO,
  type EducationDTO,
  type ExperienceDTO,
  type Lean,
  type PostDTO,
  type PostSummaryDTO,
  type ProfileDTO,
  type ProjectDTO,
  type SettingsDTO,
  type SkillCategoryDTO,
} from "./dto";
import {
  Comment,
  Education,
  Experience,
  Post,
  Profile,
  Project,
  Settings,
  SkillCategory,
  type CommentDoc,
  type EducationDoc,
  type ExperienceDoc,
  type PostDoc,
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

/*
 * Blog. A post is public once it's published and its publishAt has passed, so
 * scheduled posts go live without a cron job: the cached list expires when the
 * next scheduled post is due (see secondsUntil), and admin saves refresh it
 * immediately through updateTag().
 */

/** Cache lifetime that ends when `next` is due (or within an hour). */
function lifeUntil(next: Date | null | undefined) {
  const seconds = secondsUntil(next);
  cacheLife({ stale: 30, revalidate: seconds, expire: seconds + 300 });
}

async function cachedPublicPosts(): Promise<PostSummaryDTO[]> {
  "use cache";
  cacheTag(TAGS.posts);
  await connectDB();
  const now = new Date();
  const [docs, next] = await Promise.all([
    Post.find({ status: "published", publishAt: { $lte: now } })
      .select("-body -images")
      .sort({ publishAt: -1 })
      .lean<Lean<PostDoc>[]>(),
    Post.findOne({ status: "published", publishAt: { $gt: now } })
      .sort({ publishAt: 1 })
      .select("publishAt")
      .lean<{ publishAt?: Date }>(),
  ]);
  lifeUntil(next?.publishAt);
  return docs.map(toPostSummaryDTO);
}

async function cachedPublicPost(slug: string): Promise<PostDTO | null> {
  "use cache";
  cacheTag(TAGS.posts, TAGS.post(slug));
  await connectDB();
  const doc = await Post.findOne({ slug, status: "published" }).lean<
    Lean<PostDoc>
  >();
  if (doc?.publishAt && doc.publishAt > new Date()) {
    // Scheduled: hidden until it's due.
    lifeUntil(doc.publishAt);
    return null;
  }
  cacheLife("hours");
  return doc?.publishAt ? toPostDTO(doc) : null;
}

async function cachedApprovedComments(postId: string): Promise<CommentDTO[]> {
  "use cache";
  cacheTag(TAGS.comments(postId));
  cacheLife("hours");
  await connectDB();
  const docs = await Comment.find({ post: postId, status: "approved" })
    .sort({ createdAt: 1 })
    .limit(500)
    .lean<Lean<CommentDoc>[]>();
  return docs.map(toCommentDTO);
}

/** Public posts, newest first. */
export async function getPublicPosts(): Promise<PostSummaryDTO[]> {
  await io();
  return cachedPublicPosts();
}

/** A public post by slug, or null for drafts, scheduled and unknown posts. */
export async function getPublicPost(slug: string): Promise<PostDTO | null> {
  await io();
  return cachedPublicPost(slug);
}

/** A post's approved comments, oldest first. */
export async function getApprovedComments(
  postId: string,
): Promise<CommentDTO[]> {
  await io();
  return cachedApprovedComments(postId);
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
