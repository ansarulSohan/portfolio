"use server";

import { updateTag } from "next/cache";
import { invalid, type ActionResult } from "@/lib/action-result";
import {
  isValidId,
  moveDocument,
  nextOrder,
  toUpdate,
  type Direction,
} from "@/lib/admin-crud";
import { requireAdmin } from "@/lib/auth";
import { TAGS } from "@/lib/cache-tags";
import { connectDB } from "@/lib/db";
import { projectFormSchema } from "@/lib/validation";
import { Project } from "@/models";

const SLUG_TAKEN: ActionResult = {
  ok: false,
  message: "Some fields need attention.",
  errors: { slug: "Another project already uses this URL." },
};

function refresh(...slugs: (string | undefined)[]) {
  updateTag(TAGS.projects);
  for (const slug of new Set(slugs)) if (slug) updateTag(TAGS.project(slug));
}

export async function createProject(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  await connectDB();
  if (await Project.exists({ slug: parsed.data.slug })) return SLUG_TAKEN;
  const doc = await Project.create({
    ...parsed.data,
    gallery: [],
    order: await nextOrder(Project),
  });
  refresh(doc.slug);
  return {
    ok: true,
    message: "Project created.",
    data: { id: doc._id.toString() },
  };
}

export async function updateProject(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidId(id)) return { ok: false, message: "Project not found." };
  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  await connectDB();
  if (await Project.exists({ slug: parsed.data.slug, _id: { $ne: id } }))
    return SLUG_TAKEN;
  const previous = await Project.findByIdAndUpdate(
    id,
    toUpdate(parsed.data),
  ).lean();
  if (!previous) return { ok: false, message: "Project not found." };
  // Refresh both URLs if the slug changed.
  refresh(previous.slug, parsed.data.slug);
  return { ok: true, message: "Project saved." };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidId(id)) return { ok: false, message: "Project not found." };
  await connectDB();
  const deleted = await Project.findByIdAndDelete(id).lean();
  if (!deleted) return { ok: false, message: "Project not found." };
  refresh(deleted.slug);
  return { ok: true, message: `Deleted “${deleted.title}”.` };
}

export async function moveProject(
  id: string,
  direction: Direction,
): Promise<ActionResult> {
  await requireAdmin();
  if (!(await moveDocument(Project, id, direction))) {
    return { ok: false, message: "Couldn't move that project." };
  }
  updateTag(TAGS.projects);
  return { ok: true, message: `Moved ${direction}.` };
}

/** Quick toggles from the project list. */
export async function setProjectFlag(
  id: string,
  flag: "published" | "featured",
  value: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidId(id) || (flag !== "published" && flag !== "featured")) {
    return { ok: false, message: "Project not found." };
  }
  await connectDB();
  const doc = await Project.findByIdAndUpdate(id, {
    $set: { [flag]: value === true },
  }).lean();
  if (!doc) return { ok: false, message: "Project not found." };
  refresh(doc.slug);
  const label =
    flag === "published"
      ? value
        ? "Published"
        : "Unpublished"
      : value
        ? "Featured"
        : "No longer featured";
  return { ok: true, message: `${label}: ${doc.title}.` };
}
