import type { Metadata } from "next";
import { ProjectEditor } from "@/components/admin/editors/ProjectEditor";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin();
  return <ProjectEditor project={null} />;
}
