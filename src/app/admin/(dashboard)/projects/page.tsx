import type { Metadata } from "next";
import { deleteProject, moveProject } from "@/actions/admin/projects";
import { ProjectFlags } from "@/components/admin/ProjectFlags";
import { SortableList } from "@/components/admin/SortableList";
import { listProjects } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  const projects = await listProjects();
  return (
    <SortableList
      title="Projects"
      description="The order here is the order on the site. Featured projects appear on the home page."
      newLabel="New project"
      basePath="/admin/projects"
      onMove={moveProject}
      onDelete={deleteProject}
      emptyText="No projects yet. Create your first one."
      rows={projects.map((project) => ({
        id: project.id,
        title: project.title,
        subtitle: project.summary,
        extra: (
          <ProjectFlags
            id={project.id}
            title={project.title}
            published={project.published}
            featured={project.featured}
          />
        ),
      }))}
    />
  );
}
