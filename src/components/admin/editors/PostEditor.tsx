"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";
import { createPost, deletePost, updatePost } from "@/actions/admin/posts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  dateToZonedInput,
  formatPostDate,
  postState,
  readingMinutes,
} from "@/lib/blog";
import type { PostDTO } from "@/lib/dto";
import { slugify } from "@/lib/slug";
import type { PostStatus } from "@/lib/validation";
import { ConfirmDelete } from "../ConfirmDelete";
import { EditorSection, EditorShell } from "../EditorShell";
import {
  MarkdownField,
  SwitchField,
  TagsField,
  TextAreaField,
  TextField,
} from "../fields";
import { InsertImage, PostCoverField } from "../UploadFields";
import { useAdminAction } from "../useAdminAction";

function toForm(post: PostDTO | null) {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    body: post?.body ?? "",
    tags: post?.tags ?? [],
    status: post?.status ?? ("draft" as PostStatus),
    /** Norway time, "YYYY-MM-DDTHH:mm"; empty = publish now. */
    publishAt: dateToZonedInput(post?.publishAt),
    commentsOpen: post?.commentsOpen ?? true,
  };
}

const STATE_TEXT = {
  draft: "Draft: only you can see it.",
  scheduled: "Scheduled",
  published: "Published",
} as const;

export function PostEditor({ post }: { post: PostDTO | null }) {
  const isNew = post === null;
  const [form, setForm] = useState(() => toForm(post));
  // New posts derive the slug from the title until the slug is edited by hand.
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const { pending, errors, run } = useAdminAction();
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  // The saved state, as visitors see it now.
  const saved = post ? postState(post) : "draft";

  const insertAtCursor = (markdown: string) => {
    const textarea = bodyRef.current;
    const start = textarea?.selectionStart ?? form.body.length;
    const end = textarea?.selectionEnd ?? start;
    const before = form.body.slice(0, start);
    const after = form.body.slice(end);
    // Images go on their own line.
    const prefix = before && !before.endsWith("\n\n") ? "\n\n" : "";
    const suffix = after.startsWith("\n") ? "" : "\n\n";
    const inserted = `${prefix}${markdown}${suffix}`;
    set("body", before + inserted + after);
    requestAnimationFrame(() => {
      const caret = before.length + inserted.length;
      textarea?.focus();
      textarea?.setSelectionRange(caret, caret);
    });
  };

  const save = () => {
    if (isNew) {
      run(() => createPost(form), {
        refresh: false,
        onSuccess: (result) =>
          result.data && router.replace(`/admin/blog/${result.data.id}`),
      });
    } else {
      run(() => updatePost(post.id, form));
    }
  };

  return (
    <EditorShell
      title={isNew ? "New post" : form.title || "Untitled post"}
      backHref="/admin/blog"
      backLabel="All posts"
      onSubmit={save}
      pending={pending}
      submitLabel={isNew ? "Create post" : "Save"}
      formError={errors._form}
      aside={
        !isNew && (
          <>
            {saved === "published" && (
              <Button asChild variant="ghost">
                <Link href={`/blog/${post.slug}`} target="_blank">
                  View
                  <ExternalLinkIcon aria-hidden data-icon="inline-end" />
                  <span className="sr-only">(opens in a new tab)</span>
                </Link>
              </Button>
            )}
            <ConfirmDelete
              itemName={post.title}
              disabled={pending}
              description="The post, its comments and its images are deleted. This can't be undone."
              onConfirm={() =>
                run(() => deletePost(post.id), {
                  refresh: false,
                  onSuccess: () => router.replace("/admin/blog"),
                })
              }
            />
          </>
        )
      }
    >
      <EditorSection title="Publishing">
        {!isNew && (
          <p className="text-sm">
            <Badge
              variant={saved === "published" ? "default" : "secondary"}
              className="mr-2"
            >
              {saved === "draft" ? "Draft" : STATE_TEXT[saved]}
            </Badge>
            {saved === "draft"
              ? STATE_TEXT.draft
              : post.publishAt &&
                `${saved === "scheduled" ? "Goes live" : "Since"} ${formatPostDate(post.publishAt)}.`}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <SwitchField
            label="Published"
            description="Off keeps it a draft that only you can see."
            checked={form.status === "published"}
            onChange={(on) => set("status", on ? "published" : "draft")}
          />
          <SwitchField
            label="Comments open"
            description="Readers can comment. Every comment waits for your approval."
            checked={form.commentsOpen}
            onChange={(v) => set("commentsOpen", v)}
          />
        </div>
        <TextField
          label="Publish date and time (Norway time)"
          optional
          type="datetime-local"
          value={form.publishAt}
          onChange={(v) => set("publishAt", v)}
          error={errors.publishAt}
          className="sm:max-w-xs"
          description="Leave empty to publish as soon as you save. A future time schedules the post: it goes live by itself."
        />
      </EditorSection>

      <EditorSection
        title="Overview"
        description="Shown in the post list, the RSS feed and search results."
      >
        <TextField
          label="Title"
          value={form.title}
          onChange={(title) =>
            setForm((current) => ({
              ...current,
              title,
              slug: slugTouched ? current.slug : slugify(title),
            }))
          }
          error={errors.title}
          maxLength={160}
        />
        <TextField
          label="URL"
          value={form.slug}
          onChange={(v) => {
            setSlugTouched(true);
            set("slug", v.toLowerCase());
          }}
          error={errors.slug}
          maxLength={80}
          description={`The post will be at /blog/${form.slug || "…"}. Changing it after publishing breaks old links.`}
        />
        <TextAreaField
          label="Excerpt"
          rows={2}
          value={form.excerpt}
          onChange={(v) => set("excerpt", v)}
          error={errors.excerpt}
          maxLength={300}
          description={`One or two sentences that make people want to read on. ${form.excerpt.length}/300`}
        />
        <TagsField
          label="Tags"
          optional
          values={form.tags}
          onChange={(v) => set("tags", v)}
          error={errors.tags}
          placeholder="e.g. DevOps"
          description="Readers can filter posts by tag. Up to 10."
        />
      </EditorSection>

      <EditorSection
        title="Post"
        description={`About ${readingMinutes(form.body)} min read.`}
      >
        <MarkdownField
          label="Text"
          value={form.body}
          onChange={(v) => set("body", v)}
          error={errors.body}
          rows={24}
          textareaRef={bodyRef}
          toolbar={
            isNew ? (
              <p className="text-muted-foreground text-xs">
                Create the post first to add images.
              </p>
            ) : (
              <InsertImage postId={post.id} onInsert={insertAtCursor} />
            )
          }
        />
      </EditorSection>

      <EditorSection
        title="Cover image"
        description="Saves as soon as it's uploaded, separately from the Save button."
      >
        {isNew ? (
          <p className="text-muted-foreground text-sm">
            Create the post first, then add a cover image.
          </p>
        ) : (
          <PostCoverField postId={post.id} current={post.cover ?? null} />
        )}
      </EditorSection>
    </EditorShell>
  );
}
