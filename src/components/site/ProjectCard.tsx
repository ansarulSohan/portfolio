import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProjectDTO } from "@/lib/dto";
import { formatRange } from "@/lib/site";

/** Placeholder art for projects without a cover: decorative, from the title. */
function CoverPlaceholder({ title }: { title: string }) {
  const initials = title
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      aria-hidden
      className="from-primary/15 via-accent to-muted text-primary/70 flex size-full items-center justify-center bg-gradient-to-br text-4xl font-semibold tracking-tight"
    >
      {initials}
    </div>
  );
}

/**
 * The whole card is one link to the project page (stretched title link), with
 * external links layered above it so they stay separately clickable.
 */
export function ProjectCard({
  project,
  headingLevel = "h3",
}: {
  project: ProjectDTO;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const dates = formatRange(project.start, project.end);
  return (
    <article className="group bg-card hover:border-primary/50 relative flex flex-col overflow-hidden rounded-xl border transition-colors focus-within:ring-2 focus-within:ring-ring">
      <div className="bg-muted aspect-[16/9] overflow-hidden border-b">
        {project.cover ? (
          <Image
            src={project.cover.url}
            alt={project.cover.alt}
            width={800}
            height={450}
            sizes="(min-width: 1024px) 480px, (min-width: 640px) 50vw, 100vw"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <CoverPlaceholder title={project.title} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <Heading className="text-lg font-semibold tracking-tight">
            <Link
              href={`/projects/${project.slug}`}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {project.title}
            </Link>
          </Heading>
          {dates && (
            <span className="text-muted-foreground shrink-0 text-xs">
              {dates}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm leading-6">
          {project.summary}
        </p>

        {project.tech.length > 0 && (
          <ul
            className="mt-auto flex flex-wrap gap-1.5 pt-2"
            aria-label="Technologies"
          >
            {project.tech.map((tech) => (
              <li key={tech}>
                <Badge variant="secondary">{tech}</Badge>
              </li>
            ))}
          </ul>
        )}

        {(project.links.github || project.links.live) && (
          <div className="relative z-10 flex gap-4 pt-1 text-sm">
            {project.links.live && (
              <a
                href={project.links.live}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 rounded-sm font-medium underline-offset-4 hover:underline"
              >
                Live site <ArrowUpRightIcon className="size-3.5" aria-hidden />
                <span className="sr-only">
                  for {project.title} (opens in a new tab)
                </span>
              </a>
            )}
            {project.links.github && (
              <a
                href={project.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 rounded-sm font-medium underline-offset-4 hover:underline"
              >
                Source <ArrowUpRightIcon className="size-3.5" aria-hidden />
                <span className="sr-only">
                  code for {project.title} on GitHub (opens in a new tab)
                </span>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
