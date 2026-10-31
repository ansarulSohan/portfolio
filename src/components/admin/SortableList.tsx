"use client";

import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import type { Direction } from "@/lib/admin-crud";
import { ConfirmDelete } from "./ConfirmDelete";
import { useAdminAction } from "./useAdminAction";

export interface ListRow {
  id: string;
  title: string;
  subtitle?: string;
  /** Extra controls or badges shown on the row (e.g. publish toggles). */
  extra?: React.ReactNode;
}

/**
 * An ordered list of items with edit, delete and up/down reordering.
 * Up/down buttons (rather than drag and drop) work with keyboard and
 * screen readers out of the box.
 */
export function SortableList({
  title,
  description,
  rows,
  newLabel,
  basePath,
  onMove,
  onDelete,
  emptyText,
}: {
  title: string;
  description?: string;
  rows: ListRow[];
  newLabel: string;
  /** Rows link to `${basePath}/${id}`; "New" goes to `${basePath}/new`. */
  basePath: string;
  onMove: (id: string, direction: Direction) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  emptyText: string;
}) {
  const { pending, run } = useAdminAction();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
        <Button asChild>
          <Link href={`${basePath}/new`}>
            <PlusIcon aria-hidden data-icon="inline-start" />
            {newLabel}
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
          {emptyText}
        </p>
      ) : (
        <ol
          className="bg-card divide-y rounded-xl border"
          aria-label={title}
          aria-busy={pending}
        >
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="flex gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending || index === 0}
                  onClick={() => run(() => onMove(row.id, "up"))}
                  aria-label={`Move “${row.title}” up`}
                >
                  <ArrowUpIcon aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending || index === rows.length - 1}
                  onClick={() => run(() => onMove(row.id, "down"))}
                  aria-label={`Move “${row.title}” down`}
                >
                  <ArrowDownIcon aria-hidden />
                </Button>
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`${basePath}/${row.id}`}
                  className="block truncate font-medium hover:underline"
                >
                  {row.title}
                </Link>
                {row.subtitle && (
                  <p className="text-muted-foreground truncate text-sm">
                    {row.subtitle}
                  </p>
                )}
              </div>
              {row.extra}
              <div className="flex gap-0.5">
                <Button asChild variant="ghost" size="icon-sm">
                  <Link
                    href={`${basePath}/${row.id}`}
                    aria-label={`Edit “${row.title}”`}
                  >
                    <PencilIcon aria-hidden />
                  </Link>
                </Button>
                <ConfirmDelete
                  iconOnly
                  itemName={row.title}
                  disabled={pending}
                  onConfirm={() => run(() => onDelete(row.id))}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
