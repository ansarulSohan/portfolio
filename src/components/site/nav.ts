import type { SettingsDTO } from "@/lib/dto";
import type { SectionKey } from "@/lib/validation";

export interface NavLink {
  href: string;
  label: string;
  section: SectionKey;
}

/** Header links in display order: home-page sections, plus the blog page. */
export const NAV_LINKS: NavLink[] = [
  { href: "/#about", label: "About", section: "about" },
  { href: "/#projects", label: "Projects", section: "projects" },
  { href: "/#experience", label: "Experience", section: "experience" },
  { href: "/#skills", label: "Skills", section: "skills" },
  { href: "/#education", label: "Education", section: "education" },
  { href: "/blog", label: "Blog", section: "blog" },
  { href: "/#contact", label: "Contact", section: "contact" },
];

export function visibleNavLinks(settings: SettingsDTO): NavLink[] {
  return NAV_LINKS.filter((link) => settings.sections[link.section]);
}
