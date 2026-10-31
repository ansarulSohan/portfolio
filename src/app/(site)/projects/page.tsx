import { Suspense } from "react";
import type { Metadata } from "next";
import { ProjectBrowser } from "@/components/site/ProjectBrowser";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublishedProjects } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Projects",
  description: "All projects, with write-ups on how each was built.",
  alternates: { canonical: "/projects" },
};

async function ProjectList() {
  const projects = await getPublishedProjects();
  if (projects.length === 0) {
    return <p className="text-muted-foreground">No projects published yet.</p>;
  }
  return <ProjectBrowser projects={projects} />;
}

function ProjectListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading projects"
      className="grid gap-6 sm:grid-cols-2"
    >
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <div className="animate-fade-up py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Projects
      </h1>
      <p className="text-muted-foreground mt-3 mb-10 max-w-2xl text-lg">
        Things I&apos;ve built, with notes on the problems and how I approached
        them.
      </p>
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList />
      </Suspense>
    </div>
  );
}
