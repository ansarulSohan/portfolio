"use client";

import { ErrorState } from "@/components/ErrorState";

export default function AdminError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <ErrorState
      error={error}
      retry={retry}
      homeHref="/admin"
      homeLabel="Back to dashboard"
    />
  );
}
