"use server";

import bcrypt from "bcryptjs";
import { updateTag } from "next/cache";
import { z } from "zod";
import { invalid, type ActionResult } from "@/lib/action-result";
import { createSession, deleteSession, requireAdmin } from "@/lib/auth";
import { TAGS } from "@/lib/cache-tags";
import { connectDB } from "@/lib/db";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { settingsSchema } from "@/lib/validation";
import { Admin, Settings } from "@/models";

export async function saveSettings(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await connectDB();
  await Settings.findOneAndUpdate({}, { $set: parsed.data }, { upsert: true });
  updateTag(TAGS.settings);
  return { ok: true, message: "Settings saved." };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(200, "Use at most 200 characters."),
    confirm: z.string(),
  })
  .refine((value) => value.next === value.confirm, {
    message: "The passwords don't match.",
    path: ["confirm"],
  })
  .refine((value) => value.next !== value.current, {
    message: "Choose a password different from the current one.",
    path: ["next"],
  });

/**
 * Change the admin password. Increments sessionVersion, which signs out every
 * other browser, then issues a fresh session for this one.
 */
export async function changePassword(input: unknown): Promise<ActionResult> {
  const me = await requireAdmin();
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  // Same guessing protection as login: this endpoint also checks the password.
  const limit = await rateLimit(`password-change:${hashIp(await clientIp())}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.allowed) {
    return {
      ok: false,
      message: "Too many attempts. Try again in a few minutes.",
    };
  }

  await connectDB();
  const admin = await Admin.findById(me.id).select(
    "passwordHash sessionVersion",
  );
  if (!admin) return { ok: false, message: "Account not found." };
  if (!(await bcrypt.compare(parsed.data.current, admin.passwordHash))) {
    return {
      ok: false,
      message: "Some fields need attention.",
      errors: { current: "That isn't your current password." },
    };
  }

  admin.passwordHash = await bcrypt.hash(parsed.data.next, 12);
  admin.sessionVersion = (admin.sessionVersion ?? 0) + 1;
  await admin.save();
  await createSession({ id: me.id, sessionVersion: admin.sessionVersion });
  return {
    ok: true,
    message: "Password changed. Other devices have been signed out.",
  };
}

/** Sign out every session, including this one. */
export async function signOutEverywhere(): Promise<ActionResult> {
  const me = await requireAdmin();
  await connectDB();
  await Admin.updateOne({ _id: me.id }, { $inc: { sessionVersion: 1 } });
  await deleteSession();
  return { ok: true, message: "Signed out everywhere." };
}
