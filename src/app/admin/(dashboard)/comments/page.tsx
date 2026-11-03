import type { Metadata } from "next";
import { CommentQueue } from "@/components/admin/CommentQueue";
import { countComments, listComments } from "@/lib/admin-queries";
import { COMMENT_STATUSES, type CommentStatus } from "@/lib/validation";

export const metadata: Metadata = { title: "Comments" };

export default async function CommentsPage({
  searchParams,
}: PageProps<"/admin/comments">) {
  const { status: requested } = await searchParams;
  const status: CommentStatus = COMMENT_STATUSES.includes(
    requested as CommentStatus,
  )
    ? (requested as CommentStatus)
    : "pending";
  const [comments, counts] = await Promise.all([
    listComments(status),
    countComments(),
  ]);
  return <CommentQueue status={status} comments={comments} counts={counts} />;
}
