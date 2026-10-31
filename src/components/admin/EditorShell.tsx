"use client";

import Link from "next/link";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Page header for an editor, plus a sticky save bar at the bottom. */
export function EditorShell({
  title,
  description,
  backHref,
  backLabel,
  onSubmit,
  pending,
  submitLabel = "Save",
  formError,
  aside,
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  onSubmit: () => void;
  pending: boolean;
  submitLabel?: string;
  /** Errors that don't belong to one field. */
  formError?: string;
  /** Extra actions next to Save (e.g. Delete). */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-8"
    >
      <div>
        {backHref && (
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
            <Link href={backHref}>
              <ArrowLeftIcon aria-hidden data-icon="inline-start" />
              {backLabel ?? "Back"}
            </Link>
          </Button>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
        >
          {formError}
        </p>
      )}

      {children}

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 -mx-4 flex items-center gap-3 border-t px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Button type="submit" disabled={pending}>
          <SaveIcon aria-hidden data-icon="inline-start" />
          {pending ? "Saving…" : submitLabel}
        </Button>
        {aside && (
          <div className="ml-auto flex items-center gap-2">{aside}</div>
        )}
      </div>
    </form>
  );
}

/** A titled group of fields inside an editor. */
export function EditorSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-xl border p-5 sm:p-6">
      <h2 className="font-semibold">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      )}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}
