"use server";

import type { ActionResult } from "@/lib/action-result";
import { isValidId } from "@/lib/admin-crud";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Message } from "@/models";

// Messages are admin-only, so there's no public cache to refresh; the admin
// pages re-render from the action's router refresh.

export async function setMessageRead(
  id: string,
  read: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidId(id)) return { ok: false, message: "Message not found." };
  await connectDB();
  const doc = await Message.findByIdAndUpdate(id, {
    $set: { read: read === true },
  }).lean();
  if (!doc) return { ok: false, message: "Message not found." };
  return { ok: true, message: read ? "Marked as read." : "Marked as unread." };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidId(id)) return { ok: false, message: "Message not found." };
  await connectDB();
  const doc = await Message.findByIdAndDelete(id).lean();
  if (!doc) return { ok: false, message: "Message not found." };
  return { ok: true, message: "Message deleted." };
}
