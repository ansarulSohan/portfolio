"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { isValidId } from "@/lib/admin-crud";
import { requireAdmin } from "@/lib/auth";
import { TAGS } from "@/lib/cache-tags";
import { connectDB } from "@/lib/db";
import {
  deleteObject,
  headObject,
  isOwnUpload,
  newKey,
  presignUpload,
  publicUrl,
} from "@/lib/s3";
import {
  checkFile,
  isUploadKind,
  UPLOAD_PREFIX,
  type UploadKind,
} from "@/lib/uploads";
import {
  fileSchema,
  imageSchema,
  type FileInput,
  type ImageInput,
} from "@/lib/validation";
import { Profile, Project } from "@/models";

/*
 * Upload flow:
 *  1. requestUpload: validate type/size, return a presigned PUT URL + key.
 *  2. The browser PUTs the file straight to the bucket.
 *  3. set*: confirm the object exists with an allowed type and size, then
 *     save it on the profile/project and delete whatever it replaced.
 */

export async function requestUpload(input: {
  kind: UploadKind;
  contentType: string;
  size: number;
}): Promise<ActionResult<{ uploadUrl: string; key: string; url: string }>> {
  await requireAdmin();
  if (!isUploadKind(input?.kind))
    return { ok: false, message: "Unknown upload type." };
  const problem = checkFile(
    input.kind,
    String(input.contentType),
    Number(input.size),
  );
  if (problem) return { ok: false, message: problem };

  try {
    const key = newKey(input.kind, input.contentType);
    const uploadUrl = await presignUpload(
      key,
      input.contentType,
      Number(input.size),
    );
    return {
      ok: true,
      message: "Upload ready.",
      data: { uploadUrl, key, url: publicUrl(key) },
    };
  } catch (error) {
    console.error("Presign failed", error);
    return {
      ok: false,
      message: "Uploads aren't configured correctly. Check the S3_* settings.",
    };
  }
}

/** Is this a real upload of `kind` that respects the rules? Deletes it if not. */
async function verifyUpload(
  kind: UploadKind,
  key: string,
  url: string,
): Promise<string | null> {
  if (!isOwnUpload(key, url) || !key.startsWith(`${UPLOAD_PREFIX}${kind}/`)) {
    return "That file wasn't uploaded through this site.";
  }
  const head = await headObject(key);
  if (!head) return "The upload didn't finish. Please try again.";
  const problem = checkFile(kind, head.contentType, head.size);
  if (problem) {
    await deleteObject(key);
    return problem;
  }
  return null;
}

const NOT_FOUND: ActionResult = {
  ok: false,
  message: "That item no longer exists.",
};
const invalidImage = (error: z.ZodError): ActionResult => ({
  ok: false,
  message: error.issues.some((issue) => issue.path.includes("alt"))
    ? "Add a short description of the image (alt text)."
    : "That image isn't valid.",
  errors: { alt: "Describe the image for people who can't see it." },
});

// ---- Profile photo -------------------------------------------------------

export async function setAvatar(
  input: ImageInput | null,
): Promise<ActionResult> {
  await requireAdmin();
  await connectDB();
  const current =
    (await Profile.findOne().select("avatar").lean())?.avatar ?? null;

  if (input === null) {
    await Profile.updateOne({}, { $unset: { avatar: 1 } });
    await deleteObject(current?.key);
    updateTag(TAGS.profile);
    return { ok: true, message: "Photo removed." };
  }

  const parsed = imageSchema.safeParse(input);
  if (!parsed.success) return invalidImage(parsed.error);
  const image = parsed.data;
  if (image.key !== current?.key) {
    const problem = await verifyUpload("avatar", image.key, image.url);
    if (problem) return { ok: false, message: problem };
  }

  await Profile.updateOne({}, { $set: { avatar: image } }, { upsert: true });
  if (current?.key && current.key !== image.key)
    await deleteObject(current.key);
  updateTag(TAGS.profile);
  return {
    ok: true,
    message:
      image.key === current?.key ? "Description saved." : "Photo updated.",
  };
}

// ---- Résumé --------------------------------------------------------------

export async function setResume(
  input: FileInput | null,
): Promise<ActionResult> {
  await requireAdmin();
  await connectDB();
  const current =
    (await Profile.findOne().select("resume").lean())?.resume ?? null;

  if (input === null) {
    await Profile.updateOne({}, { $unset: { resume: 1 } });
    await deleteObject(current?.key);
    updateTag(TAGS.profile);
    return { ok: true, message: "Résumé removed." };
  }

  const parsed = fileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "That file isn't valid." };
  const file = parsed.data;
  if (file.key !== current?.key) {
    const problem = await verifyUpload("resume", file.key, file.url);
    if (problem) return { ok: false, message: problem };
  }

  await Profile.updateOne({}, { $set: { resume: file } }, { upsert: true });
  if (current?.key && current.key !== file.key) await deleteObject(current.key);
  updateTag(TAGS.profile);
  return { ok: true, message: "Résumé updated. /resume now points to it." };
}

// ---- Project cover and gallery -----------------------------------------------

export async function setProjectCover(
  projectId: string,
  input: ImageInput | null,
): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidId(projectId)) return NOT_FOUND;
  await connectDB();
  const project = await Project.findById(projectId).select("cover slug").lean();
  if (!project) return NOT_FOUND;
  const current = project.cover ?? null;

  if (input === null) {
    await Project.updateOne({ _id: projectId }, { $unset: { cover: 1 } });
    await deleteObject(current?.key);
  } else {
    const parsed = imageSchema.safeParse(input);
    if (!parsed.success) return invalidImage(parsed.error);
    if (parsed.data.key !== current?.key) {
      const problem = await verifyUpload(
        "project",
        parsed.data.key,
        parsed.data.url,
      );
      if (problem) return { ok: false, message: problem };
    }
    await Project.updateOne(
      { _id: projectId },
      { $set: { cover: parsed.data } },
    );
    if (current?.key && current.key !== parsed.data.key)
      await deleteObject(current.key);
  }

  updateTag(TAGS.projects);
  updateTag(TAGS.project(project.slug));
  return {
    ok: true,
    message: input === null ? "Cover removed." : "Cover saved.",
  };
}

const gallerySchema = z
  .array(imageSchema)
  .max(20, "A gallery can hold up to 20 images.");

/** Replace the whole gallery (handles add, remove, reorder and alt-text edits). */
export async function setProjectGallery(
  projectId: string,
  input: ImageInput[],
): Promise<ActionResult> {
  await requireAdmin();
  if (!isValidId(projectId)) return NOT_FOUND;
  const parsed = gallerySchema.safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues.some((issue) => issue.path.includes("alt"))
      ? invalidImage(parsed.error)
      : {
          ok: false,
          message:
            parsed.error.issues[0]?.message ?? "That gallery isn't valid.",
        };
  }
  const next = parsed.data;
  if (new Set(next.map((image) => image.key)).size !== next.length) {
    return { ok: false, message: "The same image appears twice." };
  }

  await connectDB();
  const project = await Project.findById(projectId)
    .select("gallery slug")
    .lean();
  if (!project) return NOT_FOUND;
  const previousKeys = new Set(project.gallery.map((image) => image.key));

  for (const image of next) {
    if (previousKeys.has(image.key)) continue;
    const problem = await verifyUpload("project", image.key, image.url);
    if (problem) return { ok: false, message: problem };
  }

  await Project.updateOne({ _id: projectId }, { $set: { gallery: next } });
  const keptKeys = new Set(next.map((image) => image.key));
  await Promise.all(
    [...previousKeys].filter((key) => !keptKeys.has(key)).map(deleteObject),
  );

  updateTag(TAGS.projects);
  updateTag(TAGS.project(project.slug));
  return { ok: true, message: "Gallery saved." };
}
