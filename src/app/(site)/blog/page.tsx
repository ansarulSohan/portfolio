import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RssIcon } from "lucide-react";
import { PostCard } from "@/components/site/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicPosts, getSettings } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes and write-ups on software, infrastructure and what I'm learning.",
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
};

async function PostList({
  searchParams,
}: Pick<PageProps<"/blog">, "searchParams">) {
  const [settings, posts, { tag: rawTag }] = await Promise.all([
    getSettings(),
    getPublicPosts(),
    searchParams,
  ]);
  if (!settings.sections.blog) notFound();

  const tag = typeof rawTag === "string" ? rawTag : null;
  const tags = [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) =>
    a.localeCompare(b),
  );
  const shown = tag ? posts.filter((post) => post.tags.includes(tag)) : posts;

  if (posts.length === 0) {
    return (
      <p className="text-muted-foreground">No posts yet. Check back soon.</p>
    );
  }

  return (
    <>
      {tags.length > 0 && (
        <nav aria-label="Filter by tag" className="mb-8">
          <ul className="flex flex-wrap gap-2">
            {[null, ...tags].map((value) => {
              const active = value === tag;
              return (
                <li key={value ?? "all"}>
                  <Link
                    href={
                      value ? `/blog?tag=${encodeURIComponent(value)}` : "/blog"
                    }
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted",
                    )}
                  >
                    {value ?? "All posts"}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      <p className="sr-only" role="status">
        {tag ? `${shown.length} posts tagged ${tag}` : `${shown.length} posts`}
      </p>
      {shown.length === 0 ? (
        <p className="text-muted-foreground">
          No posts tagged “{tag}”.{" "}
          <Link
            href="/blog"
            className="text-primary font-medium underline underline-offset-4"
          >
            Show all posts
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {shown.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </>
  );
}

function PostListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading posts"
      className="flex flex-col gap-5"
    >
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function BlogPage({ searchParams }: PageProps<"/blog">) {
  return (
    <div className="animate-fade-up mx-auto max-w-3xl py-16 sm:py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Blog
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Notes on what I&apos;m building and learning.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="/blog/rss.xml">
            <RssIcon aria-hidden data-icon="inline-start" />
            RSS feed
          </a>
        </Button>
      </div>
      <Suspense fallback={<PostListSkeleton />}>
        <PostList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
