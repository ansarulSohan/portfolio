import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPostDate } from "@/lib/blog";
import type { PostSummaryDTO } from "@/lib/dto";

/** A post in the blog list: the title is the link; tags filter the list. */
export function PostCard({
  post,
  headingLevel = "h2",
}: {
  post: PostSummaryDTO;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <article className="group bg-card hover:border-primary/50 relative rounded-xl border p-5 transition-colors focus-within:ring-2 focus-within:ring-ring sm:p-6">
      <p className="text-muted-foreground text-sm">
        {post.publishAt && (
          <time dateTime={post.publishAt}>
            {formatPostDate(post.publishAt)}
          </time>
        )}
        <span aria-hidden> · </span>
        <span>{post.readingMinutes} min read</span>
      </p>
      <Heading className="mt-2 text-xl font-semibold tracking-tight text-balance">
        <Link
          href={`/blog/${post.slug}`}
          className="outline-none after:absolute after:inset-0 after:content-['']"
        >
          {post.title}
        </Link>
      </Heading>
      <p className="text-muted-foreground mt-2 leading-7">{post.excerpt}</p>
      {post.tags.length > 0 && (
        <ul
          className="relative z-10 mt-4 flex flex-wrap gap-1.5"
          aria-label="Tags"
        >
          {post.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="rounded-md"
              >
                <Badge variant="secondary" className="hover:bg-secondary/70">
                  {tag}
                </Badge>
                <span className="sr-only"> (show posts tagged {tag})</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
