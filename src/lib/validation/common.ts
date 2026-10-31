import { z } from "zod";

/** Treat "", null and whitespace-only strings from form fields as "not provided". */
const emptyToUndefined = (v: unknown) =>
  v === null || (typeof v === "string" && v.trim() === "") ? undefined : v;

// Error messages are shown next to admin form fields, so keep them plain.
const tooLong = (max: number) =>
  `Keep this under ${max.toLocaleString("en")} characters.`;

export const requiredText = (max: number) =>
  z
    .string({ error: "This field is required." })
    .trim()
    .min(1, "This field is required.")
    .max(max, tooLong(max));

export const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max, tooLong(max)).optional(),
  );

/** http(s) URL only: blocks javascript:, data: and other schemes in user-supplied links. */
export const httpUrl = z.url({
  protocol: /^https?$/,
  error: "Enter a full web address starting with https://",
});

export const optionalUrl = z.preprocess(emptyToUndefined, httpUrl.optional());

/**
 * Months are stored as "YYYY-MM" strings: they sort correctly as text, match
 * <input type="month">, and avoid timezone shifts that Date values cause.
 */
export const month = z
  .string({ error: "Choose a month." })
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a month.");

/** An end month; empty means "present" (still ongoing). */
export const optionalMonth = z.preprocess(emptyToUndefined, month.optional());

/** A string list from tag inputs: trimmed, empty entries dropped, duplicates removed. */
export const stringList = (maxItems: number, maxLength: number) =>
  z
    .array(z.string().trim().max(maxLength, tooLong(maxLength)))
    .transform((items) => [...new Set(items.filter(Boolean))])
    .pipe(z.array(z.string()).max(maxItems, `Add at most ${maxItems}.`));

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
