"use server";

import { updateTag } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { isValidId } from "@/lib/admin-crud";
import { requireAdmin } from "@/lib/auth";
import { TAGS } from "@/lib/cache-tags";
import { connectDB } from "@/lib/db";
import { COMMENT_STATUSES, type CommentStatus } from "@/lib/validation";
import { Comment } from "@/models";

const NOT_FOUND: ActionResult = { ok: false, message: "Comment not found." };

const LABELS: Record<CommentStatus, string> = {
  approved: "Approved. It's now on the post.",
  pending: "Moved back to pending.",
  spam: "Marked as spam. It's hidden from the post.",
};

export async function setCommentStatus(
  id: string,
  status: CommentStatus,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidId(id) || !COMMENT_STATUSES.includes(status)) return NOT_FOUND;
  await connectDB();
  const doc = await Comment.findByIdAndUpdate(id, {
    $set: { status },
  }).lean();
  if (!doc) return NOT_FOUND;
  updateTag(TAGS.comments(doc.post.toString()));
  return { ok: true, message: LABELS[status] };
}

export async function deleteComment(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidId(id)) return NOT_FOUND;
  await connectDB();
  const doc = await Comment.findByIdAndDelete(id).lean();
  if (!doc) return NOT_FOUND;
  updateTag(TAGS.comments(doc.post.toString()));
  return { ok: true, message: "Comment deleted." };
}

/** Empty the spam folder. Spam is never shown, so no public page changes. */
export async function deleteAllSpam(): Promise<ActionResult> {
  await requireAdmin();
  await connectDB();
  const { deletedCount } = await Comment.deleteMany({ status: "spam" });
  return {
    ok: true,
    message: `Deleted ${deletedCount} spam comment${deletedCount === 1 ? "" : "s"}.`,
  };
}
