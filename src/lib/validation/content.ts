import { z } from "zod";
import {
  endNotBeforeStart,
  fileSchema,
  imageSchema,
  month,
  optionalMonth,
  optionalText,
  optionalUrl,
  requiredText,
  stringList,
} from "./common";
import { SLUG_PATTERN } from "../slug";

const endAfterStart = {
  message: "End month must not be before the start month",
  path: ["end"],
};

export const profileSchema = z.object({
  name: requiredText(120),
  title: requiredText(120),
  tagline: optionalText(200),
  location: optionalText(120),
  email: z.email("Enter a valid email address."),
  socials: z.object({
    linkedin: optionalUrl,
    github: optionalUrl,
    x: optionalUrl,
    website: optionalUrl,
  }),
  /** Markdown. */
  bio: z.string().trim().max(10_000),
  /** Short value statements shown as chips, e.g. "Systems thinking". */
  values: stringList(10, 60),
  avatar: imageSchema.optional(),
  resume: fileSchema.optional(),
  seo: z.object({
    title: optionalText(70),
    description: optionalText(160),
  }),
});

export const projectFields = z.object({
  title: requiredText(120),
  slug: z
    .string()
    .trim()
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens")
    .max(80),
  /** One or two sentences, shown on cards. */
  summary: requiredText(300),
  /** Markdown case study, shown on the project page. */
  body: z.string().trim().max(50_000),
  tech: stringList(30, 40),
  tags: stringList(20, 40),
  links: z.object({
    github: optionalUrl,
    live: optionalUrl,
    caseStudy: optionalUrl,
  }),
  cover: imageSchema.optional(),
  gallery: z.array(imageSchema).max(20),
  role: optionalText(120),
  start: optionalMonth,
  end: optionalMonth,
  featured: z.boolean(),
  published: z.boolean(),
});

export const projectSchema = projectFields.refine(
  endNotBeforeStart,
  endAfterStart,
);

export const experienceFields = z.object({
  role: requiredText(120),
  company: requiredText(120),
  companyUrl: optionalUrl,
  location: optionalText(120),
  start: month,
  end: optionalMonth,
  highlights: stringList(15, 500),
  tech: stringList(30, 40),
});

export const experienceSchema = experienceFields.refine(
  endNotBeforeStart,
  endAfterStart,
);

export const educationFields = z.object({
  degree: requiredText(160),
  institution: requiredText(160),
  location: optionalText(120),
  start: month,
  end: optionalMonth,
  notes: optionalText(2_000),
});

export const educationSchema = educationFields.refine(
  endNotBeforeStart,
  endAfterStart,
);

export const SKILL_LEVELS = ["familiar", "proficient", "expert"] as const;

export const skillCategorySchema = z.object({
  name: requiredText(80),
  items: z
    .array(
      z.object({
        name: requiredText(60),
        level: z.enum(SKILL_LEVELS).optional(),
      }),
    )
    .max(40),
});

/**
 * Editor variants: image fields are managed by the upload UI, not the form,
 * so saving a form never overwrites them.
 */
export const profileFormSchema = profileSchema.omit({
  avatar: true,
  resume: true,
});
export const projectFormSchema = projectFields
  .omit({ cover: true, gallery: true })
  .refine(endNotBeforeStart, endAfterStart);

/** Which home-page sections are shown. */
const sectionsSchema = z.object({
  about: z.boolean(),
  projects: z.boolean(),
  experience: z.boolean(),
  skills: z.boolean(),
  education: z.boolean(),
  contact: z.boolean(),
});

export const SECTION_KEYS = sectionsSchema.keyof().options;

export const settingsSchema = z.object({
  sections: sectionsSchema,
});

/** Public contact form. `website` is a honeypot: real visitors leave it empty. */
export const contactSchema = z.object({
  name: requiredText(120),
  email: z.email(),
  subject: optionalText(200),
  body: requiredText(5_000),
  website: z.string().max(0).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProjectFormInput = z.input<typeof projectFormSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type SkillCategoryInput = z.infer<typeof skillCategorySchema>;
export type SkillLevel = (typeof SKILL_LEVELS)[number];
export type SettingsInput = z.infer<typeof settingsSchema>;
export type SectionKey = (typeof SECTION_KEYS)[number];
export type ContactInput = z.infer<typeof contactSchema>;
