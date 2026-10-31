"use client";

import { useCallback, useState } from "react";
import { requestUpload } from "@/actions/admin/uploads";
import { checkFile, type UploadKind } from "@/lib/uploads";

export type UploadResult =
  { ok: true; key: string; url: string } | { ok: false; message: string };

/** PUT a file to a presigned URL, reporting progress (fetch can't report upload progress). */
function put(
  url: string,
  file: File,
  onProgress: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    // Must match the Content-Type the URL was signed with.
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    // A network error here usually means the bucket's CORS rules don't allow this site.
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

/** Upload one file straight to the bucket. The caller then saves {key, url} with a set* action. */
export function useUpload(kind: UploadKind) {
  const [progress, setProgress] = useState<number | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      const problem = checkFile(kind, file.type, file.size);
      if (problem) return { ok: false, message: problem };

      setProgress(0);
      try {
        const ticket = await requestUpload({
          kind,
          contentType: file.type,
          size: file.size,
        });
        if (!ticket.ok || !ticket.data)
          return { ok: false, message: ticket.message };
        await put(ticket.data.uploadUrl, file, setProgress);
        return { ok: true, key: ticket.data.key, url: ticket.data.url };
      } catch (error) {
        const network = error instanceof Error && error.message === "network";
        return {
          ok: false,
          message: network
            ? "Couldn't reach the storage bucket. Check its CORS settings allow uploads from this site."
            : "The upload failed. Please try again.",
        };
      } finally {
        setProgress(null);
      }
    },
    [kind],
  );

  return { upload, progress, uploading: progress !== null };
}
