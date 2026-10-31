/**
 * Upload rules shared by the client (pre-checks) and the server (enforcement).
 * No server-only imports: the admin UI uses these to reject files early.
 */

export type UploadKind = "avatar" | "resume" | "project";

export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

// SVG is deliberately not allowed: it can contain scripts.
export const UPLOAD_RULES: Record<
  UploadKind,
  { types: Record<string, string>; maxBytes: number; label: string }
> = {
  avatar: {
    types: IMAGE_TYPES,
    maxBytes: 5 * 1024 * 1024,
    label: "JPEG, PNG, WebP or AVIF, up to 5 MB",
  },
  project: {
    types: IMAGE_TYPES,
    maxBytes: 5 * 1024 * 1024,
    label: "JPEG, PNG, WebP or AVIF, up to 5 MB",
  },
  resume: {
    types: { "application/pdf": "pdf" },
    maxBytes: 10 * 1024 * 1024,
    label: "PDF, up to 10 MB",
  },
};

/** Every object this app creates lives under this prefix. */
export const UPLOAD_PREFIX = "uploads/";

export function isUploadKind(value: unknown): value is UploadKind {
  return value === "avatar" || value === "resume" || value === "project";
}

/** Client- and server-side check. Returns an error message, or null if the file is fine. */
export function checkFile(
  kind: UploadKind,
  type: string,
  size: number,
): string | null {
  const rule = UPLOAD_RULES[kind];
  if (!Object.hasOwn(rule.types, type))
    return `That file type isn't supported. Use ${rule.label}.`;
  if (size <= 0) return "That file is empty.";
  if (size > rule.maxBytes) return `That file is too large. Use ${rule.label}.`;
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
