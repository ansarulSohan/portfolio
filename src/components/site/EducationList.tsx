import { GraduationCapIcon } from "lucide-react";
import type { EducationDTO } from "@/lib/dto";
import { formatRange } from "@/lib/site";

export function EducationList({ items }: { items: EducationDTO[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-6">
      {items.map((item) => (
        <li key={item.id} className="flex gap-4">
          <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg border">
            <GraduationCapIcon className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-semibold">{item.degree}</h3>
            <p className="text-muted-foreground text-sm">
              {item.institution}
              {item.location && ` · ${item.location}`}
              {" · "}
              <span className="tabular-nums">
                {formatRange(item.start, item.end)}
              </span>
            </p>
            {item.notes && (
              <p className="text-muted-foreground mt-2 max-w-[70ch] text-sm leading-6">
                {item.notes}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
