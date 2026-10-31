import type { Metadata } from "next";
import { SkillCategoryEditor } from "@/components/admin/editors/SkillCategoryEditor";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New skill group" };

export default async function NewSkillCategoryPage() {
  await requireAdmin();
  return <SkillCategoryEditor category={null} />;
}
