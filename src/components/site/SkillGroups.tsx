import type { SkillCategoryDTO } from "@/lib/dto";
import type { SkillLevel } from "@/lib/validation";
import { cn } from "@/lib/utils";

const LEVEL_LABEL: Record<SkillLevel, string> = {
  expert: "Expert",
  proficient: "Proficient",
  familiar: "Familiar",
};

/** Level is shown as text plus dots (dots are decorative), never colour alone. */
function LevelDots({ level }: { level: SkillLevel }) {
  const filled = { familiar: 1, proficient: 2, expert: 3 }[level];
  return (
    <span aria-hidden className="flex gap-0.5">
      {[1, 2, 3].map((dot) => (
        <span
          key={dot}
          className={cn(
            "size-1.5 rounded-full",
            dot <= filled ? "bg-primary" : "bg-border",
          )}
        />
      ))}
    </span>
  );
}

export function SkillGroups({
  categories,
}: {
  categories: SkillCategoryDTO[];
}) {
  if (categories.length === 0) return null;
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {categories.map((category) => (
        <div key={category.id} className="bg-card rounded-xl border p-5">
          <h3 className="mb-4 font-semibold">{category.name}</h3>
          <ul className="flex flex-col gap-2.5">
            {category.items.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="font-medium">{item.name}</span>
                {item.level && (
                  <span className="text-muted-foreground flex items-center gap-2 text-xs">
                    {LEVEL_LABEL[item.level]}
                    <LevelDots level={item.level} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
