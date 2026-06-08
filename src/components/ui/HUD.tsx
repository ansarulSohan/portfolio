import { Z } from "../../styles/theme";
import { portfolio } from "../../data/portfolio";

const cornerSize = 26;
const cornerThick = 1;
const cornerColor = "rgba(255,255,255,0.55)";

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = {
    position: "fixed" as const,
    width: cornerSize,
    height: cornerSize,
    pointerEvents: "none" as const,
    zIndex: Z.hud,
  };
  const off = 22;
  const styles: Record<typeof pos, React.CSSProperties> = {
    tl: {
      ...base,
      top: off,
      left: off,
      borderTop: `${cornerThick}px solid ${cornerColor}`,
      borderLeft: `${cornerThick}px solid ${cornerColor}`,
    },
    tr: {
      ...base,
      top: off,
      right: off,
      borderTop: `${cornerThick}px solid ${cornerColor}`,
      borderRight: `${cornerThick}px solid ${cornerColor}`,
    },
    bl: {
      ...base,
      bottom: off,
      left: off,
      borderBottom: `${cornerThick}px solid ${cornerColor}`,
      borderLeft: `${cornerThick}px solid ${cornerColor}`,
    },
    br: {
      ...base,
      bottom: off,
      right: off,
      borderBottom: `${cornerThick}px solid ${cornerColor}`,
      borderRight: `${cornerThick}px solid ${cornerColor}`,
    },
  };
  return <div style={styles[pos]} />;
}

export function HUD() {
  return (
    <>
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />
      <div
        className="hide-sm"
        style={{
          position: "fixed",
          top: 32,
          left: 56,
          pointerEvents: "none",
          zIndex: Z.hud,
        }}
      >
        <div
          className="venom-mono"
          style={{ fontSize: 11, color: "#fff", opacity: 0.85 }}
        >
          {portfolio.meta.name}
        </div>
        <div
          style={{
            fontSize: 10,
            opacity: 0.5,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          {portfolio.meta.title}
        </div>
      </div>
      <div
        className="hide-sm"
        style={{
          position: "fixed",
          top: 32,
          right: 56,
          pointerEvents: "none",
          zIndex: Z.hud,
          textAlign: "right",
        }}
      >
        <div
          className="venom-mono"
          style={{ fontSize: 10, color: "#fff", opacity: 0.7 }}
        >
          SYS/01
        </div>
        <div style={{ fontSize: 10, opacity: 0.4, letterSpacing: 3, marginTop: 4 }}>
          SYS · ONLINE
        </div>
      </div>
      <div
        className="hide-sm"
        style={{
          position: "fixed",
          bottom: 32,
          left: 56,
          pointerEvents: "none",
          zIndex: Z.hud,
          fontSize: 10,
          letterSpacing: 3,
          opacity: 0.45,
          textTransform: "uppercase",
        }}
      >
        ↑ ↓ Select · Enter Engage · Esc Back
      </div>
      <div
        className="hide-sm"
        style={{
          position: "fixed",
          bottom: 32,
          right: 56,
          pointerEvents: "none",
          zIndex: Z.hud,
          fontSize: 10,
          letterSpacing: 3,
          opacity: 0.45,
          textTransform: "uppercase",
        }}
      >
        {portfolio.meta.location}
      </div>
    </>
  );
}
