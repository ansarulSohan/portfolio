/**
 * Blog helpers with no server-only imports, shared by the admin editor, the
 * public pages, the RSS feed and unit tests.
 */

/** Post times are entered and shown in Norway time, whatever the server's zone. */
export const BLOG_TIME_ZONE = "Europe/Oslo";

/** About 200 words a minute; never less than one minute. */
export function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Wall-clock parts of `date` in `timeZone`. */
function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

/** Milliseconds `timeZone` is ahead of UTC at `date` (e.g. +1h or +2h for Oslo). */
function zoneOffset(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(date.getTime() / 60_000) * 60_000;
}

/**
 * "2026-03-29T10:30" in Norway time → the real instant. Handles summer time;
 * returns null for malformed input.
 */
export function zonedInputToDate(
  value: string,
  timeZone = BLOG_TIME_ZONE,
): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const wallAsUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Guess with the offset at that moment, then correct once across a DST change.
  let instant = wallAsUtc - zoneOffset(new Date(wallAsUtc), timeZone);
  instant = wallAsUtc - zoneOffset(new Date(instant), timeZone);
  return new Date(instant);
}

/** An ISO instant → "YYYY-MM-DDTHH:mm" in Norway time, for datetime-local inputs. */
export function dateToZonedInput(
  iso: string | undefined,
  timeZone = BLOG_TIME_ZONE,
): string {
  if (!iso) return "";
  const p = zonedParts(new Date(iso), timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: BLOG_TIME_ZONE,
});

/** "1 November 2026". A fixed zone, so server and client always agree. */
export function formatPostDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export type PostState = "draft" | "scheduled" | "published";

/** What a post looks like to visitors right now. */
export function postState(
  post: { status: string; publishAt?: string | Date | null },
  now = Date.now(),
): PostState {
  if (post.status !== "published" || !post.publishAt) return "draft";
  return new Date(post.publishAt).getTime() > now ? "scheduled" : "published";
}

/**
 * How long a cached public list may live, in seconds: until the next scheduled
 * post goes live, but at least a minute and at most an hour.
 */
export function secondsUntil(next: Date | null | undefined, now = Date.now()) {
  if (!next) return 3600;
  return Math.min(3600, Math.max(60, Math.ceil((next.getTime() - now) / 1000)));
}

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(value: string): string {
  // Also drop control characters XML 1.0 doesn't allow.
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);
}

/** RSS 2.0 for the latest posts. Links must be absolute. */
export function buildRss(feed: {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  items: {
    title: string;
    url: string;
    excerpt: string;
    publishedAt: string;
    tags: string[];
  }[];
}): string {
  const items = feed.items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(item.excerpt)}</description>
${item.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");
  const updated = feed.items[0]?.publishedAt;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feed.title)}</title>
    <link>${escapeXml(feed.siteUrl)}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(feed.feedUrl)}" rel="self" type="application/rss+xml" />
${updated ? `    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;
}
