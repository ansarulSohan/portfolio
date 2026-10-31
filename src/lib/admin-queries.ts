import "server-only";
import { Types } from "mongoose";
import { requireAdmin } from "./auth";
import { connectDB } from "./db";
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
  Message,
  Profile,
  Project,
  Settings,
  SkillCategory,
  type EducationDoc,
  type ExperienceDoc,
  type MessageDoc,
  type ProfileDoc,
  type ProjectDoc,
  type SettingsDoc,
  type SkillCategoryDoc,
} from "@/models";

/*
 * Admin reads: never cached (the editor must see exactly what's stored) and
 * they include unpublished projects. Each one checks the session itself, so
 * it's safe even if a page forgets to.
 */

async function adminDB() {
  await requireAdmin();
  await connectDB();
}

const validId = (id: string) => Types.ObjectId.isValid(id);

export async function getAdminProfile(): Promise<ProfileDTO | null> {
  await adminDB();
  const doc = await Profile.findOne().lean<Lean<ProfileDoc>>();
  return doc ? toProfileDTO(doc) : null;
}

export async function getAdminSettings(): Promise<SettingsDTO> {
  await adminDB();
  return toSettingsDTO(await Settings.findOne().lean<Lean<SettingsDoc>>());
}

export async function listProjects(): Promise<ProjectDTO[]> {
  await adminDB();
  const docs = await Project.find()
    .sort({ order: 1, createdAt: -1 })
    .lean<Lean<ProjectDoc>[]>();
  return docs.map(toProjectDTO);
}

export async function getProject(id: string): Promise<ProjectDTO | null> {
  await adminDB();
  if (!validId(id)) return null;
  const doc = await Project.findById(id).lean<Lean<ProjectDoc>>();
  return doc ? toProjectDTO(doc) : null;
}

export async function listExperience(): Promise<ExperienceDTO[]> {
  await adminDB();
  const docs = await Experience.find()
    .sort({ order: 1, start: -1 })
    .lean<Lean<ExperienceDoc>[]>();
  return docs.map(toExperienceDTO);
}

export async function getExperienceItem(
  id: string,
): Promise<ExperienceDTO | null> {
  await adminDB();
  if (!validId(id)) return null;
  const doc = await Experience.findById(id).lean<Lean<ExperienceDoc>>();
  return doc ? toExperienceDTO(doc) : null;
}

export async function listEducation(): Promise<EducationDTO[]> {
  await adminDB();
  const docs = await Education.find()
    .sort({ order: 1, start: -1 })
    .lean<Lean<EducationDoc>[]>();
  return docs.map(toEducationDTO);
}

export async function getEducationItem(
  id: string,
): Promise<EducationDTO | null> {
  await adminDB();
  if (!validId(id)) return null;
  const doc = await Education.findById(id).lean<Lean<EducationDoc>>();
  return doc ? toEducationDTO(doc) : null;
}

export async function listSkillCategories(): Promise<SkillCategoryDTO[]> {
  await adminDB();
  const docs = await SkillCategory.find()
    .sort({ order: 1 })
    .lean<Lean<SkillCategoryDoc>[]>();
  return docs.map(toSkillCategoryDTO);
}

export async function getSkillCategory(
  id: string,
): Promise<SkillCategoryDTO | null> {
  await adminDB();
  if (!validId(id)) return null;
  const doc = await SkillCategory.findById(id).lean<Lean<SkillCategoryDoc>>();
  return doc ? toSkillCategoryDTO(doc) : null;
}

export interface MessageDTO {
  id: string;
  name: string;
  email: string;
  subject?: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export async function listMessages(): Promise<MessageDTO[]> {
  await adminDB();
  const docs = await Message.find()
    .sort({ createdAt: -1 })
    .limit(500)
    .lean<Lean<MessageDoc>[]>();
  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    subject: doc.subject ?? undefined,
    body: doc.body,
    read: doc.read,
    createdAt: (doc.createdAt ?? new Date(0)).toISOString(),
  }));
}

export async function getDashboardStats() {
  await adminDB();
  const [projects, published, experience, education, skills, messages, unread] =
    await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ published: true }),
      Experience.countDocuments(),
      Education.countDocuments(),
      SkillCategory.countDocuments(),
      Message.countDocuments(),
      Message.countDocuments({ read: false }),
    ]);
  return {
    projects,
    published,
    experience,
    education,
    skills,
    messages,
    unread,
  };
}

export async function countUnreadMessages(): Promise<number> {
  await adminDB();
  return Message.countDocuments({ read: false });
}
