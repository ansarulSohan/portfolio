# CLAUDE.md — Intergalactic Spiderweb Portfolio

## Project Overview

A 3D intergalactic spiderweb portfolio for **G.M. Ansarul Kabir** (ansarulSohan). The homepage is a navigable 3D spiderweb floating in deep space. A spider character traverses between web nodes, each representing a portfolio section (About, Skills, Projects, Experience). The Contact section is a swirling **wormhole** portal. The entire experience is immersive, cinematic, and interactive.

**Live profiles:**

- LinkedIn: https://www.linkedin.com/in/g-m-ansarul-kabir/
- GitHub: https://github.com/ansarulSohan

---

## Tech Stack

| Layer           | Tool                          | Version |
| --------------- | ----------------------------- | ------- |
| Framework       | React                         | 18+     |
| Build           | Vite                          | 5+      |
| 3D Engine       | Three.js                      | r164+   |
| React bindings  | @react-three/fiber            | 8+      |
| 3D helpers      | @react-three/drei             | 9+      |
| Post-processing | @react-three/postprocessing   | 2+      |
| Animation       | framer-motion                 | 11+     |
| Routing         | react-router-dom              | 6+      |
| Styling         | CSS Modules or Tailwind CSS 3 | —       |
| Language        | TypeScript                    | 5+      |
| Linting         | ESLint + Prettier             | —       |
| Package manager | pnpm                          | —       |

---

## Project Structure

```
ansarul-portfolio/
├── public/
│   ├── fonts/                    # Orbitron, Rajdhani (self-hosted woff2)
│   ├── textures/                 # Star maps, nebula sprites, noise textures
│   ├── models/                   # Spider GLB model (if upgrading from procedural)
│   └── favicon.svg
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Router + layout shell
│   ├── data/
│   │   └── portfolio.ts          # All personal data in one file (see below)
│   ├── components/
│   │   ├── canvas/               # All Three.js / R3F components
│   │   │   ├── Scene.tsx         # Main <Canvas> wrapper + camera rig
│   │   │   ├── Starfield.tsx     # Instanced star particles
│   │   │   ├── Nebula.tsx        # Volumetric nebula particles
│   │   │   ├── SpiderWeb.tsx     # Web graph: nodes, threads, glow
│   │   │   ├── Spider.tsx        # Animated spider character
│   │   │   ├── WebNode.tsx       # Individual clickable node
│   │   │   ├── SilkTrail.tsx     # Trailing silk thread behind spider
│   │   │   ├── Wormhole.tsx      # Shader-based wormhole portal
│   │   │   └── PostFX.tsx        # Bloom, chromatic aberration, vignette
│   │   ├── ui/                   # 2D overlay components
│   │   │   ├── HUD.tsx           # Corner brackets, name, coordinates
│   │   │   ├── DetailPanel.tsx   # Slide-in panel for section content
│   │   │   ├── NavLabels.tsx     # Projected 3D→2D labels on nodes
│   │   │   ├── Splash.tsx        # Intro screen + enter button
│   │   │   ├── Cursor.tsx        # Custom cursor
│   │   │   └── Instructions.tsx  # Fade-in/out instruction toast
│   │   └── sections/             # Content renderers per section
│   │       ├── AboutSection.tsx
│   │       ├── SkillsSection.tsx
│   │       ├── ProjectsSection.tsx
│   │       ├── ExperienceSection.tsx
│   │       └── ContactSection.tsx
│   ├── hooks/
│   │   ├── useSpiderTraversal.ts # Spider pathfinding + animation state
│   │   ├── useCameraRig.ts       # Orbit, zoom, auto-rotate logic
│   │   ├── useWebGraph.ts        # Graph data structure for nodes/edges
│   │   └── useProjectedPosition.ts # 3D→screen coordinate projection
│   ├── shaders/
│   │   ├── wormhole.vert         # Wormhole vertex shader
│   │   ├── wormhole.frag         # Wormhole fragment shader (spiral distortion)
│   │   ├── silk.vert             # Silk trail vertex shader
│   │   └── silk.frag             # Silk trail fragment shader (glow + fade)
│   ├── utils/
│   │   ├── graph.ts              # Graph traversal (BFS/Dijkstra for spider path)
│   │   ├── easing.ts             # Cubic/elastic easing functions
│   │   └── math.ts               # Vector helpers, lerp, clamp
│   ├── styles/
│   │   ├── global.css            # Reset, fonts, CSS variables
│   │   └── theme.ts              # Color tokens, spacing, z-index map
│   └── types/
│       └── index.ts              # Shared TypeScript interfaces
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .eslintrc.cjs
├── .prettierrc
├── CLAUDE.md                     # ← This file
└── README.md
```

---

## Portfolio Data Schema

All personal content lives in `src/data/portfolio.ts`. This is the **single source of truth** — no hardcoded strings anywhere else.

```typescript
// src/data/portfolio.ts

export interface PortfolioData {
  meta: {
    name: string;
    title: string;
    tagline: string;
    location: string;
    email: string;
    linkedin: string;
    github: string;
    resumeUrl?: string;
  };
  about: {
    bio: string[]; // paragraphs
    philosophies: string[]; // short value statements
  };
  skills: {
    category: string;
    items: { name: string; level: number }[]; // level 0–100
  }[];
  projects: {
    title: string;
    description: string;
    tech: string[];
    github?: string;
    live?: string;
    image?: string; // path to screenshot in public/
  }[];
  experience: {
    role: string;
    company: string;
    period: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    notes?: string;
  }[];
}
```

---

## Design System

### Colors (CSS Custom Properties)

```css
:root {
  --color-bg: #000008;
  --color-primary: #00ffb4; /* Cyber-green — web threads, text, spider eyes */
  --color-accent: #ff64ff; /* Neon-magenta — highlights, contact, hover */
  --color-secondary: #00b4ff; /* Nebula-blue — subtle accents */
  --color-text: #e0e0e0;
  --color-text-dim: rgba(224, 224, 224, 0.5);
  --color-panel-bg: rgba(0, 5, 15, 0.92);
  --color-border: rgba(0, 255, 180, 0.2);
  --color-border-hover: rgba(255, 100, 255, 0.8);
}
```

### Typography

| Role               | Font     | Weight   | Usage                            |
| ------------------ | -------- | -------- | -------------------------------- |
| Display / Headings | Orbitron | 700, 900 | Section titles, HUD name, splash |
| Labels / UI        | Orbitron | 400, 500 | Nav labels, buttons, coords      |
| Body / Content     | Rajdhani | 300–600  | Panel text, descriptions         |

- All text uses `letter-spacing: 2–5px` and `text-transform: uppercase` for UI elements.
- Body text is sentence-case, `line-height: 1.7`.

### Z-Index Map

```typescript
export const Z = {
  canvas: 1,
  hud: 100,
  panel: 200,
  instructions: 300,
  wormhole: 500,
  cursor: 10000,
  splash: 9999,
} as const;
```

---

## 3D Scene Architecture

### Web Graph

The spiderweb is a **graph data structure**:

- **Primary nodes** (5): About, Skills, Projects, Experience, Contact — positioned manually in 3D space around a center HOME node.
- **Secondary nodes** (~10–15): Decorative anchor points that add web density. No click interaction.
- **Edges**: Threads connecting all nodes. Primary→Center (radial spokes), Primary→Primary (ring), Primary→Secondary, Secondary→Secondary (if distance < threshold).
- **Thread rendering**: `THREE.Line` with additive blending. Two passes — dim base + brighter glow overlay. Pulse opacity with `sin(time)`.

### Spider Character

Built procedurally with Three.js geometries inside a `THREE.Group`:

| Part      | Geometry               | Notes                            |
| --------- | ---------------------- | -------------------------------- |
| Body      | Scaled SphereGeometry  | scale(1, 0.7, 1.3)               |
| Head      | SphereGeometry         | Smaller, offset +Z               |
| Eyes (×2) | SphereGeometry         | Emissive `--color-primary`       |
| Legs (×8) | CylinderGeometry pairs | Upper + lower segments, animated |

**Movement**: On node click → BFS shortest path through graph → spider follows path node-to-node with cubic easing + sine arc on Y axis. Legs animate faster during traversal.

**Idle**: Gentle Y bob (`sin(t * 1.5) * 0.002`), slow yaw oscillation.

### Wormhole (Contact)

Custom shader material on a plane or torus:

- **Vertex**: Standard passthrough.
- **Fragment**: Concentric rings with time-based spiral distortion, additive color cycling (hue shift), central radial glow, particle simulation for "suction" effect.
- Triggered when spider reaches the Contact node.
- Overlays the full screen with the 2D wormhole canvas + contact links.

### Post-Processing Stack

Using `@react-three/postprocessing`:

1. **Bloom** — `intensity: 1.5`, `luminanceThreshold: 0.2` — makes emissive elements glow.
2. **ChromaticAberration** — subtle, `offset: [0.001, 0.001]`.
3. **Vignette** — `darkness: 0.7` — frames the scene.

---

## Interaction Model

| Input              | Action                                         |
| ------------------ | ---------------------------------------------- |
| Click node         | Spider traverses to node → section panel opens |
| Drag (mouse/touch) | Orbit camera (theta/phi)                       |
| Scroll / Pinch     | Zoom camera in/out (clamped 10–50 units)       |
| Hover node         | Cursor expands, node pulses brighter           |
| Click panel ✕      | Close detail panel                             |
| Click wormhole ✕   | Close wormhole overlay                         |
| Idle (no input 3s) | Slow auto-rotate camera                        |

Camera uses **spherical coordinates** (theta, phi, distance) with lerp smoothing toward target values. Never use OrbitControls — manual implementation for finer control.

---

## Component Contracts

### `<Scene />`

The root R3F `<Canvas>` component. Owns:

- Camera setup (PerspectiveCamera, FOV 60)
- Lighting (ambient + 2 point lights)
- All 3D children
- PostFX

```tsx
<Canvas camera={{ fov: 60, near: 0.1, far: 2000 }}>
  <Starfield count={5000} />
  <Nebula count={800} />
  <SpiderWeb graph={webGraph} onNodeClick={handleNodeClick} />
  <Spider targetNode={targetNode} graph={webGraph} />
  <SilkTrail spiderPosition={spiderPos} />
  {showWormhole && <Wormhole />}
  <PostFX />
</Canvas>
```

### `<Spider />` Props

```typescript
interface SpiderProps {
  graph: WebGraph;
  targetNode: string | null; // node ID to traverse to
  onArrival: (nodeId: string) => void; // callback when spider reaches target
}
```

### `<WebNode />` Props

```typescript
interface WebNodeProps {
  id: string;
  position: [number, number, number];
  label: string;
  type: "primary" | "secondary" | "center";
  isContact?: boolean;
  onClick: (id: string) => void;
}
```

### `<DetailPanel />` Props

```typescript
interface DetailPanelProps {
  section: keyof PortfolioData | null;
  isOpen: boolean;
  onClose: () => void;
}
```

---

## Animation Timing

| Animation                   | Duration   | Easing                           | Notes                         |
| --------------------------- | ---------- | -------------------------------- | ----------------------------- |
| Spider traversal (per edge) | 800ms      | cubicInOut                       | Stacks for multi-edge paths   |
| Spider arc height           | —          | `sin(progress * PI) * 2`         | Y offset during traversal     |
| Panel slide-in              | 600ms      | `cubic-bezier(0.23, 1, 0.32, 1)` | CSS transition on `right`     |
| Node pulse                  | Continuous | `sin(t * 2 + i)`                 | Per-node phase offset         |
| Thread shimmer              | Continuous | `sin(t * 0.5)`                   | Opacity 0.12 ± 0.03           |
| Star twinkle                | Continuous | Random per-star                  | Opacity variation             |
| Wormhole spiral             | Continuous | Linear + sin                     | Ring expansion + hue rotation |
| Splash fade-out             | 1000ms     | linear opacity                   | On "Enter the Web" click      |
| Idle auto-rotate            | Continuous | `theta += 0.001/frame`           | Only when no input            |

---

## Coding Conventions

### General

- **TypeScript strict mode** — `"strict": true` in tsconfig.
- **Functional components only** — no class components.
- **Named exports** — no default exports (except pages if using routing).
- **No `any`** — use proper types or `unknown` with narrowing.
- **Barrel exports** — each directory has an `index.ts` re-exporting its public API.

### React / R3F

- Use `useFrame` for per-frame animation logic inside R3F components.
- Use `useRef<THREE.Mesh>(null!)` pattern for Three.js refs.
- Dispose geometries and materials in `useEffect` cleanup.
- Memoize heavy computations with `useMemo`.
- Keep R3F components lean — extract logic into hooks.

### Shaders

- GLSL files in `src/shaders/` with `.vert` / `.frag` extensions.
- Import via Vite's `?raw` suffix: `import vertexShader from './wormhole.vert?raw'`.
- Use `THREE.ShaderMaterial` with uniforms for `time`, `resolution`, `mouse`.

### Styling

- CSS Modules for component-scoped styles (`Component.module.css`).
- Global theme in `styles/global.css` with CSS custom properties.
- No inline styles except for dynamic values (e.g., `style={{ '--progress': value }}`).

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (prefixed with `use`)
- Utils: `camelCase.ts`
- Shaders: `camelCase.vert` / `camelCase.frag`
- Types: `camelCase.ts`
- Styles: `PascalCase.module.css`

---

## Performance Budget

| Metric                 | Target                                    |
| ---------------------- | ----------------------------------------- |
| First Contentful Paint | < 1.5s                                    |
| Time to Interactive    | < 3s                                      |
| JS bundle (gzipped)    | < 350KB                                   |
| Three.js draw calls    | < 50 per frame                            |
| Particle count         | < 6000 total                              |
| Target FPS             | 60fps on mid-range GPU                    |
| Mobile FPS             | 30fps+ (reduce particles, disable postfx) |

### Performance strategies

- Use `THREE.InstancedMesh` for stars and nebula particles.
- Use `THREE.BufferGeometry` everywhere — no `Geometry`.
- Reduce post-processing on mobile (detect via `navigator.hardwareConcurrency` or `renderer.capabilities`).
- Lazy-load the wormhole shader — only compile when Contact is clicked.
- Use `React.lazy` + `Suspense` for section content components.

---

## Build & Dev Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start Vite dev server (localhost:5173)
pnpm build                # Production build → dist/
pnpm preview              # Preview production build
pnpm lint                 # ESLint check
pnpm lint:fix             # ESLint auto-fix
pnpm typecheck            # tsc --noEmit
```

---

## Deployment

Target: **Vercel** or **Netlify** (static SPA).

- `vite.config.ts` should set `base: '/'`.
- Add `_redirects` or `vercel.json` for SPA fallback to `index.html`.
- Enable gzip/brotli compression.
- Set `Cache-Control: public, max-age=31536000, immutable` for hashed assets.

---

## Implementation Order

Build in this sequence for best incremental progress:

1. **Scaffold** — Vite + React + TS + R3F + basic Canvas rendering
2. **Starfield + Nebula** — Instanced particles, set the mood
3. **Web Graph** — Data structure + thread rendering + node spheres
4. **Camera Rig** — Orbit, zoom, auto-rotate with smooth lerping
5. **Spider** — Procedural model + idle animation
6. **Spider Traversal** — Click node → BFS path → animated movement
7. **HUD Overlay** — Corner brackets, name, coordinates
8. **Detail Panel** — Slide-in with section content
9. **Nav Labels** — 3D→2D projected labels on nodes
10. **Wormhole** — Custom shader + contact overlay
11. **Post-Processing** — Bloom, chromatic aberration, vignette
12. **Splash Screen** — Intro + enter transition
13. **Silk Trail** — Trailing thread behind spider
14. **Mobile Optimization** — Touch controls, perf scaling
15. **Polish** — Timing tweaks, easter eggs, sound (optional)

---

## Notes for Claude Code

- When generating components, always import types from `src/types/index.ts`.
- All hardcoded portfolio content goes in `src/data/portfolio.ts` — components read from there.
- Prefer `@react-three/drei` helpers (e.g., `<Html>`, `<Float>`, `<Trail>`) when they fit, but write custom solutions when more control is needed (spider, wormhole).
- Test in Chrome and Safari — WebGL differences matter.
- The spider should feel alive — err on the side of more animation, not less.
- The wormhole is the showpiece — invest shader quality there.
