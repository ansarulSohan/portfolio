/**
 * Public base URL of the site, for metadataBase, canonical links and the sitemap.
 * NEXT_PUBLIC_* values are inlined at build time, so set it as a build variable
 * in Coolify (it isn't secret).
 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

/** "2023-06" → "Jun 2023". Fixed English names so server and client always agree. */
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  return `${MONTH_NAMES[Number(m) - 1] ?? ""} ${year}`.trim();
}

/** "Jun 2023 – Jul 2023", "Jun 2023 – Present", or a single month when start = end. */
export function formatRange(start?: string, end?: string): string {
  if (!start) return end ? formatMonth(end) : "";
  if (start === end) return formatMonth(start);
  return `${formatMonth(start)} – ${end ? formatMonth(end) : "Present"}`;
}
