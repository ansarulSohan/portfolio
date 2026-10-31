"use server";

import { updateTag } from "next/cache";
import { invalid, type ActionResult } from "@/lib/action-result";
import { toUpdate } from "@/lib/admin-crud";
import { requireAdmin } from "@/lib/auth";
import { TAGS } from "@/lib/cache-tags";
import { connectDB } from "@/lib/db";
import { profileFormSchema } from "@/lib/validation";
import { Profile } from "@/models";

export async function saveProfile(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  await connectDB();
  // Singleton upsert. Avatar and résumé aren't in the form, so they're untouched.
  await Profile.findOneAndUpdate({}, toUpdate(parsed.data), { upsert: true });
  updateTag(TAGS.profile);
  return { ok: true, message: "Profile saved." };
}
