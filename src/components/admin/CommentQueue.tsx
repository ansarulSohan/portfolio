"use client";

import Link from "next/link";
import {
  CheckIcon,
  ExternalLinkIcon,
  ShieldAlertIcon,
  UndoIcon,
} from "lucide-react";
import {
  deleteAllSpam,
  deleteComment,
  setCommentStatus,
} from "@/actions/admin/comments";
import { Button } from "@/components/ui/button";
import type { AdminCommentDTO } from "@/lib/admin-queries";
import { BLOG_TIME_ZONE } from "@/lib/blog";
import { cn } from "@/lib/utils";
import type { CommentStatus } from "@/lib/validation";
import { ConfirmDelete } from "./ConfirmDelete";
import { useAdminAction } from "./useAdminAction";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: BLOG_TIME_ZONE,
});

const TABS: { status: CommentStatus; label: string; empty: string }[] = [
  {
    status: "pending",
    label: "Pending",
    empty: "Nothing waiting for approval.",
  },
  { status: "approved", label: "Approved", empty: "No approved comments yet." },
  { status: "spam", label: "Spam", empty: "No spam. Nice." },
];

/**
 * Moderation queue. Visitors' comments arrive as pending; approving one puts
 * it on the post, spam hides it. Tabs are links, so each view has its own URL.
 */
export function CommentQueue({
  status,
  comments,
  counts,
}: {
  status: CommentStatus;
  comments: AdminCommentDTO[];
  counts: Record<CommentStatus, number>;
}) {
  const { pending, run } = useAdminAction();
  const tab = TABS.find((t) => t.status === status) ?? TABS[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comments</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Nothing appears on a post until you approve it.
          </p>
        </div>
        {status === "spam" && counts.spam > 0 && (
          <ConfirmDelete
            itemName="all spam"
            disabled={pending}
            description={`${counts.spam} spam comment${counts.spam === 1 ? " is" : "s are"} deleted for good.`}
            onConfirm={() => run(() => deleteAllSpam())}
          />
        )}
      </div>

      <nav aria-label="Comment status">
        <ul className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <li key={t.status}>
              <Link
                href={`/admin/comments?status=${t.status}`}
                aria-current={t.status === status ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  t.status === status
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t.label}
                <span className="tabular-nums">{counts[t.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {comments.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
          {tab.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-3" aria-busy={pending}>
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={cn(
                "bg-card rounded-xl border p-4",
                status === "pending" && "border-primary/40",
              )}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold">{comment.name}</span>
                <a
                  href={`mailto:${comment.email}`}
                  className="text-muted-foreground hover:underline"
                >
                  {comment.email}
                </a>
                <time
                  dateTime={comment.createdAt}
                  className="text-muted-foreground ml-auto text-xs tabular-nums"
                >
                  {dateFormat.format(new Date(comment.createdAt))}
                </time>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                On{" "}
                {comment.post ? (
                  <Link
                    href={`/admin/blog/${comment.post.id}`}
                    className="text-foreground font-medium hover:underline"
                  >
                    {comment.post.title}
                  </Link>
                ) : (
                  "a deleted post"
                )}
              </p>
              <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">
                {comment.body}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {status !== "approved" && (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() => setCommentStatus(comment.id, "approved"))
                    }
                  >
                    <CheckIcon aria-hidden data-icon="inline-start" />
                    Approve
                    <span className="sr-only"> comment by {comment.name}</span>
                  </Button>
                )}
                {status !== "spam" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      run(() => setCommentStatus(comment.id, "spam"))
                    }
                  >
                    <ShieldAlertIcon aria-hidden data-icon="inline-start" />
                    {status === "approved" ? "Hide as spam" : "Spam"}
                    <span className="sr-only"> comment by {comment.name}</span>
                  </Button>
                )}
                {status === "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      run(() => setCommentStatus(comment.id, "pending"))
                    }
                  >
                    <UndoIcon aria-hidden data-icon="inline-start" />
                    Unapprove
                    <span className="sr-only"> comment by {comment.name}</span>
                  </Button>
                )}
                {status === "approved" && comment.post && (
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      href={`/blog/${comment.post.slug}#comment-${comment.id}`}
                      target="_blank"
                    >
                      View
                      <ExternalLinkIcon aria-hidden data-icon="inline-end" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </Link>
                  </Button>
                )}
                <div className="ml-auto">
                  <ConfirmDelete
                    itemName={`comment by ${comment.name}`}
                    disabled={pending}
                    onConfirm={() => run(() => deleteComment(comment.id))}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
