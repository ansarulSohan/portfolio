"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, deleteSession, safeAdminPath } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { Admin } from "@/models";

export type LoginState = { error?: string; email?: string };

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(200),
});

const WINDOW_MS = 15 * 60 * 1000;
// Per IP: slows down guessing from one machine. Per email: slows down
// distributed guessing against the single admin account.
const PER_IP = { limit: 10, windowMs: WINDOW_MS };
const PER_EMAIL = { limit: 20, windowMs: WINDOW_MS };

// bcrypt hash (cost 12, same as real ones) of a random value nobody knows.
// Compared against when the email is unknown, so response time doesn't reveal
// whether an account exists.
const DUMMY_HASH =
  "$2b$12$fylcsMDf7gMRyk29nhIBw.KApCB56OV0Hn.UTS8awGFrY2.rRNhtu";

const GENERIC_ERROR = "Incorrect email or password.";

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const typedEmail = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: GENERIC_ERROR, email: typedEmail };
  const { email, password } = parsed.data;

  const ipHash = hashIp(await clientIp());
  const [byIp, byEmail] = await Promise.all([
    rateLimit(`login-ip:${ipHash}`, PER_IP),
    rateLimit(`login-email:${hashIp(email)}`, PER_EMAIL),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    const minutes = Math.ceil(
      Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds) / 60,
    );
    return {
      error: `Too many sign-in attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      email: typedEmail,
    };
  }

  await connectDB();
  const admin = await Admin.findOne({ email }).select(
    "passwordHash sessionVersion",
  );
  const valid = await bcrypt.compare(
    password,
    admin?.passwordHash ?? DUMMY_HASH,
  );
  if (!admin || !valid) return { error: GENERIC_ERROR, email: typedEmail };

  await createSession({
    id: admin._id.toString(),
    sessionVersion: admin.sessionVersion ?? 0,
  });
  // redirect() throws, so it must be outside any try/catch.
  redirect(safeAdminPath(formData.get("next")));
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/admin/login");
}
