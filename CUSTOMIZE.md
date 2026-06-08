# Customization Guide

This is a single‑page, "futuristic game homescreen" portfolio:

1. **Boot** – a glitch/decrypt animation reveals your name → `ACCESS GRANTED` → `WELCOME`.
2. **Menu** – a main‑menu list of options (About, Skills, Projects, Experience, Contact).
3. **Section** – selecting an option opens a full‑screen page with your content; **BACK** / `Esc` returns to the menu.

Everything you need to personalize lives in a few files. **You almost never need to touch the animation code** — start with `src/data/portfolio.ts`.

---

## 0. Running the project

```bash
pnpm install      # first time only
pnpm dev          # start dev server → http://localhost:5173  (auto-reloads on save)
pnpm build        # production build → dist/
pnpm preview      # preview the production build locally
pnpm lint         # check code style
pnpm typecheck    # check types
```

> Uses **pnpm**. If you don't have it: `npm install -g pnpm`.

While `pnpm dev` is running, just save any file and the browser updates instantly.

---

## 1. Your content — `src/data/portfolio.ts` ⭐ START HERE

This one file is the **single source of truth** for all text. Edit the values; the
whole site updates. The shape is type‑checked, so your editor will warn you if a
field is missing or the wrong type.

```ts
export const portfolio = {
  meta: {
    name:     "G.M. Ansarul Kabir",      // big name on boot + menu
    title:    "Software Engineer",        // shown under the name
    tagline:  "Portfolio",                // shown next to the title on the menu
    location: "Bangladesh",               // Contact page + (desktop) HUD corner
    email:    "you@example.com",          // Contact page
    linkedin: "https://www.linkedin.com/in/...",
    github:   "https://github.com/...",
    resumeUrl: "https://.../resume.pdf",  // OPTIONAL — adds a RESUME link to Contact
  },

  about: {
    bio: [
      "First paragraph about you.",       // each string = one paragraph
      "Second paragraph.",
    ],
    philosophies: ["Craft > hype", "Ship & iterate"],   // shown as chips
  },

  skills: [
    {
      category: "Frontend",               // one column
      items: [
        { name: "React", level: 85 },     // level 0–100 → bar width
        { name: "TypeScript", level: 80 },
      ],
    },
    // add more categories…
  ],

  projects: [
    {
      title: "My Project",
      description: "What it does.",
      tech: ["React", "Three.js"],        // tags
      github: "https://github.com/...",   // optional
      live: "https://...",                // optional
    },
    // …
  ],

  experience: [
    {
      role: "Software Engineer",
      company: "Company Inc.",
      period: "2023 — Present",
      highlights: ["Did X.", "Built Y."], // bullet list
    },
  ],

  education: [
    {
      degree: "B.Sc. in CSE",
      institution: "Some University",
      year: "2024",
      notes: "Optional note.",            // optional
    },
  ],
};
```

**Empty sections are handled gracefully:** if `projects` or `experience` is `[]`,
the page shows a styled "TRANSMISSION PENDING / SERVICE RECORD CLASSIFIED"
placeholder instead of breaking. Just fill the arrays when you're ready.

---

## 2. Menu options (add / remove / rename / reorder)

The menu list is defined in **`src/types/index.ts`** as `MENU_ITEMS`:

```ts
export const MENU_ITEMS: MenuItem[] = [
  { id: "about",      label: "ABOUT",      index: "01", hint: "Origin & directives" },
  { id: "skills",     label: "SKILLS",     index: "02", hint: "Loadout & systems" },
  { id: "projects",   label: "PROJECTS",   index: "03", hint: "Mission archive" },
  { id: "experience", label: "EXPERIENCE", index: "04", hint: "Service record" },
  { id: "contact",    label: "CONTACT",    index: "05", hint: "Open comms" },
];
```

- **Rename / re‑hint:** change `label`, `index`, or `hint`. (`hint` is the small
  text shown next to the active item; it's hidden on phones.)
- **Reorder:** move the lines around (and renumber `index` if you care).
- **Remove:** delete a line. (You can leave its unused section component in place.)

### Adding a brand‑new section

1. Add an entry to `MENU_ITEMS` with a new `id`, e.g. `"blog"`. Also add the id to
   the `SectionId` union right above it:
   ```ts
   export type SectionId = "about" | "skills" | "projects" | "experience" | "contact" | "blog";
   ```
2. Create the content component `src/components/sections/BlogSection.tsx` (copy an
   existing one as a template) and export it from `src/components/sections/index.ts`.
3. Register it in **`src/components/ui/SectionView.tsx`** in the `CONTENT` map:
   ```ts
   const CONTENT = { about, skills, projects, experience, contact, blog: BlogSection };
   ```

That's it — the menu item now opens your new page.

---

## 3. The boot animation — `src/components/ui/BootSequence.tsx`

**Timings** are constants at the top of the file (milliseconds from start):

```ts
const DECRYPT_MS = 1400;   // how long the name scrambles/decrypts
const GRANTED_AT = 2000;   // when "ACCESS GRANTED" appears
const WELCOME_AT = 2800;   // when "WELCOME" appears
const DONE_AT    = 3000;   // when it starts fading to the menu
const FADE_MS    = 380;    // fade-out duration
```

Make the boot longer/shorter by changing these (keep them in increasing order).

- **System‑check lines** ("INITIALIZING NEURAL LINK…"): edit the `BOOT_LINES` array.
- **Labels** like `SYMBIOTE PROTOCOL · v0.1`, `DECRYPTING`, `ACCESS GRANTED`,
  `WELCOME`, `Press any key to skip`: search for that text in the file and edit it.
- **Skip:** any key press or click skips the boot (built in).

### Replaying the boot
The boot plays **once per browser session**. It's remembered with a
`sessionStorage` flag (key `"symbiote.booted"`, set in
`src/components/ui/HomeScreen.tsx`). To see it again:
- open a new browser tab, **or**
- run `sessionStorage.clear()` in the browser DevTools console, **or**
- to make it play **every** load, delete the `sessionStorage` read/write in
  `HomeScreen.tsx` (the `BOOT_KEY` lines).

---

## 4. Colors & theme — `src/styles/global.css`

The palette lives in CSS variables at the top:

```css
:root {
  --color-bg:        #000000;  /* page background */
  --color-primary:   #f5f5f5;
  --color-accent:    #ffffff;
  --color-text:      #f0f0f0;  /* body text */
  --color-text-dim:  rgba(240,240,240,0.45);
  --color-border:    rgba(245,245,245,0.25);   /* hairlines / card borders */
  --color-border-hover: rgba(255,255,255,0.9);
}
```

Change these to re‑skin the site (e.g. set `--color-bg: #050014` and tweak borders
for a deep‑purple look).

> **Heads‑up:** the theme is currently black‑and‑white. Many highlight bits are
> hard‑coded white (`#fff` / `rgba(255,255,255,…)`) **inline** inside the
> components (titles, glow shadows, menu highlight). If you want a strong accent
> color (e.g. neon green), do a project‑wide find‑and‑replace of `255,255,255` /
> `#fff` in `src/components/**` with your color, or ask for an accent‑color pass.

This file also holds all the **animations** (`grid-drift`, `scan-sweep`, `flicker`,
`blink`, `section-enter`, `bar-fill`) and the `.hide-sm` rule that hides corner
chrome on screens ≤768px.

---

## 5. Fonts

The design calls for **Orbitron** (headings/UI) and **Rajdhani** (body), but they
are **not currently loaded** — so right now it falls back to a monospace/system
font. To enable the intended look, add this inside `<head>` in **`index.html`**:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600&display=swap"
  rel="stylesheet"
/>
```

The uppercase, wide‑letter‑spaced UI font is the `.venom-mono` class in
`global.css` (it maps to Orbitron). Change the `font-family` there to use a
different display font.

---

## 6. Background — `src/components/ui/Background.tsx`

The animated backdrop (drifting grid + particles + scanlines + vignette). Knobs:

- `const PARTICLE_COUNT = 70;` — number of drifting dots (lower = calmer/faster).
- The **grid**: the `linear-gradient` + `backgroundSize: "80px 80px"` block — change
  `80px` for grid density, or the `rgba(255,255,255,0.05)` for line brightness.
- The **vignette** and **scanlines**: the last two `<div>`s in the file.
- Respects "reduce motion" OS settings automatically.

To use a plain background instead, you can replace the whole returned JSX with a
single `<div style={{position:'fixed',inset:0,background:'var(--color-bg)'}} />`.

---

## 7. Page corners (HUD) — `src/components/ui/HUD.tsx`

The thin corner brackets and the small corner labels (name, `SYMBIOTE/01`,
`SYS · ONLINE`, key hints, location). Notes:

- The HUD only shows on the **menu** (not during boot or on section pages) — set in
  `HomeScreen.tsx`.
- The four text labels are hidden on phones via `className="hide-sm"`.
- Edit the strings directly here (e.g. change `SYMBIOTE/01`), or delete a block you
  don't want.

---

## 8. Browser tab title & favicon — `index.html`

Change `<title>Intergalactic Spiderweb Portfolio</title>` to your name, and add a
favicon with `<link rel="icon" href="/favicon.svg" />` (drop the file in `public/`).

---

## Where things live (quick map)

```
src/
  data/portfolio.ts            ← all your text/content  (edit this first)
  types/index.ts               ← MENU_ITEMS + section ids
  styles/global.css            ← colors, fonts, animations, responsive rules
  components/
    ui/
      HomeScreen.tsx           ← orchestrates boot → menu → section; boot replay flag
      BootSequence.tsx         ← the boot animation + timings
      MainMenu.tsx             ← the main menu list & layout
      SectionView.tsx          ← page frame (title + BACK) + section registry
      Background.tsx           ← animated background
      HUD.tsx                  ← corner brackets & labels
    sections/                  ← the content of each page
      AboutSection.tsx, SkillsSection.tsx, ProjectsSection.tsx,
      ExperienceSection.tsx, ContactSection.tsx
index.html                     ← tab title, fonts, favicon
```

> The old 3D files under `src/components/canvas/` are **no longer used** and don't
> ship in the build. You can ignore (or delete) them.

---

## Deploying

It's a static site — `pnpm build` outputs `dist/`, which you can host anywhere
(Vercel, Netlify, GitHub Pages, Cloudflare Pages). On Vercel/Netlify, point the
project at this repo with build command `pnpm build` and output directory `dist`.

---

## Common tasks — cheat sheet

| I want to…                         | Edit |
| ---------------------------------- | ---- |
| Change my name / bio / links       | `src/data/portfolio.ts` |
| Add a project or job               | `src/data/portfolio.ts` (`projects` / `experience`) |
| Rename / reorder menu items        | `MENU_ITEMS` in `src/types/index.ts` |
| Add a whole new page               | `MENU_ITEMS` + new `sections/*` + `SectionView.tsx` (§2) |
| Make the boot longer/shorter       | timing constants in `BootSequence.tsx` (§3) |
| Replay the boot every visit        | remove the `sessionStorage` flag in `HomeScreen.tsx` (§3) |
| Change colors                      | CSS variables in `global.css` (§4) |
| Turn on the real fonts             | add the `<link>` in `index.html` (§5) |
| Calmer / different background      | `Background.tsx` (§6) |
| Change the browser tab title       | `index.html` (§8) |
```
