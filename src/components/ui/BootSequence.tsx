import { useEffect, useRef, useState } from "react";
import { scramble } from "../../utils/scramble";
import { Z } from "../../styles/theme";

// Big text that "decrypts" on the boot screen. Edit this to whatever you like —
// keep it short so it stays on one line. (It is NOT tied to your name.)
const HEADLINE = "ACCESS GRANTED";

const DECRYPT_MS = 1400;
const GRANTED_AT = 2000;
const WELCOME_AT = 2800;
const DONE_AT = 3000;
const FADE_MS = 380;

type Phase = "decrypt" | "granted" | "welcome";

const BOOT_LINES = [
  "INITIALIZING NEURAL LINK",
  "MOUNTING CORE MODULES",
  "CALIBRATING INTERFACE",
  "SYNCING SYSTEM CORE",
];

interface BootSequenceProps {
  onComplete: () => void;
}

/**
 * Glitch / decrypt landing reveal. Scrambled glyphs resolve into the name,
 * then ACCESS GRANTED → WELCOME, then fades out. ~2.5s, skippable by click or
 * any keypress.
 */
export function BootSequence({ onComplete }: BootSequenceProps) {
  const headline = HEADLINE.toUpperCase();
  const [text, setText] = useState(() => scramble(headline, 0));
  const [phase, setPhase] = useState<Phase>("decrypt");
  const [exiting, setExiting] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const timers: number[] = [];

    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      setExiting(true);
      window.setTimeout(onComplete, FADE_MS);
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < DECRYPT_MS) {
        setText(scramble(headline, elapsed / DECRYPT_MS));
        raf = requestAnimationFrame(tick);
      } else {
        setText(headline);
      }
    };
    raf = requestAnimationFrame(tick);

    timers.push(window.setTimeout(() => setPhase("granted"), GRANTED_AT));
    timers.push(window.setTimeout(() => setPhase("welcome"), WELCOME_AT));
    timers.push(window.setTimeout(finish, DONE_AT));

    const skip = () => finish();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [headline, onComplete]);

  return (
    <div
      className="flicker"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: Z.splash,
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.05), rgba(0,0,0,0.97) 62%)",
        opacity: exiting ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
      }}
    >
      <div style={{ textAlign: "center", width: "min(90vw, 720px)" }}>
        <div
          className="venom-mono"
          style={{ fontSize: 11, opacity: 0.55, letterSpacing: 8 }}
        >
          SYSTEM · v0.1
        </div>

        <div
          className="venom-mono"
          style={{
            marginTop: 28,
            fontSize: "clamp(22px, 6vw, 56px)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "clamp(2px, 1vw, 6px)",
            overflowWrap: "anywhere",
            textShadow:
              "0 0 24px rgba(255,255,255,0.45), 0 0 60px rgba(255,255,255,0.18)",
          }}
        >
          {text}
        </div>

        <div
          style={{
            marginTop: 22,
            minHeight: 90,
            fontSize: 12,
            letterSpacing: 4,
            opacity: 0.7,
          }}
        >
          {phase === "decrypt" && (
            <div className="venom-mono">
              &lt;&lt;&lt; DECRYPTING <span className="blink">_</span>
            </div>
          )}
          {phase === "granted" && (
            <div
              className="venom-mono"
              style={{ animation: "fade-in 200ms ease-out" }}
            >
              &gt;_ CONNECTION ESTABLISHED
              <div style={{ marginTop: 14, opacity: 0.6, fontSize: 10 }}>
                {BOOT_LINES.map((l) => (
                  <div key={l}>
                    {l} <span style={{ opacity: 0.8 }}>· OK</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {phase === "welcome" && (
            <div
              className="venom-mono"
              style={{
                animation: "fade-in 260ms ease-out",
                fontSize: 16,
                letterSpacing: 10,
                color: "#fff",
              }}
            >
              WELCOME
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 26,
            fontSize: 9,
            letterSpacing: 4,
            opacity: 0.35,
            textTransform: "uppercase",
          }}
        >
          Press any key to skip
        </div>
      </div>
    </div>
  );
}
