import { ArrowUpRightIcon } from "lucide-react";
import type { ProfileDTO } from "@/lib/dto";
import { cn } from "@/lib/utils";

export function socialLinks(
  profile: ProfileDTO,
): { label: string; href: string }[] {
  const { socials } = profile;
  return [
    socials.github && { label: "GitHub", href: socials.github },
    socials.linkedin && { label: "LinkedIn", href: socials.linkedin },
    socials.x && { label: "X", href: socials.x },
    socials.website && { label: "Website", href: socials.website },
  ].filter((link): link is { label: string; href: string } => Boolean(link));
}

/** Text links ("GitHub ↗") rather than logos: clearer for everyone, incl. screen readers. */
export function SocialLinks({
  profile,
  className,
}: {
  profile: ProfileDTO;
  className?: string;
}) {
  const links = socialLinks(profile);
  if (links.length === 0) return null;
  return (
    <ul
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}
    >
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-sm text-sm font-medium underline-offset-4 hover:underline"
          >
            {link.label}
            <ArrowUpRightIcon className="size-3.5" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
