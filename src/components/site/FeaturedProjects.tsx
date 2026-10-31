import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectDTO } from "@/lib/dto";
import { ProjectCard } from "./ProjectCard";
import { Section } from "./Section";

export function FeaturedProjects({
  featured,
  totalPublished,
}: {
  featured: ProjectDTO[];
  totalPublished: number;
}) {
  return (
    <Section
      id="projects"
      title="Projects"
      description="Selected work. Each one has a write-up with the details."
    >
      {featured.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {featured.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Projects are on their way.</p>
      )}
      {totalPublished > featured.length && (
        <Button asChild variant="outline" className="mt-8">
          <Link href="/projects">
            See all {totalPublished} projects
            <ArrowRightIcon aria-hidden data-icon="inline-end" />
          </Link>
        </Button>
      )}
    </Section>
  );
}
