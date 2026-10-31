"use client";

import { setProjectFlag } from "@/actions/admin/projects";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAdminAction } from "./useAdminAction";

/** Published / Featured switches on a project list row. */
export function ProjectFlags({
  id,
  title,
  published,
  featured,
}: {
  id: string;
  title: string;
  published: boolean;
  featured: boolean;
}) {
  const { pending, run } = useAdminAction();
  return (
    <div className="flex items-center gap-4 text-sm">
      {(["published", "featured"] as const).map((flag) => {
        const checked = flag === "published" ? published : featured;
        const switchId = `${flag}-${id}`;
        return (
          <div key={flag} className="flex items-center gap-2">
            <Switch
              id={switchId}
              size="sm"
              checked={checked}
              disabled={pending}
              onCheckedChange={(value) =>
                run(() => setProjectFlag(id, flag, value))
              }
              aria-label={`${flag === "published" ? "Published" : "Featured"}: ${title}`}
            />
            <Label
              htmlFor={switchId}
              className="text-muted-foreground font-normal"
              aria-hidden
            >
              {flag === "published" ? "Published" : "Featured"}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
