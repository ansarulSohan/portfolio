"use client";

import { useRouter } from "next/navigation";
import {
  createListItem,
  deleteListItem,
  updateListItem,
  type ListKind,
} from "@/actions/admin/lists";
import { useAdminAction } from "../useAdminAction";

/** Save/delete wiring shared by the experience, education and skills editors. */
export function useListEditor(
  kind: ListKind,
  id: string | null,
  basePath: string,
) {
  const { pending, errors, run } = useAdminAction();
  const router = useRouter();

  const save = (form: unknown) => {
    if (id === null) {
      run(() => createListItem(kind, form), {
        refresh: false,
        onSuccess: (result) =>
          result.data && router.replace(`${basePath}/${result.data.id}`),
      });
    } else {
      run(() => updateListItem(kind, id, form));
    }
  };

  const remove = () => {
    if (id === null) return;
    run(() => deleteListItem(kind, id), {
      refresh: false,
      onSuccess: () => router.replace(basePath),
    });
  };

  return { pending, errors, save, remove };
}
