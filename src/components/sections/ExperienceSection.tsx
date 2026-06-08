import { portfolio } from "../../data/portfolio";

export function ExperienceSection() {
  const { experience, education } = portfolio;

  if (experience.length === 0 && education.length === 0) {
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
        SERVICE RECORD CLASSIFIED <span className="blink">_</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {experience.map((job) => (
        <div
          key={`${job.company}-${job.role}`}
          style={{
            borderLeft: "1px solid var(--color-border)",
            paddingLeft: 24,
            marginLeft: 6,
            paddingBottom: 28,
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: -4,
              top: 4,
              width: 7,
              height: 7,
              background: "#fff",
              boxShadow: "0 0 12px rgba(255,255,255,0.7)",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h3
              className="venom-mono"
              style={{
                margin: 0,
                fontSize: 15,
                letterSpacing: 3,
                color: "#fff",
              }}
            >
              {job.role}
            </h3>
            <span style={{ fontSize: 11, letterSpacing: 2, opacity: 0.5 }}>
              {job.period}
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: 0.6,
              margin: "4px 0 12px",
            }}
          >
            {job.company}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {job.highlights.map((h, i) => (
              <li
                key={i}
                style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.82 }}
              >
                {h}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {education.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div
            className="venom-mono"
            style={{ fontSize: 11, letterSpacing: 5, opacity: 0.5, marginBottom: 16 }}
          >
            EDUCATION
          </div>
          {education.map((ed) => (
            <div key={ed.degree} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, color: "#fff" }}>{ed.degree}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {ed.institution} · {ed.year}
              </div>
              {ed.notes && (
                <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
                  {ed.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
