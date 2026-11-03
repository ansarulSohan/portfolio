/**
 * Plain, serializable shapes of stored content. `"use cache"` functions and
 * Client Components can only pass plain data, so Mongo documents (ObjectIds,
 * Dates, nulls for unset fields) are mapped to these before leaving the server.
 */
import type { Types } from "mongoose";
import type {
  CommentDoc,
  EducationDoc,
  ExperienceDoc,
  PostDoc,
  ProfileDoc,
  ProjectDoc,
  SettingsDoc,
  SkillCategoryDoc,
} from "@/models";
import type {
  EducationInput,
  ExperienceInput,
  FileInput,
  ImageInput,
  PostStatus,
  ProfileInput,
  ProjectInput,
  SettingsInput,
  SkillCategoryInput,
  SkillLevel,
} from "./validation";

/** What `.lean()` returns: the stored fields plus `_id`. */
export type Lean<T> = T & { _id: Types.ObjectId };

type Listed = { id: string; order: number };

export type ProfileDTO = ProfileInput & { updatedAt: string };
export type ProjectDTO = ProjectInput & Listed & { updatedAt: string };
export type ExperienceDTO = ExperienceInput & Listed;
export type EducationDTO = EducationInput & Listed;
export type SkillCategoryDTO = SkillCategoryInput & Listed;
export type SettingsDTO = SettingsInput;

/** Mongo stores unset optional fields as null or omits them; DTOs use undefined. */
const opt = <T>(value: T | null | undefined): T | undefined =>
  value ?? undefined;

const iso = (value: Date | null | undefined) =>
  value ? value.toISOString() : new Date(0).toISOString();

type StoredImage = { url: string; key: string; alt: string } | null | undefined;
type StoredFile = { url: string; key: string; name: string } | null | undefined;

const toImage = (image: StoredImage): ImageInput | undefined =>
  image ? { url: image.url, key: image.key, alt: image.alt } : undefined;

const toFile = (file: StoredFile): FileInput | undefined =>
  file ? { url: file.url, key: file.key, name: file.name } : undefined;

export function toProfileDTO(doc: Lean<ProfileDoc>): ProfileDTO {
  return {
    name: doc.name,
    title: doc.title,
    tagline: opt(doc.tagline),
    location: opt(doc.location),
    email: doc.email,
    socials: {
      linkedin: opt(doc.socials?.linkedin),
      github: opt(doc.socials?.github),
      x: opt(doc.socials?.x),
      website: opt(doc.socials?.website),
    },
    bio: doc.bio ?? "",
    values: [...(doc.values ?? [])],
    avatar: toImage(doc.avatar),
    resume: toFile(doc.resume),
    seo: {
      title: opt(doc.seo?.title),
      description: opt(doc.seo?.description),
    },
    updatedAt: iso(doc.updatedAt),
  };
}

export function toProjectDTO(doc: Lean<ProjectDoc>): ProjectDTO {
  return {
    id: doc._id.toString(),
    order: doc.order,
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    body: doc.body ?? "",
    tech: [...doc.tech],
    tags: [...doc.tags],
    links: {
      github: opt(doc.links?.github),
      live: opt(doc.links?.live),
      caseStudy: opt(doc.links?.caseStudy),
    },
    cover: toImage(doc.cover),
    gallery: doc.gallery.flatMap((image) => toImage(image) ?? []),
    role: opt(doc.role),
    start: opt(doc.start),
    end: opt(doc.end),
    featured: doc.featured,
    published: doc.published,
    updatedAt: iso(doc.updatedAt),
  };
}

export function toExperienceDTO(doc: Lean<ExperienceDoc>): ExperienceDTO {
  return {
    id: doc._id.toString(),
    order: doc.order,
    role: doc.role,
    company: doc.company,
    companyUrl: opt(doc.companyUrl),
    location: opt(doc.location),
    start: doc.start,
    end: opt(doc.end),
    highlights: [...doc.highlights],
    tech: [...doc.tech],
  };
}

export function toEducationDTO(doc: Lean<EducationDoc>): EducationDTO {
  return {
    id: doc._id.toString(),
    order: doc.order,
    degree: doc.degree,
    institution: doc.institution,
    location: opt(doc.location),
    start: doc.start,
    end: opt(doc.end),
    notes: opt(doc.notes),
  };
}

export function toSkillCategoryDTO(
  doc: Lean<SkillCategoryDoc>,
): SkillCategoryDTO {
  return {
    id: doc._id.toString(),
    order: doc.order,
    name: doc.name,
    items: doc.items.map((item) => ({
      name: item.name,
      level: opt(item.level) as SkillLevel | undefined,
    })),
  };
}

export const DEFAULT_SETTINGS: SettingsDTO = {
  sections: {
    about: true,
    projects: true,
    experience: true,
    skills: true,
    education: true,
    contact: true,
    blog: false,
  },
};

export function toSettingsDTO(doc: Lean<SettingsDoc> | null): SettingsDTO {
  if (!doc) return DEFAULT_SETTINGS;
  const sections = DEFAULT_SETTINGS.sections;
  return {
    sections: {
      about: doc.sections?.about ?? sections.about,
      projects: doc.sections?.projects ?? sections.projects,
      experience: doc.sections?.experience ?? sections.experience,
      skills: doc.sections?.skills ?? sections.skills,
      education: doc.sections?.education ?? sections.education,
      contact: doc.sections?.contact ?? sections.contact,
      blog: doc.sections?.blog ?? sections.blog,
    },
  };
}

// ---- Blog ------------------------------------------------------------------

/** A post in lists and the RSS feed (no body). */
export interface PostSummaryDTO {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  cover?: ImageInput;
  status: PostStatus;
  /** ISO time it goes or went live; absent for drafts never scheduled. */
  publishAt?: string;
  commentsOpen: boolean;
  readingMinutes: number;
  updatedAt: string;
}

export interface PostDTO extends PostSummaryDTO {
  body: string;
  /** Images uploaded into the body. */
  images: { url: string; key: string }[];
}

/** What visitors see of a comment: no email, no IP hash. */
export interface CommentDTO {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

export function toPostSummaryDTO(doc: Lean<PostDoc>): PostSummaryDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    tags: [...doc.tags],
    cover: toImage(doc.cover),
    status: doc.status as PostStatus,
    publishAt: doc.publishAt ? doc.publishAt.toISOString() : undefined,
    commentsOpen: doc.commentsOpen,
    readingMinutes: doc.readingMinutes,
    updatedAt: iso(doc.updatedAt),
  };
}

export function toPostDTO(doc: Lean<PostDoc>): PostDTO {
  return {
    ...toPostSummaryDTO(doc),
    body: doc.body ?? "",
    images: doc.images.map((image) => ({ url: image.url, key: image.key })),
  };
}

export function toCommentDTO(doc: Lean<CommentDoc>): CommentDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    body: doc.body,
    createdAt: iso(doc.createdAt),
  };
}
