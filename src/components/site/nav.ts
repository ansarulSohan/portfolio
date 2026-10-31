import type { SettingsDTO } from "@/lib/dto";
import type { SectionKey } from "@/lib/validation";

export interface NavLink {
  href: string;
  label: string;
  section: SectionKey;
}

/** Home-page sections in display order, used by the header nav and the page itself. */
export const NAV_LINKS: NavLink[] = [
  { href: "/#about", label: "About", section: "about" },
  { href: "/#projects", label: "Projects", section: "projects" },
  { href: "/#experience", label: "Experience", section: "experience" },
  { href: "/#skills", label: "Skills", section: "skills" },
  { href: "/#contact", label: "Contact", section: "contact" },
];

export function visibleNavLinks(settings: SettingsDTO): NavLink[] {
  return NAV_LINKS.filter((link) => settings.sections[link.section]);
}
