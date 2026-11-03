"use server";

import { updateTag } from "next/cache";
import type { z } from "zod";
import { invalid, type ActionResult } from "@/lib/action-result";
import { isValidId } from "@/lib/admin-crud";
import { requireAdmin } from "@/lib/auth";
import { readingMinutes, zonedInputToDate } from "@/lib/blog";
import { TAGS } from "@/lib/cache-tags";
import { connectDB } from "@/lib/db";
import { deleteObject } from "@/lib/s3";
import { postFormSchema } from "@/lib/validation";
import { Comment, Post } from "@/models";

const SLUG_TAKEN: ActionResult = {
  ok: false,
  message: "Some fields need attention.",
  errors: { slug: "Another post already uses this URL." },
};
const NOT_FOUND: ActionResult = { ok: false, message: "Post not found." };

function refresh(...slugs: (string | undefined)[]) {
  updateTag(TAGS.posts);
  for (const slug of new Set(slugs)) if (slug) updateTag(TAGS.post(slug));
}

type PostFields = Omit<z.output<typeof postFormSchema>, "publishAt"> & {
  readingMinutes: number;
};

type Parsed =
  | { ok: true; fields: PostFields; publishAt?: Date }
  | { ok: false; result: ActionResult<never> };

/**
 * Validate the editor's fields and turn the Norway-time publish field into a
 * date. Publishing without a time means "now".
 */
function parse(input: unknown): Parsed {
  const parsed = postFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, result: invalid(parsed.error) };
  const { publishAt: localTime, ...fields } = parsed.data;
  let publishAt = localTime ? zonedInputToDate(localTime) : undefined;
  if (localTime && !publishAt) {
    return {
      ok: false,
      result: {
        ok: false,
        message: "Some fields need attention.",
        errors: { publishAt: "Choose a date and time." },
      },
    };
  }
  if (fields.status === "published" && !publishAt) publishAt = new Date();
  return {
    ok: true,
    publishAt: publishAt ?? undefined,
    fields: { ...fields, readingMinutes: readingMinutes(fields.body) },
  };
}

export async function createPost(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = parse(input);
  if (!parsed.ok) return parsed.result;

  await connectDB();
  if (await Post.exists({ slug: parsed.fields.slug })) return SLUG_TAKEN;
  const doc = await Post.create({
    ...parsed.fields,
    ...(parsed.publishAt && { publishAt: parsed.publishAt }),
  });
  refresh(doc.slug);
  return {
    ok: true,
    message: "Post created.",
    data: { id: doc._id.toString() },
  };
}

export async function updatePost(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidId(id)) return NOT_FOUND;
  const parsed = parse(input);
  if (!parsed.ok) return parsed.result;

  await connectDB();
  if (await Post.exists({ slug: parsed.fields.slug, _id: { $ne: id } }))
    return SLUG_TAKEN;
  const current = await Post.findById(id).select("slug images").lean();
  if (!current) return NOT_FOUND;

  // Body images the new text no longer uses are removed from storage.
  const { body } = parsed.fields;
  const unused = current.images.filter((image) => !body.includes(image.url));
  const kept = current.images.filter((image) => body.includes(image.url));

  const $set = { ...parsed.fields, images: kept };
  await Post.updateOne(
    { _id: id },
    parsed.publishAt
      ? { $set: { ...$set, publishAt: parsed.publishAt } }
      : // A draft with the time cleared: drop the old time.
        { $set, $unset: { publishAt: 1 } },
  );
  await Promise.all(unused.map((image) => deleteObject(image.key)));

  // Refresh both URLs if the slug changed.
  refresh(current.slug, parsed.fields.slug);
  return {
    ok: true,
    message:
      unused.length > 0
        ? `Post saved. Removed ${unused.length} unused image${unused.length === 1 ? "" : "s"}.`
        : "Post saved.",
  };
}

export async function deletePost(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidId(id)) return NOT_FOUND;
  await connectDB();
  const deleted = await Post.findByIdAndDelete(id).lean();
  if (!deleted) return NOT_FOUND;
  // Its comments and every image it used go too.
  await Comment.deleteMany({ post: deleted._id });
  await Promise.all(
    [deleted.cover?.key, ...deleted.images.map((image) => image.key)].map(
      deleteObject,
    ),
  );
  refresh(deleted.slug);
  updateTag(TAGS.comments(id));
  return { ok: true, message: `Deleted “${deleted.title}”.` };
}
