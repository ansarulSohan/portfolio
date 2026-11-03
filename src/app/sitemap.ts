import type { MetadataRoute } from "next";
import {
  getPublicPosts,
  getPublishedProjects,
  getSettings,
} from "@/lib/queries";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [projects, settings, posts] = await Promise.all([
    getPublishedProjects(),
    getSettings(),
    getPublicPosts(),
  ]);
  const blog = settings.sections.blog
    ? [
        {
          url: `${base}/blog`,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        },
        ...posts.map((post) => ({
          url: `${base}/blog/${post.slug}`,
          lastModified: post.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        })),
      ]
    : [];
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/projects`, changeFrequency: "monthly", priority: 0.8 },
    ...projects.map((project) => ({
      url: `${base}/projects/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...blog,
  ];
}
