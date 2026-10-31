import type { z } from "zod";

/** What every admin server action returns to its form. */
export type ActionResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | {
      ok: false;
      message: string;
      /** Field path ("links.github", "highlights.2") → first error message. */
      errors?: Record<string, string>;
    };

/** Zod issues → one message per field path, for showing next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.map(String).join(".") || "_form";
    errors[path] ??= issue.message;
  }
  return errors;
}

export function invalid(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    message: "Some fields need attention.",
    errors: fieldErrors(error),
  };
}
