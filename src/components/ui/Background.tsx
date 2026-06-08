import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number; // depth 0..1 → size/speed/opacity
  vy: number;
}

const PARTICLE_COUNT = 70;

/**
 * Futuristic CSS + canvas backdrop: a drifting perspective grid, a soft particle
 * field, scanlines, and a vignette. No Three.js. Sits behind all UI.
 */
export function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    const particles: Particle[] = [];

    const seed = () => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const z = Math.random();
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vy: 4 + z * 12, // px/sec, deeper = faster
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) seed();
    };
    resize();

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (!reduce) {
          p.y -= p.vy * dt;
          if (p.y < -2) {
            p.y = height + 2;
            p.x = Math.random() * width;
          }
        }
        const size = 0.6 + p.z * 1.8;
        ctx.globalAlpha = 0.12 + p.z * 0.4;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(p.x, p.y, size, size);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "var(--color-bg)",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Drifting perspective grid */}
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "80px 80px, 80px 80px",
          transform: "perspective(420px) rotateX(58deg)",
          transformOrigin: "center 70%",
          animation: "grid-drift 6s linear infinite",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 60%, #000 35%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 60%, #000 35%, transparent 80%)",
        }}
      />
      {/* Particle field */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, opacity: 0.9 }}
      />
      {/* Scanlines */}
      <div className="scanlines" style={{ position: "absolute", inset: 0 }} />
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
