import { z } from "zod";

/** Treat "", null and whitespace-only strings from form fields as "not provided". */
const emptyToUndefined = (v: unknown) =>
  v === null || (typeof v === "string" && v.trim() === "") ? undefined : v;

export const requiredText = (max: number) => z.string().trim().min(1).max(max);

export const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

/** http(s) URL only: blocks javascript:, data: and other schemes in user-supplied links. */
export const httpUrl = z.url({ protocol: /^https?$/ });

export const optionalUrl = z.preprocess(emptyToUndefined, httpUrl.optional());

/**
 * Months are stored as "YYYY-MM" strings: they sort correctly as text, match
 * <input type="month">, and avoid timezone shifts that Date values cause.
 */
export const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use the format YYYY-MM");

/** An end month; empty means "present" (still ongoing). */
export const optionalMonth = z.preprocess(emptyToUndefined, month.optional());

/** A string list from tag inputs: trimmed, empty entries dropped, duplicates removed. */
export const stringList = (maxItems: number, maxLength: number) =>
  z
    .array(z.string().trim().max(maxLength))
    .transform((items) => [...new Set(items.filter(Boolean))])
    .pipe(z.array(z.string()).max(maxItems));

/** An uploaded image in the bucket. Alt text is required for accessibility. */
export const imageSchema = z.object({
  url: httpUrl,
  key: requiredText(512),
  alt: requiredText(300),
});

/** An uploaded non-image file, such as the resume PDF. */
export const fileSchema = z.object({
  url: httpUrl,
  key: requiredText(512),
  name: requiredText(200),
});

/** Rejects ranges whose end month is before their start month. */
export function endNotBeforeStart(value: { start?: string; end?: string }) {
  return !value.start || !value.end || value.end >= value.start;
}

export type ImageInput = z.infer<typeof imageSchema>;
export type FileInput = z.infer<typeof fileSchema>;
