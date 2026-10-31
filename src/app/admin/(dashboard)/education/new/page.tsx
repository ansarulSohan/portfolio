import type { Metadata } from "next";
import { EducationEditor } from "@/components/admin/editors/EducationEditor";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New education" };

export default async function NewEducationPage() {
  await requireAdmin();
  return <EducationEditor item={null} />;
}
