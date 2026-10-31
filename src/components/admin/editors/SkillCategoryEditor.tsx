"use client";

import { useId, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SkillCategoryDTO } from "@/lib/dto";
import type { SkillLevel } from "@/lib/validation";
import { ConfirmDelete } from "../ConfirmDelete";
import { EditorSection, EditorShell } from "../EditorShell";
import { TextField } from "../fields";
import { useListEditor } from "./useListEditor";

type Item = { name: string; level: SkillLevel | "" };

const LEVELS: { value: SkillLevel | ""; label: string }[] = [
  { value: "", label: "No level" },
  { value: "familiar", label: "Familiar" },
  { value: "proficient", label: "Proficient" },
  { value: "expert", label: "Expert" },
];

export function SkillCategoryEditor({
  category,
}: {
  category: SkillCategoryDTO | null;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [items, setItems] = useState<Item[]>(
    () =>
      category?.items.map((item) => ({
        name: item.name,
        level: item.level ?? "",
      })) ?? [{ name: "", level: "" }],
  );
  const { pending, errors, save, remove } = useListEditor(
    "skills",
    category?.id ?? null,
    "/admin/skills",
  );
  const baseId = useId();

  const update = (index: number, patch: Partial<Item>) =>
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  const move = (index: number, by: -1 | 1) =>
    setItems((current) => {
      const next = [...current];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  // An empty level means "don't show one"; the schema expects it to be absent.
  const toInput = () => ({
    name,
    items: items.map((item) => ({
      name: item.name,
      ...(item.level && { level: item.level }),
    })),
  });

  return (
    <EditorShell
      title={category ? category.name : "New skill group"}
      backHref="/admin/skills"
      backLabel="All skill groups"
      onSubmit={() => save(toInput())}
      pending={pending}
      submitLabel={category ? "Save" : "Add skill group"}
      formError={errors._form ?? errors.items}
      aside={
        category && (
          <ConfirmDelete
            itemName={category.name}
            disabled={pending}
            onConfirm={remove}
          />
        )
      }
    >
      <EditorSection title="Group">
        <TextField
          label="Group name"
          value={name}
          onChange={setName}
          error={errors.name}
          placeholder="e.g. Cloud & DevOps"
          maxLength={80}
        />
      </EditorSection>

      <EditorSection
        title="Skills"
        description="Levels show as Familiar / Proficient / Expert. Choose “No level” to show the skill alone."
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Skills in this group</legend>
          <ol className="flex flex-col gap-2">
            {items.map((item, index) => {
              const nameId = `${baseId}-name-${index}`;
              const levelId = `${baseId}-level-${index}`;
              const error = errors[`items.${index}.name`];
              return (
                <li key={index} className="flex flex-wrap items-start gap-2">
                  <div className="min-w-48 flex-1">
                    <label htmlFor={nameId} className="sr-only">
                      Skill {index + 1} name
                    </label>
                    <Input
                      id={nameId}
                      value={item.name}
                      maxLength={60}
                      placeholder="Skill name"
                      onChange={(event) =>
                        update(index, { name: event.target.value })
                      }
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${nameId}-error` : undefined}
                    />
                    {error && (
                      <p
                        id={`${nameId}-error`}
                        className="text-destructive mt-1 text-sm"
                      >
                        {error}
                      </p>
                    )}
                  </div>
                  <label htmlFor={levelId} className="sr-only">
                    Skill {index + 1} level
                  </label>
                  <select
                    id={levelId}
                    value={item.level}
                    onChange={(event) =>
                      update(index, {
                        level: event.target.value as Item["level"],
                      })
                    }
                    className="border-input bg-background h-8 rounded-lg border px-2 text-sm"
                  >
                    {LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={`Move skill ${index + 1} up`}
                    >
                      <ArrowUpIcon aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={`Move skill ${index + 1} down`}
                    >
                      <ArrowDownIcon aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setItems((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      aria-label={`Remove skill ${index + 1}${item.name ? ` (${item.name})` : ""}`}
                    >
                      <XIcon aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() =>
              setItems((current) => [...current, { name: "", level: "" }])
            }
          >
            <PlusIcon aria-hidden data-icon="inline-start" />
            Add skill
          </Button>
        </fieldset>
      </EditorSection>
    </EditorShell>
  );
}
