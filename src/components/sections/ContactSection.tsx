import { portfolio } from "../../data/portfolio";

interface Channel {
  label: string;
  value: string;
  href: string;
}

export function ContactSection() {
  const { meta } = portfolio;

  const channels: Channel[] = [
    { label: "EMAIL", value: meta.email, href: `mailto:${meta.email}` },
    {
      label: "LINKEDIN",
      value: meta.linkedin.replace(/^https?:\/\/(www\.)?/, ""),
      href: meta.linkedin,
    },
    {
      label: "GITHUB",
      value: meta.github.replace(/^https?:\/\/(www\.)?/, ""),
      href: meta.github,
    },
  ];
  if (meta.resumeUrl) {
    channels.push({ label: "RESUME", value: "DOWNLOAD", href: meta.resumeUrl });
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <p
        style={{
          fontSize: "clamp(15px, 1.8vw, 19px)",
          lineHeight: 1.7,
          opacity: 0.8,
          margin: "0 0 32px",
        }}
      >
        Open a channel. Transmissions are received from{" "}
        <span style={{ color: "#fff" }}>{meta.location}</span> and answered
        promptly.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target={c.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "16px 18px",
              border: "1px solid var(--color-border)",
              borderLeftWidth: 2,
              color: "var(--color-text)",
              textDecoration: "none",
              transition: "all 0.2s ease",
              background: "rgba(255,255,255,0.02)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.9)";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.transform = "translateX(8px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <span
              className="venom-mono"
              style={{
                fontSize: 11,
                letterSpacing: 3,
                opacity: 0.55,
                width: 90,
                flexShrink: 0,
              }}
            >
              {c.label}
            </span>
            <span style={{ fontSize: 14, color: "#fff", wordBreak: "break-all" }}>
              {c.value}
            </span>
            <span style={{ marginLeft: "auto", opacity: 0.5 }}>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
