import { useEffect } from "react";
import { MENU_ITEMS, type SectionId } from "../../types";
import { Z } from "../../styles/theme";
import {
  AboutSection,
  SkillsSection,
  ProjectsSection,
  ExperienceSection,
  ContactSection,
} from "../sections";

const CONTENT: Record<SectionId, () => React.ReactNode> = {
  about: AboutSection,
  skills: SkillsSection,
  projects: ProjectsSection,
  experience: ExperienceSection,
  contact: ContactSection,
};

interface SectionViewProps {
  section: SectionId;
  onBack: () => void;
}

/** Full-screen content frame with a header, Back control, and Esc-to-close. */
export function SectionView({ section, onBack }: SectionViewProps) {
  const item = MENU_ITEMS.find((m) => m.id === section)!;
  const Content = CONTENT[section];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: Z.panel,
        display: "flex",
        flexDirection: "column",
        padding: "clamp(48px, 6vh, 72px) clamp(22px, 9vw, 96px)",
        pointerEvents: "auto",
        animation: "section-enter 420ms cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: 18,
          marginBottom: "clamp(20px, 4vh, 40px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span
            className="venom-mono"
            style={{ fontSize: 12, opacity: 0.5 }}
          >
            {item.index}
          </span>
          <h2
            className="venom-mono"
            style={{
              margin: 0,
              fontSize: "clamp(26px, 5vw, 46px)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "clamp(2px, 1vw, 5px)",
              overflowWrap: "anywhere",
              textShadow: "0 0 22px rgba(255,255,255,0.35)",
            }}
          >
            {item.label}
          </h2>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="venom-mono"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.35)",
            color: "#fff",
            cursor: "pointer",
            padding: "10px 20px",
            fontSize: 11,
            letterSpacing: 4,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.95)";
            e.currentTarget.style.boxShadow = "0 0 24px rgba(255,255,255,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          ◂ BACK · ESC
        </button>
      </div>

      {/* Content */}
      <div
        className="sym-scroll"
        style={{ flex: 1, overflowY: "auto", paddingRight: 12 }}
      >
        <Content />
      </div>
    </div>
  );
}
