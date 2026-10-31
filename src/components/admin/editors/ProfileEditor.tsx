"use client";

import { useState } from "react";
import { saveProfile } from "@/actions/admin/profile";
import type { ProfileDTO } from "@/lib/dto";
import { EditorSection, EditorShell } from "../EditorShell";
import { MarkdownField, TagsField, TextAreaField, TextField } from "../fields";
import { AvatarField, ResumeField } from "../UploadFields";
import { useAdminAction } from "../useAdminAction";

/** Form state: every text field is a string ("" = not set). */
function toForm(profile: ProfileDTO | null) {
  return {
    name: profile?.name ?? "",
    title: profile?.title ?? "",
    tagline: profile?.tagline ?? "",
    location: profile?.location ?? "",
    email: profile?.email ?? "",
    socials: {
      linkedin: profile?.socials.linkedin ?? "",
      github: profile?.socials.github ?? "",
      x: profile?.socials.x ?? "",
      website: profile?.socials.website ?? "",
    },
    bio: profile?.bio ?? "",
    values: profile?.values ?? [],
    seo: {
      title: profile?.seo.title ?? "",
      description: profile?.seo.description ?? "",
    },
  };
}

export function ProfileEditor({ profile }: { profile: ProfileDTO | null }) {
  const [form, setForm] = useState(() => toForm(profile));
  const { pending, errors, run } = useAdminAction();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setSocial = (key: keyof typeof form.socials, value: string) =>
    setForm((current) => ({
      ...current,
      socials: { ...current.socials, [key]: value },
    }));
  const setSeo = (key: keyof typeof form.seo, value: string) =>
    setForm((current) => ({
      ...current,
      seo: { ...current.seo, [key]: value },
    }));

  return (
    <EditorShell
      title="Profile"
      description="Your name, introduction and links, shown across the site."
      onSubmit={() => run(() => saveProfile(form))}
      pending={pending}
      formError={errors._form}
    >
      <EditorSection
        title="Basics"
        description="Shown in the hero at the top of the home page."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Name"
            value={form.name}
            onChange={(v) => set("name", v)}
            error={errors.name}
            autoComplete="name"
          />
          <TextField
            label="Title"
            value={form.title}
            onChange={(v) => set("title", v)}
            error={errors.title}
            description="e.g. Software Engineer"
          />
        </div>
        <TextField
          label="Tagline"
          optional
          value={form.tagline}
          onChange={(v) => set("tagline", v)}
          error={errors.tagline}
          maxLength={200}
          description="One sentence under your title, e.g. what you build and for whom."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Location"
            optional
            value={form.location}
            onChange={(v) => set("location", v)}
            error={errors.location}
          />
          <TextField
            label="Contact email"
            type="email"
            value={form.email}
            onChange={(v) => set("email", v)}
            error={errors.email}
            description="Shown publicly in the contact section."
          />
        </div>
      </EditorSection>

      <EditorSection
        title="Photo & résumé"
        description="These save as soon as they're uploaded, separately from the Save button."
      >
        <AvatarField current={profile?.avatar ?? null} />
        <ResumeField current={profile?.resume ?? null} />
      </EditorSection>

      <EditorSection
        title="About"
        description="The About section of the home page."
      >
        <MarkdownField
          label="Bio"
          value={form.bio}
          onChange={(v) => set("bio", v)}
          error={errors.bio}
          rows={14}
        />
        <TagsField
          label="How I work"
          optional
          values={form.values}
          onChange={(v) => set("values", v)}
          error={errors.values}
          maxLength={60}
          placeholder="e.g. Systems thinking"
          description="Short value statements shown beside your bio. Press Enter to add each one."
        />
      </EditorSection>

      <EditorSection
        title="Links"
        description="Full URLs starting with https://. Leave empty to hide."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="GitHub"
            optional
            type="url"
            value={form.socials.github}
            onChange={(v) => setSocial("github", v)}
            error={errors["socials.github"]}
            placeholder="https://github.com/…"
          />
          <TextField
            label="LinkedIn"
            optional
            type="url"
            value={form.socials.linkedin}
            onChange={(v) => setSocial("linkedin", v)}
            error={errors["socials.linkedin"]}
            placeholder="https://www.linkedin.com/in/…"
          />
          <TextField
            label="X (Twitter)"
            optional
            type="url"
            value={form.socials.x}
            onChange={(v) => setSocial("x", v)}
            error={errors["socials.x"]}
            placeholder="https://x.com/…"
          />
          <TextField
            label="Website"
            optional
            type="url"
            value={form.socials.website}
            onChange={(v) => setSocial("website", v)}
            error={errors["socials.website"]}
            placeholder="https://…"
          />
        </div>
      </EditorSection>

      <EditorSection
        title="Search & sharing"
        description="How the site appears in search results and link previews. Leave empty to use your name, title and tagline."
      >
        <TextField
          label="Page title"
          optional
          value={form.seo.title}
          onChange={(v) => setSeo("title", v)}
          error={errors["seo.title"]}
          maxLength={70}
          description={`${form.seo.title.length}/70 characters`}
        />
        <TextAreaField
          label="Description"
          optional
          rows={3}
          value={form.seo.description}
          onChange={(v) => setSeo("description", v)}
          error={errors["seo.description"]}
          maxLength={160}
          description={`${form.seo.description.length}/160 characters`}
        />
      </EditorSection>
    </EditorShell>
  );
}
