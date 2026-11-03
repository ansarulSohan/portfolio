"use server";

import { z } from "zod";
import { postState } from "@/lib/blog";
import { connectDB } from "@/lib/db";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { commentSchema } from "@/lib/validation";
import { Comment, Post, Settings } from "@/models";

export type CommentFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<"name" | "email" | "body", string>>;
      /** Echo inputs back so a failed submit doesn't wipe what the visitor typed. */
      values?: Record<string, string>;
    };

const LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 }; // 5 comments per 10 minutes per IP
const THANKS = "Thanks! Your comment will appear once it's approved.";

/**
 * A visitor's comment. Always saved as pending: nothing a visitor writes is
 * shown until the admin approves it.
 */
export async function submitComment(
  _previous: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const raw = Object.fromEntries(
    ["postId", "name", "email", "body", "website"].map((key) => [
      key,
      String(formData.get(key) ?? ""),
    ]),
  );

  // Honeypot filled: almost certainly a bot. Pretend it worked so it doesn't retry.
  if (raw.website) return { status: "success", message: THANKS };

  const parsed = commentSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error).fieldErrors;
    if (flat.postId) {
      return { status: "error", message: "This post can't take comments." };
    }
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        name: flat.name?.[0] && "Please enter your name (up to 80 characters).",
        email: flat.email?.[0] && "Please enter a valid email address.",
        body:
          flat.body?.[0] && "Please write a comment (up to 2,000 characters).",
      },
      values: raw,
    };
  }

  try {
    await connectDB();
    const [post, settings] = await Promise.all([
      Post.findById(parsed.data.postId)
        .select("status publishAt commentsOpen")
        .lean(),
      Settings.findOne().select("sections.blog").lean(),
    ]);
    if (
      !post ||
      !settings?.sections?.blog ||
      postState(post) !== "published" ||
      !post.commentsOpen
    ) {
      return { status: "error", message: "Comments are closed on this post." };
    }

    const ipHash = hashIp(await clientIp());
    const { allowed, retryAfterSeconds } = await rateLimit(
      `comment:${ipHash}`,
      LIMIT,
    );
    if (!allowed) {
      const minutes = Math.ceil(retryAfterSeconds / 60);
      return {
        status: "error",
        message: `Too many comments from your network. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
        values: raw,
      };
    }

    const { postId, name, email, body } = parsed.data;
    await Comment.create({ post: postId, name, email, body, ipHash });
    return { status: "success", message: THANKS };
  } catch (error) {
    console.error("Comment failed", error);
    return {
      status: "error",
      message: "Something went wrong posting your comment. Please try again.",
      values: raw,
    };
  }
}
