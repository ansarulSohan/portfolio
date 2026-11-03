"use client";

import { useActionState, useEffect, useRef } from "react";
import { CircleAlertIcon, CircleCheckIcon, SendIcon } from "lucide-react";
import { submitComment, type CommentFormState } from "@/actions/comments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: CommentFormState = { status: "idle" };

type FieldName = "name" | "email" | "body";

/** Leave a comment. It's held for approval, which the form says up front. */
export function CommentForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(submitComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
    if (state.status === "error" && state.fieldErrors) {
      formRef.current
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus();
    } else if (state.status !== "idle") {
      statusRef.current?.focus();
    }
  }, [state]);

  const field = (name: FieldName) => ({
    id: `comment-${name}`,
    name,
    defaultValue: values[name],
    ...(errors[name] && {
      "aria-invalid": true as const,
      "aria-describedby": `comment-${name}-error`,
    }),
  });
  const error = (name: FieldName) =>
    errors[name] && (
      <p id={`comment-${name}-error`} className="text-destructive text-sm">
        {errors[name]}
      </p>
    );

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="flex flex-col gap-5"
      key={JSON.stringify(values)}
      aria-describedby="comment-note"
    >
      <input type="hidden" name="postId" value={postId} />
      <p id="comment-note" className="text-muted-foreground text-sm">
        Comments are checked before they appear. Your email is never shown.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="comment-name">Name</Label>
          <Input
            {...field("name")}
            autoComplete="name"
            required
            maxLength={80}
          />
          {error("name")}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="comment-email">Email</Label>
          <Input
            {...field("email")}
            type="email"
            autoComplete="email"
            required
          />
          {error("email")}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="comment-body">Comment</Label>
        <Textarea {...field("body")} required rows={5} maxLength={2000} />
        {error("body")}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="comment-website">Leave this field empty</label>
        <input
          id="comment-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button type="submit" disabled={pending} className="self-start">
          <SendIcon aria-hidden data-icon="inline-start" />
          {pending ? "Posting…" : "Post comment"}
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
