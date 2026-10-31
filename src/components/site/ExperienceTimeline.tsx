import { Badge } from "@/components/ui/badge";
import type { ExperienceDTO } from "@/lib/dto";
import { formatRange } from "@/lib/site";
import { Section } from "./Section";

export function ExperienceTimeline({ items }: { items: ExperienceDTO[] }) {
  if (items.length === 0) return null;
  return (
    <Section id="experience" title="Experience">
      <ol className="relative flex flex-col gap-10 border-l pl-6 sm:pl-8">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span
              aria-hidden
              className="bg-background border-primary absolute top-1.5 -left-[calc(1.5rem+5px)] size-2.5 rounded-full border-2 sm:-left-[calc(2rem+5px)]"
            />
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <h3 className="text-lg font-semibold tracking-tight">
                {item.role}
                <span className="text-muted-foreground font-normal">
                  {" · "}
                  {item.companyUrl ? (
                    <a
                      href={item.companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground underline-offset-4 hover:underline"
                    >
                      {item.company}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    item.company
                  )}
                </span>
              </h3>
              <p className="text-muted-foreground shrink-0 text-sm tabular-nums">
                {formatRange(item.start, item.end)}
                {item.location && ` · ${item.location}`}
              </p>
            </div>

            {item.highlights.length > 0 && (
              <ul className="text-muted-foreground mt-3 flex max-w-[70ch] list-disc flex-col gap-2 pl-5 leading-7">
                {item.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            )}

            {item.tech.length > 0 && (
              <ul
                className="mt-3 flex flex-wrap gap-1.5"
                aria-label="Technologies"
              >
                {item.tech.map((tech) => (
                  <li key={tech}>
                    <Badge variant="secondary">{tech}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}
