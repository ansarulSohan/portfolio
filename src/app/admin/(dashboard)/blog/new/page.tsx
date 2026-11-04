import type { Metadata } from "next";
import { PostEditor } from "@/components/admin/editors/PostEditor";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireAdmin();
  return <PostEditor post={null} />;
}
