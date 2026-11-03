import { buildRss } from "@/lib/blog";
import { getProfile, getPublicPosts, getSettings } from "@/lib/queries";
import { siteUrl } from "@/lib/site";

/** RSS 2.0 feed of the 20 latest posts, for feed readers. */
export async function GET() {
  const [settings, posts, profile] = await Promise.all([
    getSettings(),
    getPublicPosts(),
    getProfile(),
  ]);
  if (!settings.sections.blog) {
    return new Response("Not found", { status: 404 });
  }
  const base = siteUrl();
  const xml = buildRss({
    title: profile ? `${profile.name} — Blog` : "Blog",
    description: profile?.tagline ?? "Latest posts",
    siteUrl: `${base}/blog`,
    feedUrl: `${base}/blog/rss.xml`,
    items: posts.slice(0, 20).flatMap((post) =>
      post.publishAt
        ? [
            {
              title: post.title,
              url: `${base}/blog/${post.slug}`,
              excerpt: post.excerpt,
              publishedAt: post.publishAt,
              tags: post.tags,
            },
          ]
        : [],
    ),
  });
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
