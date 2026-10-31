"use client";

import { useState } from "react";
import type { EducationDTO } from "@/lib/dto";
import { ConfirmDelete } from "../ConfirmDelete";
import { EditorSection, EditorShell } from "../EditorShell";
import { MonthRangeField, TextAreaField, TextField } from "../fields";
import { useListEditor } from "./useListEditor";

export function EducationEditor({ item }: { item: EducationDTO | null }) {
  const [form, setForm] = useState(() => ({
    degree: item?.degree ?? "",
    institution: item?.institution ?? "",
    location: item?.location ?? "",
    start: item?.start ?? "",
    end: item?.end ?? "",
    notes: item?.notes ?? "",
  }));
  const { pending, errors, save, remove } = useListEditor(
    "education",
    item?.id ?? null,
    "/admin/education",
  );
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <EditorShell
      title={item ? item.degree : "New education"}
      backHref="/admin/education"
      backLabel="All education"
      onSubmit={() => save(form)}
      pending={pending}
      submitLabel={item ? "Save" : "Add education"}
      formError={errors._form}
      aside={
        item && (
          <ConfirmDelete
            itemName={item.degree}
            disabled={pending}
            onConfirm={remove}
          />
        )
      }
    >
      <EditorSection title="Degree">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Degree"
            value={form.degree}
            onChange={(v) => set("degree", v)}
            error={errors.degree}
            placeholder="e.g. MSc in Informatics"
          />
          <TextField
            label="Institution"
            value={form.institution}
            onChange={(v) => set("institution", v)}
            error={errors.institution}
          />
          <TextField
            label="Location"
            optional
            value={form.location}
            onChange={(v) => set("location", v)}
            error={errors.location}
          />
        </div>
        <MonthRangeField
          start={form.start}
          end={form.end}
          onChange={({ start, end }) =>
            setForm((current) => ({ ...current, start, end }))
          }
          errors={{ start: errors.start, end: errors.end }}
          ongoingLabel="Still studying"
        />
        <TextAreaField
          label="Notes"
          optional
          rows={4}
          maxLength={2000}
          value={form.notes}
          onChange={(v) => set("notes", v)}
          error={errors.notes}
          description="Specialization, thesis, notable coursework."
        />
      </EditorSection>
    </EditorShell>
  );
}
