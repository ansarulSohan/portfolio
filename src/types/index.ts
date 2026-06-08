export type WebNodeType = "primary" | "secondary" | "center";

export interface WebNode {
  id: string;
  position: [number, number, number];
  label: string;
  type: WebNodeType;
  isContact?: boolean;
}

export interface WebEdge {
  from: string;
  to: string;
}

export interface WebGraph {
  nodes: WebNode[];
  edges: WebEdge[];
}

export type SectionId =
  | "about"
  | "skills"
  | "projects"
  | "experience"
  | "contact";

export interface MenuItem {
  id: SectionId;
  /** Display label, e.g. "ABOUT". */
  label: string;
  /** Two-digit index shown game-style, e.g. "01". */
  index: string;
  /** One-line subtitle / status line shown under the menu item. */
  hint: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: "about", label: "ABOUT", index: "01", hint: "Origin & directives" },
  { id: "skills", label: "SKILLS", index: "02", hint: "Loadout & systems" },
  { id: "projects", label: "PROJECTS", index: "03", hint: "Mission archive" },
  {
    id: "experience",
    label: "EXPERIENCE",
    index: "04",
    hint: "Service record",
  },
  { id: "contact", label: "CONTACT", index: "05", hint: "Open comms" },
];

export interface PortfolioData {
  meta: {
    name: string;
    title: string;
    location: string;
    email: string;
    linkedin: string;
    github: string;
    resumeUrl?: string;
  };
  about: {
    bio: string[];
    philosophies: string[];
  };
  skills: {
    category: string;
    items: { name: string; level: number }[];
  }[];
  projects: {
    title: string;
    description: string;
    tech: string[];
    github?: string;
    live?: string;
    image?: string;
  }[];
  experience: {
    role: string;
    company: string;
    period: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    notes?: string;
  }[];
}

