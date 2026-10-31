"use client";

import { useActionState, useEffect, useRef } from "react";
import { CircleAlertIcon, CircleCheckIcon, SendIcon } from "lucide-react";
import { sendContactMessage, type ContactFormState } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ContactFormState = { status: "idle" };

function Field({
  name,
  label,
  optional,
  error,
  children,
}: {
  name: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`contact-${name}`}>
        {label}
        {optional && (
          <span className="text-muted-foreground font-normal"> (optional)</span>
        )}
      </Label>
      {children}
      {error && (
        <p id={`contact-${name}-error`} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(
    sendContactMessage,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
    if (state.status === "error" && state.fieldErrors) {
      // Move focus to the first invalid field so keyboard and screen-reader users land on it.
      formRef.current
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus();
    } else if (state.status !== "idle") {
      statusRef.current?.focus();
    }
  }, [state]);

  const invalid = (name: keyof typeof errors) =>
    errors[name]
      ? {
          "aria-invalid": true as const,
          "aria-describedby": `contact-${name}-error`,
        }
      : {};

  return (
    // A key per result remounts the inputs so `defaultValue` restores the echoed values.
    <form
      ref={formRef}
      action={action}
      noValidate
      className="flex flex-col gap-5"
      key={JSON.stringify(values)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Name" error={errors.name}>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            defaultValue={values.name}
            {...invalid("name")}
          />
        </Field>
        <Field name="email" label="Email" error={errors.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={values.email}
            {...invalid("email")}
          />
        </Field>
      </div>
      <Field name="subject" label="Subject" optional error={errors.subject}>
        <Input
          id="contact-subject"
          name="subject"
          maxLength={200}
          defaultValue={values.subject}
          {...invalid("subject")}
        />
      </Field>
      <Field name="body" label="Message" error={errors.body}>
        <Textarea
          id="contact-body"
          name="body"
          required
          rows={6}
          maxLength={5000}
          defaultValue={values.body}
          {...invalid("body")}
        />
      </Field>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-11 self-start px-5 text-base"
        >
          <SendIcon aria-hidden data-icon="inline-start" />
          {pending ? "Sending…" : "Send message"}
        </Button>
        <div
          ref={statusRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className="text-sm outline-none"
        >
          {state.status === "success" && (
            <p className="inline-flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
              <CircleCheckIcon className="size-4 shrink-0" aria-hidden />
              {state.message}
            </p>
          )}
          {state.status === "error" && (
            <p className="text-destructive inline-flex items-center gap-2 font-medium">
              <CircleAlertIcon className="size-4 shrink-0" aria-hidden />
              {state.message}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
