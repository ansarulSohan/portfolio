import { portfolio } from "../../data/portfolio";

export function AboutSection() {
  const { about } = portfolio;
  return (
    <div style={{ maxWidth: 760 }}>
      {about.bio.map((para, i) => (
        <p
          key={i}
          style={{
            fontSize: "clamp(15px, 1.8vw, 19px)",
            lineHeight: 1.7,
            color: "var(--color-text)",
            margin: "0 0 20px",
          }}
        >
          {para}
        </p>
      ))}

      <div
        className="venom-mono"
        style={{
          marginTop: 36,
          fontSize: 11,
          letterSpacing: 5,
          opacity: 0.5,
        }}
      >
        DIRECTIVES
      </div>
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {about.philosophies.map((p) => (
          <span
            key={p}
            className="venom-mono"
            style={{
              fontSize: 11,
              letterSpacing: 3,
              padding: "8px 16px",
              border: "1px solid var(--color-border)",
              color: "#fff",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
