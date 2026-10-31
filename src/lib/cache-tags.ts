/**
 * Cache tags for public content. Reads in lib/queries.ts tag their cache
 * entries with these; admin server actions call `updateTag()` with the same
 * tag after a write so the public site shows the change on the next request.
 */
export const TAGS = {
  profile: "profile",
  projects: "projects",
  /** One project page, so editing a project only refreshes that page and the lists. */
  project: (slug: string) => `project:${slug}`,
  experience: "experience",
  education: "education",
  skills: "skills",
  settings: "settings",
} as const;
