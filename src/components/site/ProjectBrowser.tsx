"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProjectDTO } from "@/lib/dto";
import { ProjectCard } from "./ProjectCard";

/** All projects with a technology filter (toggle buttons with aria-pressed). */
export function ProjectBrowser({ projects }: { projects: ProjectDTO[] }) {
  const [active, setActive] = useState<string | null>(null);

  // Technologies by how many projects use them, so the common ones come first.
  const techs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      for (const tech of project.tech)
        counts.set(tech, (counts.get(tech) ?? 0) + 1);
    }
    return [...counts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tech]) => tech);
  }, [projects]);

  const shown = active
    ? projects.filter((project) => project.tech.includes(active))
    : projects;

  return (
    <>
      {techs.length > 1 && (
        <div
          role="group"
          aria-label="Filter by technology"
          className="mb-8 flex flex-wrap gap-2"
        >
          <Button
            size="sm"
            variant={active === null ? "default" : "outline"}
            aria-pressed={active === null}
            onClick={() => setActive(null)}
          >
            All
          </Button>
          {techs.map((tech) => (
            <Button
              key={tech}
              size="sm"
              variant={active === tech ? "default" : "outline"}
              aria-pressed={active === tech}
              onClick={() => setActive(active === tech ? null : tech)}
            >
              {tech}
            </Button>
          ))}
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {active
          ? `Showing ${shown.length} projects using ${active}`
          : `Showing all ${shown.length} projects`}
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {shown.map((project) => (
          <ProjectCard key={project.id} project={project} headingLevel="h2" />
        ))}
      </div>
    </>
  );
}
