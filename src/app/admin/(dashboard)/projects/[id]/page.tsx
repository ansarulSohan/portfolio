import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/editors/ProjectEditor";
import { getProject } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
}: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  // key: remount the editor with fresh state when switching projects.
  return <ProjectEditor key={project.id} project={project} />;
}
