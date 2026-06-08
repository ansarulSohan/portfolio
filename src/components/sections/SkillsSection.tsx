import { portfolio } from "../../data/portfolio";

export function SkillsSection() {
  const { skills } = portfolio;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "clamp(24px, 4vw, 56px)",
        maxWidth: 900,
      }}
    >
      {skills.map((cat) => (
        <div key={cat.category}>
          <div
            className="venom-mono"
            style={{
              fontSize: 12,
              letterSpacing: 5,
              color: "#fff",
              opacity: 0.85,
              marginBottom: 18,
              paddingBottom: 8,
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            {cat.category}
          </div>
          {cat.items.map((item) => (
            <div key={item.name} style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                <span>{item.name}</span>
                <span style={{ opacity: 0.5 }}>{item.level}</span>
              </div>
              <div
                style={{
                  height: 4,
                  background: "rgba(255,255,255,0.1)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={
                    {
                      height: "100%",
                      width: "100%",
                      transformOrigin: "left",
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0.6), #fff)",
                      boxShadow: "0 0 12px rgba(255,255,255,0.5)",
                      "--level": item.level / 100,
                      animation:
                        "bar-fill 900ms cubic-bezier(0.23,1,0.32,1) forwards",
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
