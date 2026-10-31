"use client";

import { useCallback, useState, useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

interface RunOptions<T> {
  onSuccess?: (result: Extract<ActionResult<T>, { ok: true }>) => void;
  /** Re-render the current admin page with fresh data (default true). */
  refresh?: boolean;
}

/**
 * Runs an admin server action: tracks pending state, shows a toast with the
 * result, keeps per-field errors, and moves focus to the first invalid field.
 */
export function useAdminAction() {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const run = useCallback(
    <T>(
      action: () => Promise<ActionResult<T>>,
      options: RunOptions<T> = {},
    ) => {
      startTransition(async () => {
        let result: ActionResult<T>;
        try {
          result = await action();
        } catch (error) {
          // Let Next's own control-flow errors (e.g. redirect to login when the
          // session expired) through instead of swallowing them.
          unstable_rethrow(error);
          console.error(error);
          toast.error("Something went wrong. Please try again.");
          return;
        }
        if (result.ok) {
          setErrors({});
          toast.success(result.message);
          options.onSuccess?.(result);
          if (options.refresh !== false) router.refresh();
        } else {
          setErrors(result.errors ?? {});
          toast.error(result.message);
          // Wait for the error markup to render, then focus the first invalid field.
          requestAnimationFrame(() => {
            document
              .querySelector<HTMLElement>("[aria-invalid='true']")
              ?.focus();
          });
        }
      });
    },
    [router],
  );

  return { pending, errors, run, setErrors };
}
