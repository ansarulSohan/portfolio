"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  FileTextIcon,
  ImagePlusIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  setAvatar,
  setProjectCover,
  setProjectGallery,
  setResume,
} from "@/actions/admin/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/action-result";
import { UPLOAD_RULES, formatBytes, type UploadKind } from "@/lib/uploads";
import type { FileInput, ImageInput } from "@/lib/validation";
import { ConfirmDelete } from "./ConfirmDelete";
import { useAdminAction } from "./useAdminAction";
import { useUpload } from "./useUpload";

/*
 * Upload widgets. Each one saves on its own (separate from the editor's main
 * Save button), so all buttons here are type="button" inside the editor form.
 */

function Progress({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-label="Upload progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
    >
      <div
        className="bg-primary h-full transition-[width]"
        style={{ width: `${value * 100}%` }}
      />
    </div>
  );
}

/** A visually-hidden file input with a real button as its trigger. */
function FilePicker({
  kind,
  label,
  disabled,
  onPick,
}: {
  kind: UploadKind;
  label: string;
  disabled?: boolean;
  onPick: (file: File) => void;
}) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const accept = Object.keys(UPLOAD_RULES[kind].types).join(",");
  return (
    <>
      <input
        ref={ref}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = ""; // allow picking the same file again
          if (file) onPick(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => ref.current?.click()}
      >
        <UploadIcon aria-hidden data-icon="inline-start" />
        {label}
      </Button>
    </>
  );
}

/** Object URL for a local preview, revoked when it changes or unmounts. */
function usePreview(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors an external resource
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(null);
    };
  }, [file]);
  return url;
}

/**
 * One image with alt text: profile photo or project cover. Pick a file, describe
 * it, then upload. Existing images can have their description edited or be removed.
 */
export function SingleImageField({
  kind,
  label,
  description,
  current,
  save,
  previewClassName = "aspect-video w-full max-w-md",
}: {
  kind: "avatar" | "project";
  label: string;
  description: string;
  current: ImageInput | null;
  save: (image: ImageInput | null) => Promise<ActionResult>;
  previewClassName?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState(current?.alt ?? "");
  const preview = usePreview(file);
  const { upload, progress, uploading } = useUpload(kind);
  const { pending, errors, run } = useAdminAction();
  const altId = useId();
  const busy = uploading || pending;
  const altError = errors.alt;

  const submit = async () => {
    if (!alt.trim()) {
      toast.error("Describe the image first (alt text).");
      document.getElementById(altId)?.focus();
      return;
    }
    if (file) {
      const result = await upload(file);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      run(() => save({ url: result.url, key: result.key, alt: alt.trim() }), {
        onSuccess: () => setFile(null),
      });
    } else if (current) {
      run(() => save({ ...current, alt: alt.trim() }));
    }
  };

  const shown = preview ?? current?.url ?? null;
  const altChanged = current !== null && alt.trim() !== current.alt;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">
          {description} {UPLOAD_RULES[kind].label}.
        </p>
      </div>

      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of a local or bucket file
        <img
          src={shown}
          alt={alt || "Preview"}
          className={`bg-muted rounded-lg border object-cover ${previewClassName}`}
        />
      ) : (
        <div
          className={`bg-muted text-muted-foreground flex items-center justify-center rounded-lg border border-dashed text-sm ${previewClassName}`}
        >
          <ImagePlusIcon className="mr-2 size-4" aria-hidden />
          No image yet
        </div>
      )}
      {file && (
        <p className="text-muted-foreground text-xs">
          New file: {file.name} ({formatBytes(file.size)}). Not uploaded yet.
        </p>
      )}
      {progress !== null && <Progress value={progress} />}

      <div className="flex flex-col gap-2">
        <Label htmlFor={altId}>Image description (alt text)</Label>
        <Input
          id={altId}
          value={alt}
          maxLength={300}
          onChange={(event) => setAlt(event.target.value)}
          placeholder="e.g. Dashboard showing deployment metrics"
          aria-invalid={altError ? true : undefined}
          aria-describedby={`${altId}-desc${altError ? ` ${altId}-error` : ""}`}
        />
        <p id={`${altId}-desc`} className="text-muted-foreground text-xs">
          Read aloud by screen readers. Say what the image shows.
        </p>
        {altError && (
          <p id={`${altId}-error`} className="text-destructive text-sm">
            {altError}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilePicker
          kind={kind}
          label={current || file ? "Choose another file" : "Choose file"}
          disabled={busy}
          onPick={setFile}
        />
        {(file || altChanged) && (
          <Button type="button" onClick={submit} disabled={busy}>
            {uploading
              ? "Uploading…"
              : pending
                ? "Saving…"
                : file
                  ? "Upload & save"
                  : "Save description"}
          </Button>
        )}
        {file && (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => setFile(null)}
          >
            Cancel
          </Button>
        )}
        {current && !file && (
          <ConfirmDelete
            itemName={label.toLowerCase()}
            disabled={busy}
            description="The image is removed from the site and deleted from storage."
            onConfirm={() =>
              run(() => save(null), { onSuccess: () => setAlt("") })
            }
          />
        )}
      </div>
    </div>
  );
}

export function AvatarField({ current }: { current: ImageInput | null }) {
  return (
    <SingleImageField
      key={current?.key ?? "none"}
      kind="avatar"
      label="Profile photo"
      description="Shown next to your name at the top of the home page. A square photo works best."
      current={current}
      save={setAvatar}
      previewClassName="size-40"
    />
  );
}

export function CoverField({
  projectId,
  current,
}: {
  projectId: string;
  current: ImageInput | null;
}) {
  return (
    <SingleImageField
      key={current?.key ?? "none"}
      kind="project"
      label="Cover image"
      description="Shown on the project card and at the top of the project page. 16:9 works best."
      current={current}
      save={(image) => setProjectCover(projectId, image)}
    />
  );
}

/** The résumé PDF. /resume always redirects to the current one. */
export function ResumeField({ current }: { current: FileInput | null }) {
  const { upload, progress, uploading } = useUpload("resume");
  const { pending, run } = useAdminAction();
  const busy = uploading || pending;

  const pick = async (file: File) => {
    const result = await upload(file);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    run(() =>
      setResume({
        url: result.url,
        key: result.key,
        name: file.name.slice(0, 200),
      }),
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">Résumé</p>
        <p className="text-muted-foreground text-xs">
          Linked from the “Résumé” button on the home page, and always available
          at /resume. {UPLOAD_RULES.resume.label}.
        </p>
      </div>
      {current ? (
        <a
          href={current.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center gap-2 self-start text-sm font-medium hover:underline"
        >
          <FileTextIcon className="size-4" aria-hidden />
          {current.name}
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : (
        <p className="text-muted-foreground text-sm">No résumé uploaded.</p>
      )}
      {progress !== null && <Progress value={progress} />}
      <div className="flex flex-wrap gap-2">
        <FilePicker
          kind="resume"
          label={current ? "Replace PDF" : "Upload PDF"}
          disabled={busy}
          onPick={pick}
        />
        {current && (
          <ConfirmDelete
            itemName="résumé"
            disabled={busy}
            description="The /resume link stops working until you upload a new one."
            onConfirm={() => run(() => setResume(null))}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Project gallery. Adding, removing and reordering save immediately; edited
 * descriptions are saved with "Save descriptions".
 */
export function GalleryField({
  projectId,
  current,
}: {
  projectId: string;
  current: ImageInput[];
}) {
  const [images, setImages] = useState(current);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newAlt, setNewAlt] = useState("");
  const preview = usePreview(newFile);
  const { upload, progress, uploading } = useUpload("project");
  const { pending, run } = useAdminAction();
  const baseId = useId();
  const busy = uploading || pending;
  const dirty = images.some((image, i) => image.alt !== current[i]?.alt);

  const saveList = (list: ImageInput[], onSuccess?: () => void) => {
    const trimmed = list.map((image) => ({ ...image, alt: image.alt.trim() }));
    const missing = trimmed.findIndex((image) => !image.alt);
    if (missing >= 0) {
      toast.error(`Image ${missing + 1} needs a description.`);
      document.getElementById(`${baseId}-alt-${missing}`)?.focus();
      return;
    }
    run(() => setProjectGallery(projectId, trimmed), {
      onSuccess: () => {
        setImages(trimmed);
        onSuccess?.();
      },
    });
  };

  const add = async () => {
    if (!newFile) return;
    if (!newAlt.trim()) {
      toast.error("Describe the image first (alt text).");
      document.getElementById(`${baseId}-new-alt`)?.focus();
      return;
    }
    const result = await upload(newFile);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    saveList(
      [...images, { url: result.url, key: result.key, alt: newAlt }],
      () => {
        setNewFile(null);
        setNewAlt("");
      },
    );
  };

  const move = (index: number, by: -1 | 1) => {
    const next = [...images];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    saveList(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium">Gallery</p>
        <p className="text-muted-foreground text-xs">
          Extra screenshots shown at the bottom of the project page (up to 20).{" "}
          {UPLOAD_RULES.project.label}.
        </p>
      </div>

      {images.length > 0 && (
        <ol className="flex flex-col gap-3" aria-busy={busy}>
          {images.map((image, index) => (
            <li
              key={image.key}
              className="flex flex-wrap items-start gap-3 rounded-lg border p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
              <img
                src={image.url}
                alt=""
                className="bg-muted aspect-video w-32 rounded border object-cover"
              />
              <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                <Label htmlFor={`${baseId}-alt-${index}`}>
                  Image {index + 1} description
                </Label>
                <Input
                  id={`${baseId}-alt-${index}`}
                  value={image.alt}
                  maxLength={300}
                  onChange={(event) =>
                    setImages((list) =>
                      list.map((item, i) =>
                        i === index
                          ? { ...item, alt: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </div>
              <div className="flex gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move image ${index + 1} up`}
                >
                  <ArrowUpIcon aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy || index === images.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move image ${index + 1} down`}
                >
                  <ArrowDownIcon aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy}
                  onClick={() => saveList(images.filter((_, i) => i !== index))}
                  aria-label={`Remove image ${index + 1}`}
                >
                  <Trash2Icon aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
      {dirty && (
        <Button
          type="button"
          className="self-start"
          disabled={busy}
          onClick={() => saveList(images)}
        >
          Save descriptions
        </Button>
      )}

      {images.length < 20 && (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium">Add an image</p>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element -- local preview
            <img
              src={preview}
              alt=""
              className="bg-muted aspect-video w-48 rounded border object-cover"
            />
          )}
          {progress !== null && <Progress value={progress} />}
          {newFile && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${baseId}-new-alt`}>
                Description (alt text)
              </Label>
              <Input
                id={`${baseId}-new-alt`}
                value={newAlt}
                maxLength={300}
                onChange={(event) => setNewAlt(event.target.value)}
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <FilePicker
              kind="project"
              label={newFile ? "Choose another file" : "Choose file"}
              disabled={busy}
              onPick={setNewFile}
            />
            {newFile && (
              <Button type="button" onClick={add} disabled={busy}>
                {uploading
                  ? "Uploading…"
                  : pending
                    ? "Saving…"
                    : "Upload & add"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
