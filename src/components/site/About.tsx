import type { ProfileDTO } from "@/lib/dto";
import { Markdown } from "./Markdown";
import { Section } from "./Section";

export function About({ profile }: { profile: ProfileDTO }) {
  if (!profile.bio && profile.values.length === 0) return null;
  return (
    <Section id="about" title="About">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {profile.bio && (
          <Markdown className="max-w-[65ch] text-lg leading-8">
            {profile.bio}
          </Markdown>
        )}
        {profile.values.length > 0 && (
          <div>
            <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
              How I work
            </h3>
            <ul className="flex flex-col gap-3">
              {profile.values.map((value) => (
                <li
                  key={value}
                  className="bg-card rounded-lg border px-4 py-3 font-medium"
                >
                  {value}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
}
