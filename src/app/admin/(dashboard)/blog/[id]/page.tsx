import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/editors/PostEditor";
import { getPost } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
}: PageProps<"/admin/blog/[id]">) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  // key: remount the editor with fresh state when switching posts.
  return <PostEditor key={post.id} post={post} />;
}
