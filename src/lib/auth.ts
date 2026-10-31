import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { connectDB } from "./db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
} from "./session-token";
import { Admin, type AdminDoc } from "@/models";
import type { Lean } from "./dto";

/** What admin pages and actions get: never the password hash. */
export interface AdminUser {
  id: string;
  email: string;
}

/**
 * The signed-in admin, or null. This is the authoritative check: it verifies
 * the token AND that the admin still exists with the same session version,
 * so revoked sessions stop working immediately. (proxy.ts only checks the
 * signature, as a fast first gate.)
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const claims = await verifySessionToken(token);
  if (!claims || !Types.ObjectId.isValid(claims.sub)) return null;

  await connectDB();
  const admin = await Admin.findById(claims.sub)
    .select("email sessionVersion")
    .lean<Lean<Pick<AdminDoc, "email" | "sessionVersion">>>();
  if (!admin || (admin.sessionVersion ?? 0) !== claims.v) return null;
  return { id: admin._id.toString(), email: admin.email };
}

/**
 * Use at the top of every admin page, layout and server action. Server actions
 * are public endpoints, so each one must check for itself.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function createSession(admin: {
  id: string;
  sessionVersion: number;
}) {
  const token = await signSessionToken({
    sub: admin.id,
    v: admin.sessionVersion,
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Only allow redirects back into the admin after login, so a crafted
 * ?next=https://evil.example link can't bounce the admin off-site.
 */
export function safeAdminPath(next: unknown): string {
  if (typeof next !== "string") return "/admin";
  if (!next.startsWith("/admin") || next.startsWith("/admin/login"))
    return "/admin";
  if (next.startsWith("//") || next.includes("\\")) return "/admin";
  return next;
}
