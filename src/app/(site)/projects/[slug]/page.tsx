import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react";
import { Markdown } from "@/components/site/Markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublishedProject } from "@/lib/queries";
import { formatRange } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return { title: "Project not found", robots: { index: false } };
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.title,
      description: project.summary,
      ...(project.cover && {
        images: [{ url: project.cover.url, alt: project.cover.alt }],
      }),
    },
  };
}

async function ProjectDetail({
  params,
}: Pick<PageProps<"/projects/[slug]">, "params">) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();

  const dates = formatRange(project.start, project.end);
  const hasBody =
    project.body.trim() !== "" &&
    project.body.trim() !== project.summary.trim();
  const links = [
    project.links.live && { label: "Live site", href: project.links.live },
    project.links.github && {
      label: "Source code",
      href: project.links.github,
    },
    project.links.caseStudy && {
      label: "Case study",
      href: project.links.caseStudy,
    },
  ].filter((link): link is { label: string; href: string } => Boolean(link));

  return (
    <article className="animate-fade-up">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {project.title}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg leading-8">
          {project.summary}
        </p>

        <dl className="text-muted-foreground mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {project.role && (
            <div>
              <dt className="font-medium text-foreground">Role</dt>
              <dd>{project.role}</dd>
            </div>
          )}
          {dates && (
            <div>
              <dt className="font-medium text-foreground">When</dt>
              <dd className="tabular-nums">{dates}</dd>
            </div>
          )}
        </dl>

        {links.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {links.map((link, index) => (
              <Button
                key={link.href}
                asChild
                variant={index === 0 ? "default" : "outline"}
              >
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <ArrowUpRightIcon aria-hidden data-icon="inline-end" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Button>
            ))}
          </div>
        )}
      </header>

      {project.cover && (
        <Image
          src={project.cover.url}
          alt={project.cover.alt}
          width={1280}
          height={720}
          priority
          sizes="(min-width: 1024px) 976px, 100vw"
          className="mt-10 w-full rounded-xl border"
        />
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
        {/* The summary is already in the header; skip a body that only repeats it. */}
        {hasBody ? (
          <Markdown className="max-w-[70ch] leading-7">{project.body}</Markdown>
        ) : (
          <div />
        )}

        {(project.tech.length > 0 || project.tags.length > 0) && (
          <aside
            aria-label="Project details"
            className="flex flex-col gap-6 lg:border-l lg:pl-8"
          >
            {project.tech.length > 0 && (
              <div>
                <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                  Built with
                </h2>
                <ul className="flex flex-wrap gap-1.5">
                  {project.tech.map((tech) => (
                    <li key={tech}>
                      <Badge variant="secondary">{tech}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {project.tags.length > 0 && (
              <div>
                <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                  Topics
                </h2>
                <ul className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <li key={tag}>
                      <Badge variant="outline">{tag}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}
      </div>

      {project.gallery.length > 0 && (
        <section aria-labelledby="gallery-heading" className="mt-16">
          <h2
            id="gallery-heading"
            className="mb-6 text-xl font-semibold tracking-tight"
          >
            Gallery
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2">
            {project.gallery.map((image) => (
              <li key={image.key}>
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={800}
                  height={450}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="w-full rounded-lg border"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading project">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="mt-4 h-6 w-full max-w-2xl" />
      <Skeleton className="mt-10 aspect-[16/9] w-full rounded-xl" />
    </div>
  );
}

export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <div className="py-12 sm:py-16">
      <Button asChild variant="ghost" className="mb-8 -ml-2.5">
        <Link href="/projects">
          <ArrowLeftIcon aria-hidden data-icon="inline-start" />
          All projects
        </Link>
      </Button>
      {/* params is awaited inside Suspense so unknown slugs still get the static shell. */}
      <Suspense fallback={<ProjectDetailSkeleton />}>
        <ProjectDetail params={params} />
      </Suspense>
    </div>
  );
}
