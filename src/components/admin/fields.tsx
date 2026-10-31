"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "lucide-react";
import { Markdown } from "@/components/site/Markdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/*
 * Form fields for the admin editors. Each one wires its label, description and
 * error to the input (htmlFor, aria-describedby, aria-invalid) so they're
 * announced by screen readers, and useAdminAction can focus the first error.
 */

interface FieldShellProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** aria-describedby for a field: its description and/or error, if present. */
function describedBy(id: string, hasDescription: unknown, error?: string) {
  const ids = [
    hasDescription ? `${id}-desc` : null,
    error ? `${id}-error` : null,
  ].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function FieldShell({
  id,
  label,
  description,
  error,
  optional,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {optional && (
          <span className="text-muted-foreground font-normal">(optional)</span>
        )}
      </Label>
      {children}
      {description && (
        <p id={`${id}-desc`} className="text-muted-foreground text-xs">
          {description}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

type BaseProps = {
  label: string;
  description?: string;
  error?: string;
  optional?: boolean;
  className?: string;
};

export function TextField({
  label,
  description,
  error,
  optional,
  className,
  value,
  onChange,
  ...input
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<"input">, "value" | "onChange">) {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={error}
      optional={optional}
      className={className}
    >
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, description, error)}
        {...input}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  description,
  error,
  optional,
  className,
  value,
  onChange,
  rows = 4,
  maxLength,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={label}
      description={description}
      error={error}
      optional={optional}
      className={className}
    >
      <Textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, description, error)}
      />
    </FieldShell>
  );
}

export function SwitchField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>{label}</Label>
        {description && (
          <p id={`${id}-desc`} className="text-muted-foreground text-xs">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-describedby={description ? `${id}-desc` : undefined}
      />
    </div>
  );
}

/** Start and end months (YYYY-MM). An unchecked "ongoing" box means there's an end month. */
export function MonthRangeField({
  start,
  end,
  onChange,
  errors,
  startOptional,
  ongoingLabel = "Ongoing (no end date)",
}: {
  start: string;
  end: string;
  onChange: (value: { start: string; end: string }) => void;
  errors: { start?: string; end?: string };
  startOptional?: boolean;
  ongoingLabel?: string;
}) {
  const startId = useId();
  const endId = useId();
  const ongoingId = useId();
  // Remember the end month while "ongoing" is ticked, so unticking restores it.
  const [lastEnd, setLastEnd] = useState(end);
  const ongoing = end === "";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FieldShell
        id={startId}
        label="Start"
        optional={startOptional}
        error={errors.start}
        description="Month and year"
      >
        <Input
          id={startId}
          type="month"
          value={start}
          onChange={(event) => onChange({ start: event.target.value, end })}
          aria-invalid={errors.start ? true : undefined}
          aria-describedby={describedBy(startId, true, errors.start)}
        />
      </FieldShell>
      <div className="flex flex-col gap-2">
        <FieldShell id={endId} label="End" error={errors.end}>
          <Input
            id={endId}
            type="month"
            value={end}
            disabled={ongoing}
            onChange={(event) => {
              setLastEnd(event.target.value);
              onChange({ start, end: event.target.value });
            }}
            aria-invalid={errors.end ? true : undefined}
            aria-describedby={describedBy(endId, undefined, errors.end)}
          />
        </FieldShell>
        <div className="flex items-center gap-2">
          <Checkbox
            id={ongoingId}
            checked={ongoing}
            onCheckedChange={(checked) =>
              onChange({ start, end: checked === true ? "" : lastEnd || start })
            }
          />
          <Label htmlFor={ongoingId} className="font-normal">
            {ongoingLabel}
          </Label>
        </div>
      </div>
    </div>
  );
}

/** Short values as removable chips: type and press Enter or comma to add. */
export function TagsField({
  label,
  description,
  error,
  optional,
  values,
  onChange,
  placeholder = "Type and press Enter",
  maxLength = 40,
}: BaseProps & {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");

  const add = () => {
    const parts = draft
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    onChange([...new Set([...values, ...parts])]);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      error={error}
      description={
        description ??
        "Press Enter or comma to add. Backspace removes the last one."
      }
    >
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={`${label} added`}>
          {values.map((value) => (
            <li
              key={value}
              className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md py-0.5 pr-1 pl-2 text-sm"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== value))}
                className="hover:bg-background/60 rounded p-0.5"
                aria-label={`Remove ${value}`}
              >
                <XIcon className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, true, error)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={!draft.trim()}
        >
          Add
        </Button>
      </div>
    </FieldShell>
  );
}

/** An ordered list of longer text items (e.g. job highlights) with add/remove/reorder. */
export function ListField({
  label,
  description,
  errors,
  values,
  onChange,
  itemLabel,
  addLabel,
  maxLength = 500,
}: {
  label: string;
  description?: string;
  /** Errors keyed by index (from paths like "highlights.2"). */
  errors: Record<string, string>;
  values: string[];
  onChange: (values: string[]) => void;
  itemLabel: string;
  addLabel: string;
  maxLength?: number;
}) {
  const groupId = useId();
  const move = (index: number, by: -1 | 1) => {
    const next = [...values];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  };

  return (
    <fieldset
      className="flex flex-col gap-3"
      aria-describedby={description ? `${groupId}-desc` : undefined}
    >
      <legend className="text-sm font-medium">{label}</legend>
      {description && (
        <p
          id={`${groupId}-desc`}
          className="text-muted-foreground -mt-1 text-xs"
        >
          {description}
        </p>
      )}
      <ol className="flex flex-col gap-2">
        {values.map((value, index) => {
          const id = `${groupId}-${index}`;
          const error = errors[String(index)];
          return (
            <li key={index} className="flex items-start gap-2">
              <div className="flex-1">
                <label htmlFor={id} className="sr-only">
                  {itemLabel} {index + 1}
                </label>
                <Textarea
                  id={id}
                  rows={2}
                  maxLength={maxLength}
                  value={value}
                  onChange={(event) =>
                    onChange(
                      values.map((v, i) =>
                        i === index ? event.target.value : v,
                      ),
                    )
                  }
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                />
                {error && (
                  <p
                    id={`${id}-error`}
                    className="text-destructive mt-1 text-sm"
                  >
                    {error}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} up`}
                >
                  <ArrowUpIcon aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === values.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move ${itemLabel.toLowerCase()} ${index + 1} down`}
                >
                  <ArrowDownIcon aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onChange(values.filter((_, i) => i !== index))}
                  aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
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
        onClick={() => onChange([...values, ""])}
      >
        <PlusIcon aria-hidden data-icon="inline-start" />
        {addLabel}
      </Button>
    </fieldset>
  );
}

/** Markdown with Write / Preview tabs. The preview uses the same renderer as the site. */
export function MarkdownField({
  label,
  description,
  error,
  optional,
  value,
  onChange,
  rows = 12,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const id = useId();
  const [preview, setPreview] = useState(false);
  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      error={error}
      description={
        description ??
        "Markdown: **bold**, _italic_, [link](https://…), - lists, ## headings. Blank line = new paragraph."
      }
    >
      <div role="group" aria-label={`${label} view`} className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant={preview ? "ghost" : "secondary"}
          aria-pressed={!preview}
          onClick={() => setPreview(false)}
        >
          Write
        </Button>
        <Button
          type="button"
          size="sm"
          variant={preview ? "secondary" : "ghost"}
          aria-pressed={preview}
          onClick={() => setPreview(true)}
        >
          Preview
        </Button>
      </div>
      {preview ? (
        <div
          className="bg-card min-h-40 rounded-lg border p-4"
          aria-live="polite"
        >
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nothing to preview yet.
            </p>
          )}
        </div>
      ) : (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono text-sm leading-6"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, true, error)}
        />
      )}
    </FieldShell>
  );
}

/** Pick out errors for one list field: { "highlights.2": "…" } → { "2": "…" }. */
export function errorsUnder(
  errors: Record<string, string>,
  prefix: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [path, message] of Object.entries(errors)) {
    if (path === prefix) result["_"] = message;
    else if (path.startsWith(`${prefix}.`))
      result[path.slice(prefix.length + 1)] = message;
  }
  return result;
}
