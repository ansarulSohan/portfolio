import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { CommentForm } from "@/components/site/CommentForm";
import { Markdown } from "@/components/site/Markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPostDate } from "@/lib/blog";
import {
  getApprovedComments,
  getProfile,
  getPublicPost,
  getSettings,
} from "@/lib/queries";

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [post, settings, profile] = await Promise.all([
    getPublicPost(slug),
    getSettings(),
    getProfile(),
  ]);
  if (!post || !settings.sections.blog) {
    return { title: "Post not found", robots: { index: false } };
  }
  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishAt,
      modifiedTime: post.updatedAt,
      tags: post.tags,
      ...(profile && { authors: [profile.name] }),
      ...(post.cover && {
        images: [{ url: post.cover.url, alt: post.cover.alt }],
      }),
    },
  };
}

const commentDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Oslo",
});

/** Approved comments as plain text (no links or Markdown, so spam gains nothing). */
async function Comments({ postId, open }: { postId: string; open: boolean }) {
  const comments = await getApprovedComments(postId);
  return (
    <>
      <h2
        id="comments-heading"
        className="text-xl font-semibold tracking-tight"
      >
        {comments.length === 0
          ? "Comments"
          : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
      </h2>
      {comments.length > 0 && (
        <ol className="mt-6 flex flex-col gap-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              id={`comment-${comment.id}`}
              className="bg-card scroll-mt-24 rounded-xl border p-4"
            >
              <p className="text-sm">
                <span className="font-semibold">{comment.name}</span>
                <span className="text-muted-foreground">
                  {" · "}
                  <time dateTime={comment.createdAt}>
                    {commentDate.format(new Date(comment.createdAt))}
                  </time>
                </span>
              </p>
              <p className="mt-2 leading-7 break-words whitespace-pre-wrap">
                {comment.body}
              </p>
            </li>
          ))}
        </ol>
      )}
      {open ? (
        <div className="mt-8">
          <h3 className="mb-4 font-semibold">Leave a comment</h3>
          <CommentForm postId={postId} />
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">
          Comments are closed.
        </p>
      )}
    </>
  );
}

async function PostDetail({
  params,
}: Pick<PageProps<"/blog/[slug]">, "params">) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getPublicPost(slug),
    getSettings(),
  ]);
  if (!post || !settings.sections.blog || !post.publishAt) notFound();

  return (
    <>
      <article className="animate-fade-up">
        <header className="max-w-3xl">
          <p className="text-muted-foreground text-sm">
            <time dateTime={post.publishAt}>
              {formatPostDate(post.publishAt)}
            </time>
            <span aria-hidden> · </span>
            {post.readingMinutes} min read
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {post.title}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            {post.excerpt}
          </p>
          {post.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Tags">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Link href={`/blog?tag=${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary">{tag}</Badge>
                    <span className="sr-only"> (show posts tagged {tag})</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </header>

        {post.cover && (
          <Image
            src={post.cover.url}
            alt={post.cover.alt}
            width={1280}
            height={720}
            priority
            sizes="(min-width: 1024px) 976px, 100vw"
            className="mt-10 w-full rounded-xl border"
          />
        )}

        <Markdown className="mt-10 max-w-[70ch] leading-7">
          {post.body}
        </Markdown>
      </article>

      <section
        aria-labelledby="comments-heading"
        className="mt-16 max-w-[70ch] border-t pt-10"
      >
        <Suspense fallback={<Skeleton className="h-32 w-full" aria-hidden />}>
          <Comments postId={post.id} open={post.commentsOpen} />
        </Suspense>
      </section>
    </>
  );
}

function PostSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading post">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-10 w-full max-w-xl" />
      <Skeleton className="mt-4 h-6 w-full max-w-2xl" />
      <Skeleton className="mt-10 h-64 w-full max-w-[70ch]" />
    </div>
  );
}

export default function PostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <div className="py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-8 -ml-2.5">
        <Link href="/blog">
          <ArrowLeftIcon aria-hidden data-icon="inline-start" />
          All posts
        </Link>
      </Button>
      {/* params is awaited inside Suspense so unknown slugs still get the static shell. */}
      <Suspense fallback={<PostSkeleton />}>
        <PostDetail params={params} />
      </Suspense>
    </div>
  );
}
