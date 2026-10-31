"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/actions/admin/projects";
import { Button } from "@/components/ui/button";
import type { ProjectDTO } from "@/lib/dto";
import { slugify } from "@/lib/slug";
import { ConfirmDelete } from "../ConfirmDelete";
import { EditorSection, EditorShell } from "../EditorShell";
import {
  MarkdownField,
  MonthRangeField,
  SwitchField,
  TagsField,
  TextAreaField,
  TextField,
} from "../fields";
import { CoverField, GalleryField } from "../UploadFields";
import { useAdminAction } from "../useAdminAction";

function toForm(project: ProjectDTO | null) {
  return {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    summary: project?.summary ?? "",
    body: project?.body ?? "",
    tech: project?.tech ?? [],
    tags: project?.tags ?? [],
    links: {
      github: project?.links.github ?? "",
      live: project?.links.live ?? "",
      caseStudy: project?.links.caseStudy ?? "",
    },
    role: project?.role ?? "",
    start: project?.start ?? "",
    end: project?.end ?? "",
    featured: project?.featured ?? false,
    published: project?.published ?? false,
  };
}

export function ProjectEditor({ project }: { project: ProjectDTO | null }) {
  const isNew = project === null;
  const [form, setForm] = useState(() => toForm(project));
  // New projects derive the slug from the title until the slug is edited by hand.
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const { pending, errors, run } = useAdminAction();
  const router = useRouter();

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setLink = (key: keyof typeof form.links, value: string) =>
    setForm((current) => ({
      ...current,
      links: { ...current.links, [key]: value },
    }));

  const save = () => {
    if (isNew) {
      run(() => createProject(form), {
        refresh: false,
        onSuccess: (result) =>
          result.data && router.replace(`/admin/projects/${result.data.id}`),
      });
    } else {
      run(() => updateProject(project.id, form));
    }
  };

  return (
    <EditorShell
      title={isNew ? "New project" : form.title || "Untitled project"}
      backHref="/admin/projects"
      backLabel="All projects"
      onSubmit={save}
      pending={pending}
      submitLabel={isNew ? "Create project" : "Save"}
      formError={errors._form}
      aside={
        !isNew && (
          <>
            {project.published && (
              <Button asChild variant="ghost">
                <Link href={`/projects/${project.slug}`} target="_blank">
                  View
                  <ExternalLinkIcon aria-hidden data-icon="inline-end" />
                  <span className="sr-only">(opens in a new tab)</span>
                </Link>
              </Button>
            )}
            <ConfirmDelete
              itemName={project.title}
              disabled={pending}
              onConfirm={() =>
                run(() => deleteProject(project.id), {
                  refresh: false,
                  onSuccess: () => router.replace("/admin/projects"),
                })
              }
            />
          </>
        )
      }
    >
      <EditorSection title="Visibility">
        <div className="grid gap-3 sm:grid-cols-2">
          <SwitchField
            label="Published"
            description="Visible on the site. Unpublished projects are drafts only you can see."
            checked={form.published}
            onChange={(v) => set("published", v)}
          />
          <SwitchField
            label="Featured"
            description="Shown on the home page (if published)."
            checked={form.featured}
            onChange={(v) => set("featured", v)}
          />
        </div>
      </EditorSection>

      <EditorSection
        title="Overview"
        description="Shown on the project card and at the top of the project page."
      >
        <TextField
          label="Title"
          value={form.title}
          onChange={(title) =>
            setForm((current) => ({
              ...current,
              title,
              slug: slugTouched ? current.slug : slugify(title),
            }))
          }
          error={errors.title}
          maxLength={120}
        />
        <TextField
          label="URL"
          value={form.slug}
          onChange={(v) => {
            setSlugTouched(true);
            set("slug", v.toLowerCase());
          }}
          error={errors.slug}
          maxLength={80}
          description={`The project page will be /projects/${form.slug || "…"}. Lowercase letters, numbers and hyphens.`}
        />
        <TextAreaField
          label="Summary"
          rows={2}
          value={form.summary}
          onChange={(v) => set("summary", v)}
          error={errors.summary}
          maxLength={300}
          description={`One or two sentences. ${form.summary.length}/300`}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Your role"
            optional
            value={form.role}
            onChange={(v) => set("role", v)}
            error={errors.role}
            placeholder="e.g. Solo developer"
          />
        </div>
        <MonthRangeField
          start={form.start}
          end={form.end}
          startOptional
          onChange={({ start, end }) =>
            setForm((current) => ({ ...current, start, end }))
          }
          errors={{ start: errors.start, end: errors.end }}
          ongoingLabel="Ongoing, or no end date"
        />
      </EditorSection>

      <EditorSection
        title="Write-up"
        description="The main content of the project page: the problem, your approach, and the outcome."
      >
        <MarkdownField
          label="Write-up"
          optional
          value={form.body}
          onChange={(v) => set("body", v)}
          error={errors.body}
          rows={16}
        />
      </EditorSection>

      <EditorSection title="Technologies & topics">
        <TagsField
          label="Built with"
          optional
          values={form.tech}
          onChange={(v) => set("tech", v)}
          error={errors.tech}
          placeholder="e.g. TypeScript"
        />
        <TagsField
          label="Topics"
          optional
          values={form.tags}
          onChange={(v) => set("tags", v)}
          error={errors.tags}
          placeholder="e.g. Cloud"
        />
      </EditorSection>

      <EditorSection
        title="Links"
        description="Full URLs starting with https://. Leave empty to hide."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Live site"
            optional
            type="url"
            value={form.links.live}
            onChange={(v) => setLink("live", v)}
            error={errors["links.live"]}
            placeholder="https://…"
          />
          <TextField
            label="Source code"
            optional
            type="url"
            value={form.links.github}
            onChange={(v) => setLink("github", v)}
            error={errors["links.github"]}
            placeholder="https://github.com/…"
          />
          <TextField
            label="Case study"
            optional
            type="url"
            value={form.links.caseStudy}
            onChange={(v) => setLink("caseStudy", v)}
            error={errors["links.caseStudy"]}
            placeholder="https://…"
          />
        </div>
      </EditorSection>

      <EditorSection
        title="Images"
        description="Images save as soon as they're uploaded, separately from the Save button."
      >
        {isNew ? (
          <p className="text-muted-foreground text-sm">
            Create the project first, then add a cover image and gallery.
          </p>
        ) : (
          <>
            <CoverField
              projectId={project.id}
              current={project.cover ?? null}
            />
            <GalleryField
              key={project.gallery.map((image) => image.key).join(",")}
              projectId={project.id}
              current={project.gallery}
            />
          </>
        )}
      </EditorSection>
    </EditorShell>
  );
}
