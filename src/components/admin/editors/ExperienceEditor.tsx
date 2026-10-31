"use client";

import { useState } from "react";
import type { ExperienceDTO } from "@/lib/dto";
import { ConfirmDelete } from "../ConfirmDelete";
import { EditorSection, EditorShell } from "../EditorShell";
import {
  errorsUnder,
  ListField,
  MonthRangeField,
  TagsField,
  TextField,
} from "../fields";
import { useListEditor } from "./useListEditor";

export function ExperienceEditor({ item }: { item: ExperienceDTO | null }) {
  const [form, setForm] = useState(() => ({
    role: item?.role ?? "",
    company: item?.company ?? "",
    companyUrl: item?.companyUrl ?? "",
    location: item?.location ?? "",
    start: item?.start ?? "",
    end: item?.end ?? "",
    highlights: item?.highlights ?? [""],
    tech: item?.tech ?? [],
  }));
  const { pending, errors, save, remove } = useListEditor(
    "experience",
    item?.id ?? null,
    "/admin/experience",
  );
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <EditorShell
      title={item ? `${item.role} · ${item.company}` : "New experience"}
      backHref="/admin/experience"
      backLabel="All experience"
      onSubmit={() => save(form)}
      pending={pending}
      submitLabel={item ? "Save" : "Add experience"}
      formError={errors._form}
      aside={
        item && (
          <ConfirmDelete
            itemName={`${item.role} at ${item.company}`}
            disabled={pending}
            onConfirm={remove}
          />
        )
      }
    >
      <EditorSection title="Role">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Job title"
            value={form.role}
            onChange={(v) => set("role", v)}
            error={errors.role}
            maxLength={120}
          />
          <TextField
            label="Company"
            value={form.company}
            onChange={(v) => set("company", v)}
            error={errors.company}
            maxLength={120}
          />
          <TextField
            label="Company website"
            optional
            type="url"
            value={form.companyUrl}
            onChange={(v) => set("companyUrl", v)}
            error={errors.companyUrl}
            placeholder="https://…"
          />
          <TextField
            label="Location"
            optional
            value={form.location}
            onChange={(v) => set("location", v)}
            error={errors.location}
            placeholder="e.g. Oslo, Norway (remote)"
          />
        </div>
        <MonthRangeField
          start={form.start}
          end={form.end}
          onChange={({ start, end }) =>
            setForm((current) => ({ ...current, start, end }))
          }
          errors={{ start: errors.start, end: errors.end }}
          ongoingLabel="I currently work here"
        />
      </EditorSection>

      <EditorSection
        title="What you did"
        description="Two to five concrete highlights work best. Start each with a verb."
      >
        <ListField
          label="Highlights"
          itemLabel="Highlight"
          addLabel="Add highlight"
          values={form.highlights}
          onChange={(v) => set("highlights", v)}
          errors={errorsUnder(errors, "highlights")}
        />
        <TagsField
          label="Technologies"
          optional
          values={form.tech}
          onChange={(v) => set("tech", v)}
          error={errors.tech}
          placeholder="e.g. Node.js"
        />
      </EditorSection>
    </EditorShell>
  );
}
