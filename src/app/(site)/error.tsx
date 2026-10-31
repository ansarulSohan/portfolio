"use client";

import { ErrorState } from "@/components/ErrorState";

export default function SiteError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <ErrorState error={error} retry={retry} />;
}
