import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SkillCategoryEditor } from "@/components/admin/editors/SkillCategoryEditor";
import { getSkillCategory } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Edit skill group" };

export default async function EditSkillCategoryPage({
  params,
}: PageProps<"/admin/skills/[id]">) {
  const { id } = await params;
  const category = await getSkillCategory(id);
  if (!category) notFound();
  return <SkillCategoryEditor key={category.id} category={category} />;
}
