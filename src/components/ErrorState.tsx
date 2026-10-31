"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shared body for error.tsx boundaries. In production, server errors arrive
 * with a generic message and a digest that matches the server log entry.
 */
export function ErrorState({
  error,
  retry,
  homeHref = "/",
  homeLabel = "Go home",
}: {
  error: unknown;
  retry: () => void;
  homeHref?: string;
  homeLabel?: string;
}) {
  const digest =
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : undefined;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="py-24">
      <p className="text-destructive text-sm font-semibold">
        Something went wrong
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        This page couldn&apos;t load
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md">
        It may be a temporary problem. Try again, and if it keeps happening,
        come back a little later.
      </p>
      {digest && (
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          Reference: {digest}
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <Button onClick={() => retry()}>
          <RotateCcwIcon aria-hidden data-icon="inline-start" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href={homeHref}>{homeLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
