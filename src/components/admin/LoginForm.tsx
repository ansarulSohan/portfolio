"use client";

import { useActionState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlertIcon, LogInIcon } from "lucide-react";
import { login, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );
  const next = useSearchParams().get("next") ?? "";
  const passwordRef = useRef<HTMLInputElement>(null);

  // After a failed attempt, put the cursor back in the password field.
  useEffect(() => {
    if (state.error) passwordRef.current?.focus();
  }, [state]);

  return (
    <form
      action={action}
      className="flex flex-col gap-5"
      key={state.email ?? ""}
    >
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <div
          role="alert"
          id="login-error"
          className="border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm"
        >
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus={!state.error}
          defaultValue={state.email}
          className="h-10"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          ref={passwordRef}
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={state.error ? "login-error" : undefined}
          className="h-10"
        />
      </div>

      <Button type="submit" disabled={pending} className="h-10 text-sm">
        <LogInIcon aria-hidden data-icon="inline-start" />
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
