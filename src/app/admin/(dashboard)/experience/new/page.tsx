import type { Metadata } from "next";
import { ExperienceEditor } from "@/components/admin/editors/ExperienceEditor";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New experience" };

export default async function NewExperiencePage() {
  await requireAdmin();
  return <ExperienceEditor item={null} />;
}
