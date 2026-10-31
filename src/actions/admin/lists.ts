"use server";

/*
 * Experience, education and skill categories: simple ordered lists with the
 * same create / update / delete / move operations.
 */
import { updateTag } from "next/cache";
import type { Model } from "mongoose";
import type { z } from "zod";
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
import {
  educationSchema,
  experienceSchema,
  skillCategorySchema,
} from "@/lib/validation";
import { Education, Experience, SkillCategory } from "@/models";

export type ListKind = "experience" | "education" | "skills";

/** The three models differ in fields; these shared operations only need a plain document. */
type ListDoc = Record<string, unknown>;

interface ListConfig {
  model: Model<ListDoc>;
  schema: z.ZodType<Record<string, unknown>>;
  tag: string;
  noun: string;
}

const LISTS: Record<ListKind, ListConfig> = {
  experience: {
    model: Experience as unknown as Model<ListDoc>,
    schema: experienceSchema,
    tag: TAGS.experience,
    noun: "Experience",
  },
  education: {
    model: Education as unknown as Model<ListDoc>,
    schema: educationSchema,
    tag: TAGS.education,
    noun: "Education entry",
  },
  skills: {
    model: SkillCategory as unknown as Model<ListDoc>,
    schema: skillCategorySchema,
    tag: TAGS.skills,
    noun: "Skill group",
  },
};

/** Server actions take untrusted input: check `kind` against the known lists. */
function config(kind: unknown): ListConfig | null {
  return typeof kind === "string" && Object.hasOwn(LISTS, kind)
    ? LISTS[kind as ListKind]
    : null;
}

const NOT_FOUND: ActionResult = {
  ok: false,
  message: "That item no longer exists.",
};

export async function createListItem(
  kind: ListKind,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const list = config(kind);
  if (!list) return NOT_FOUND;
  const parsed = list.schema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  await connectDB();
  const doc = await list.model.create({
    ...parsed.data,
    order: await nextOrder(list.model),
  });
  updateTag(list.tag);
  return {
    ok: true,
    message: `${list.noun} added.`,
    data: { id: String(doc._id) },
  };
}

export async function updateListItem(
  kind: ListKind,
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const list = config(kind);
  if (!list || !isValidId(id)) return NOT_FOUND;
  const parsed = list.schema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  await connectDB();
  const updated = await list.model
    .findByIdAndUpdate(id, toUpdate(parsed.data))
    .lean();
  if (!updated) return NOT_FOUND;
  updateTag(list.tag);
  return { ok: true, message: `${list.noun} saved.` };
}

export async function deleteListItem(
  kind: ListKind,
  id: string,
): Promise<ActionResult> {
  await requireAdmin();
  const list = config(kind);
  if (!list || !isValidId(id)) return NOT_FOUND;
  await connectDB();
  const deleted = await list.model.findByIdAndDelete(id).lean();
  if (!deleted) return NOT_FOUND;
  updateTag(list.tag);
  return { ok: true, message: `${list.noun} deleted.` };
}

export async function moveListItem(
  kind: ListKind,
  id: string,
  direction: Direction,
): Promise<ActionResult> {
  await requireAdmin();
  const list = config(kind);
  if (!list || (direction !== "up" && direction !== "down")) return NOT_FOUND;
  if (!(await moveDocument(list.model, id, direction))) {
    return { ok: false, message: "Couldn't move that item." };
  }
  updateTag(list.tag);
  return { ok: true, message: `Moved ${direction}.` };
}
