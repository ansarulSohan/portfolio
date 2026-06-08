import { portfolio } from "../../data/portfolio";

function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="venom-mono"
      style={{
        border: "1px dashed var(--color-border)",
        padding: "48px 32px",
        textAlign: "center",
        fontSize: 12,
        letterSpacing: 5,
        opacity: 0.45,
        maxWidth: 520,
      }}
    >
      {label} <span className="blink">_</span>
    </div>
  );
}

export function ProjectsSection() {
  const { projects } = portfolio;

  if (projects.length === 0) {
    return <EmptyState label="TRANSMISSION PENDING" />;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 20,
      }}
    >
      {projects.map((p) => (
        <article
          key={p.title}
          style={{
            border: "1px solid var(--color-border)",
            background: "rgba(255,255,255,0.02)",
            padding: 22,
          }}
        >
          <h3
            className="venom-mono"
            style={{
              margin: "0 0 10px",
              fontSize: 16,
              letterSpacing: 3,
              color: "#fff",
            }}
          >
            {p.title}
          </h3>
          <p
            style={{
              margin: "0 0 16px",
              fontSize: 14,
              lineHeight: 1.6,
              opacity: 0.8,
            }}
          >
            {p.description}
          </p>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}
          >
            {p.tech.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  border: "1px solid var(--color-border)",
                  opacity: 0.7,
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            {p.github && (
              <a
                href={p.github}
                target="_blank"
                rel="noreferrer"
                className="venom-mono"
                style={projectLink}
              >
                CODE
              </a>
            )}
            {p.live && (
              <a
                href={p.live}
                target="_blank"
                rel="noreferrer"
                className="venom-mono"
                style={projectLink}
              >
                LIVE
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

const projectLink: React.CSSProperties = {
  color: "#fff",
  textDecoration: "none",
  fontSize: 11,
  letterSpacing: 3,
  borderBottom: "1px solid rgba(255,255,255,0.3)",
  paddingBottom: 2,
};
