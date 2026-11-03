import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminSettings, listPosts } from "@/lib/admin-queries";
import { formatPostDate, postState, type PostState } from "@/lib/blog";

export const metadata: Metadata = { title: "Blog" };

const STATE_LABEL: Record<PostState, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
};

export default async function AdminBlogPage() {
  const [posts, settings] = await Promise.all([
    listPosts(),
    getAdminSettings(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Drafts are only visible here. Scheduled posts go live by themselves
            at their publish time.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <PlusIcon aria-hidden data-icon="inline-start" />
            New post
          </Link>
        </Button>
      </div>

      {!settings.sections.blog && (
        <p className="border-primary/40 bg-primary/5 rounded-lg border px-4 py-3 text-sm">
          The blog is hidden from visitors.{" "}
          <Link
            href="/admin/settings"
            className="text-primary font-medium underline underline-offset-4"
          >
            Turn it on in Settings
          </Link>{" "}
          when you&apos;re ready.
        </p>
      )}

      {posts.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
          No posts yet. Write your first one.
        </p>
      ) : (
        <ul className="bg-card divide-y rounded-xl border">
          {posts.map((post) => {
            const state = postState(post);
            return (
              <li
                key={post.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/blog/${post.id}`}
                    className="font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                  <p className="text-muted-foreground truncate text-sm">
                    {post.excerpt}
                  </p>
                </div>
                {post.pendingComments > 0 && (
                  <Link
                    href="/admin/comments"
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    {post.pendingComments} to approve
                  </Link>
                )}
                <Badge
                  variant={
                    state === "published"
                      ? "default"
                      : state === "scheduled"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {STATE_LABEL[state]}
                </Badge>
                <span className="text-muted-foreground w-36 text-right text-sm tabular-nums">
                  {post.publishAt && state !== "draft" ? (
                    <time dateTime={post.publishAt}>
                      {formatPostDate(post.publishAt)}
                    </time>
                  ) : (
                    "Not published"
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
