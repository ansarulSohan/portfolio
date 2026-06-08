import { useEffect, useState } from "react";
import { MENU_ITEMS, type SectionId } from "../../types";
import { portfolio } from "../../data/portfolio";
import { Z } from "../../styles/theme";

interface MainMenuProps {
  onSelect: (id: SectionId) => void;
}

/** Futuristic game homescreen: title + vertical option list, keyboard + mouse. */
export function MainMenu({ onSelect }: MainMenuProps) {
  const { meta } = portfolio;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setActive((i) => (i + 1) % MENU_ITEMS.length);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((i) => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSelect(MENU_ITEMS[active].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onSelect]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: Z.panel,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: "clamp(72px, 10vh, 120px) clamp(22px, 9vw, 96px)",
        animation: "fade-in 500ms ease-out",
      }}
    >
      <div style={{ margin: "auto 0", width: "100%" }}>
        {/* Title block */}
        <div style={{ marginBottom: "clamp(28px, 6vh, 64px)" }}>
        <div
          className="venom-mono"
          style={{ fontSize: 11, opacity: 0.5, letterSpacing: 8 }}
        >
          MAIN MENU
        </div>
        <h1
          className="venom-mono"
          style={{
            margin: "12px 0 0",
            fontSize: "clamp(34px, 7vw, 72px)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "clamp(2px, 1vw, 6px)",
            lineHeight: 1.02,
            overflowWrap: "anywhere",
            textShadow:
              "0 0 24px rgba(255,255,255,0.4), 0 0 60px rgba(255,255,255,0.14)",
          }}
        >
          {meta.name.toUpperCase()}
        </h1>
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            letterSpacing: 5,
            textTransform: "uppercase",
            opacity: 0.55,
          }}
        >
          {meta.title}
        </div>
      </div>

      {/* Options */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          pointerEvents: "auto",
        }}
      >
        {MENU_ITEMS.map((item, i) => {
          const on = i === active;
          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => onSelect(item.id)}
              className="venom-mono"
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 18,
                width: "fit-content",
                maxWidth: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: "10px 14px",
                color: on ? "#fff" : "rgba(240,240,240,0.5)",
                transform: on ? "translateX(14px)" : "translateX(0)",
                transition: "all 0.22s cubic-bezier(0.23,1,0.32,1)",
                textShadow: on ? "0 0 22px rgba(255,255,255,0.45)" : "none",
              }}
            >
              <span style={{ fontSize: 12, opacity: 0.6, letterSpacing: 2 }}>
                {item.index}
              </span>
              <span style={{ width: 16, opacity: on ? 1 : 0 }}>▸</span>
              <span
                style={{
                  fontSize: "clamp(20px, 3.4vw, 34px)",
                  fontWeight: on ? 800 : 600,
                  letterSpacing: 5,
                }}
              >
                {item.label}
              </span>
              <span
                className="hide-sm"
                style={{
                  fontSize: 10,
                  letterSpacing: 3,
                  opacity: on ? 0.55 : 0,
                  transition: "opacity 0.22s ease",
                }}
              >
                {item.hint}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer links */}
      <div
        style={{
          marginTop: "clamp(28px, 6vh, 56px)",
          display: "flex",
          gap: "clamp(14px, 4vw, 28px)",
          flexWrap: "wrap",
          fontSize: 10,
          letterSpacing: 3,
          opacity: 0.55,
          pointerEvents: "auto",
        }}
      >
        <a href={meta.github} target="_blank" rel="noreferrer" style={linkStyle}>
          GITHUB
        </a>
        <a
          href={meta.linkedin}
          target="_blank"
          rel="noreferrer"
          style={linkStyle}
        >
          LINKEDIN
        </a>
        </div>
      </div>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  color: "#fff",
  textDecoration: "none",
  fontFamily: '"Orbitron", "Courier New", monospace',
  letterSpacing: 3,
  borderBottom: "1px solid rgba(255,255,255,0.3)",
  paddingBottom: 2,
};
