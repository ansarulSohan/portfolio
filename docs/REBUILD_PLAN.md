# Portfolio Rebuild Plan — Professional, CMS-driven, Next.js + MongoDB Atlas + Coolify

## Context

The current site (`/Users/ansarulkabir/Desktop/Code/portfolio`) is a Vite + React SPA with a "game homescreen" look: a boot animation, a menu and section pages, styled black and white. All content is hardcoded in `src/data/portfolio.ts`, and there's leftover 3D code that nothing uses. The owner wants a **complete overhaul** with these goals:

- A professional, modern UI suited to recruiters and clients, with no gimmicks.
- **Light/dark mode** and **accessibility options**.
- **Content editable in the app.** Projects, experience, skills, education, bio and links are managed through a protected admin dashboard and stored in **MongoDB Atlas**. No code edits needed.
- Deployment on **Coolify**, self-hosted, as a Docker container.

Decisions already made:

- Next.js full-stack.
- A single admin account with a password.
- Images and files in an **S3-compatible bucket** (Cloudflare R2 recommended; AWS S3 or MinIO also work).

## Status

| Phase            | State                                                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Scaffold      | ✅ Done (2026-10-31): Next.js 16.4, Tailwind v4, shadcn/ui (radix-nova); Vite and 3D code removed                                                                                                                        |
| 2. Data layer    | ✅ Done (2026-10-31): models, zod schemas, DTOs, cached queries, `pnpm seed`; Atlas seeded                                                                                                                               |
| 3. Design system | ✅ Done (2026-10-31): AA-checked tokens (light, dark, high contrast ×2), prefs script, accessibility menu                                                                                                                |
| 4. Public site   | ✅ Done (2026-10-31): home sections, /projects, /projects/[slug], contact form, sitemap, robots, OG image                                                                                                                |
| 5. Auth          | ✅ Done (2026-10-31): JWT session cookie, proxy gate, requireAdmin(), login/logout, rate limits                                                                                                                          |
| 6. Admin CRUD    | 🟡 Built (2026-10-31): editors for profile, projects, experience, education, skills; messages; settings + password. Logic and rendering are tested; the in-browser click-through is pending (needs the owner to sign in) |
| 7. Uploads       | 🟡 Built and tested against R2 (2026-10-31). Browser uploads need bucket CORS and `S3_PUBLIC_URL` set (see notes)                                                                                                        |
| 8. Hardening     | ✅ Done (2026-10-31): CSP + security headers, error pages, `/api/health`. CSP enforcement still to be verified in Playwright (phase 9)                                                                                   |
| 9. Tests         | ✅ Done (2026-10-31): 42 Vitest unit tests + 44 Playwright e2e tests (incl. axe in 4 colour modes), all passing                                                                                                          |
| 10. Deploy       | 🟡 Ready (2026-10-31): Dockerfile + `docs/DEPLOY.md` for ansarulkabir.work; standalone server verified. Waiting on: Docker image build test, Coolify setup, credential rotation, R2 CORS/public URL                      |

**Notes from phase 1:**

- The scaffold is **Next.js 16**, not 15. In Next 16 the `middleware.ts` file is called **`proxy.ts`**; every mention of `middleware.ts` below means `proxy.ts`.
- `cacheComponents` is on, so data caching uses the `"use cache"` directive with `cacheTag()`, and saves call `revalidateTag()` / `updateTag()`. It does not use `unstable_cache`.
- Tailwind runs through the `@tailwindcss/turbopack` loader, not PostCSS.
- The old content lives in `scripts/data/legacy-portfolio.ts`, ready for the seed script.

**Notes from phase 2:**

- Months are stored as `"YYYY-MM"` strings, not Dates: they sort as text and match `<input type="month">`. An empty `end` means "present".
- Skill levels are labels (`familiar` / `proficient` / `expert`); the seed maps old 0–100 values to them (≥85 expert, ≥70 proficient).
- `pnpm seed --dry-run` validates the old content against the zod schemas without touching the DB. `pnpm seed` only fills empty collections; `--force` replaces content but never admins or messages.
- Models use `mongoose.models.X` from the default import: under plain Node ESM (tsx), mongoose has no `models` named export.
- ~~Decide in phase 4~~ (decided, see phase 3–4 notes): with `cacheComponents`, `"use cache"` reads run during `next build` to prerender pages, so the Docker build would need `MONGODB_URI`. Either mark it as a build variable in Coolify, or keep DB reads out of the build-time shell (wrap them in `<Suspense>` so they resolve at request time).

**Notes from phases 3–4:**

- **No database access at build time.** Each public query in `lib/queries.ts` awaits `io()` and then calls an inner `"use cache"` function. During `next build`, `io()` suspends, so pages prerender a static shell (header, skeletons) and content streams in per request from the in-memory cache. The Docker build needs no `MONGODB_URI`. Callers must sit inside `<Suspense>`. Verified: `MONGODB_URI= pnpm build` passes.
- **Build-time variables** (non-secret, set as build variables in Coolify): `NEXT_PUBLIC_SITE_URL` (inlined into metadataBase and the sitemap) and `S3_PUBLIC_URL` (`next/image` remotePatterns). Secrets (`MONGODB_URI`, `AUTH_SECRET`, S3 keys) are runtime only.
- **Theme and accessibility preferences don't use next-themes.** `lib/prefs.ts` holds an inline `<head>` script that applies stored prefs as `<html>` attributes before paint, plus `applyPrefs()` for the React menu. Keep the two in sync. The phase 8 CSP must allow this inline script (nonce or hash).
- **Settings `defaultTheme` was dropped.** The root layout must stay static (no DB), and following the visitor's OS theme is the better default.
- **Social links are labelled text** ("GitHub ↗"): lucide 1.x removed brand icons.
- **Animation is CSS only** (`animate-fade-up`), not the `motion` library. Reduced motion applies from the OS setting or the menu.
- **Unknown project slugs** render the 404 UI with `noindex`. The HTTP status is 200 because the response is already streaming.
- **The contact form** saves to `messages`, is rate limited (5/hour per hashed IP, `rateLimits` collection with TTL) and has a honeypot field.

**Notes from phase 5:**

- **Two layers of checks.** `src/proxy.ts` is a fast gate that only verifies the cookie's signature and expiry, redirects to `/admin/login?next=…`, and sets `X-Robots-Tag: noindex` and `Cache-Control: no-store`. **`requireAdmin()` (`lib/auth.ts`) is the real check:** it confirms the admin exists and that the token's `v` matches `Admin.sessionVersion`. Every admin layout, page and **server action** must call it.
- **Revocation:** incrementing `Admin.sessionVersion` signs out every session. Phase 6's "change password" must increment it and then issue a fresh session.
- `lib/session-token.ts` (jose, HS256, 7 days) has no `server-only` import so the proxy can use it. `AUTH_SECRET` must be at least 32 characters, or signing throws and every token is rejected.
- Login is rate limited per hashed IP (10 per 15 min) and per email (20 per 15 min), shows one generic error, and runs bcrypt against a dummy hash for unknown emails, so timing doesn't reveal which emails exist. `?next=` only accepts `/admin…` paths.
- Admin pages read cookies, so the `(dashboard)` layout renders behind `<Suspense>`.

**Notes from phase 6:**

- **Pattern:** client editors keep form state in React and call server actions with a plain object (`useAdminAction` handles pending state, toasts, field errors and focus on the first invalid field). Every action runs `requireAdmin()`, then a zod parse, then the DB write, then `updateTag()`. Results are typed by `ActionResult` (`lib/action-result.ts`).
- **Clearing fields:** `toUpdate()` (`lib/admin-crud.ts`) puts cleared optional fields in `$unset`, so emptying a field really removes it. The form schemas (`profileFormSchema`, `projectFormSchema`) omit image fields, so a form save never touches uploads.
- **zod 4:** `.omit()` throws on refined schemas, so each refined schema is built from an exported `*Fields` object.
- **Reordering** uses up/down buttons (keyboard and screen-reader friendly); `moveDocument()` renumbers the list 0..n-1. Drag and drop was not added.
- **Experience, education and skills** share `actions/admin/lists.ts`. Its `kind` argument is whitelisted, and the pages pass bound actions (`moveListItem.bind(null, "experience")`).
- **Proxy fix:** removed the "signed in → leave /admin/login" redirect. With revoked-but-signed cookies it looped forever between `/admin` and `/admin/login`. `signOutEverywhere` also clears this browser's cookie.
- Validation messages are plain language because they're shown to the editor.
- Scripts that import `server-only` modules must run with `tsx --conditions=react-server`.

**Notes from phase 7:**

- **Flow:** `requestUpload` (server action; replaces the planned `/api/upload/presign` route, and server actions get Next's built-in origin check) returns a presigned PUT. The browser uploads straight to the bucket with progress. `setAvatar` / `setResume` / `setProjectCover` / `setProjectGallery` then confirm with `HeadObject` that the object exists with an allowed type and size before saving it, and delete whatever it replaced. Deleting a project deletes its images.
- **Signatures:** `signableHeaders` includes Content-Type and Content-Length, so R2 rejects any upload whose type or size differs from what the server approved. Without this, R2 accepted a different Content-Type (verified).
- **Checksums:** the S3 client uses `requestChecksumCalculation: "WHEN_REQUIRED"`. Recent SDKs otherwise add CRC32 checksum params that break browser presigned uploads.
- **Keys:** `uploads/<kind>/<uuid>.<ext>`. Only raster images (JPEG, PNG, WebP, AVIF; max 5 MB) and PDF (max 10 MB) are allowed. No SVG.
- **Endpoint:** `lib/s3.ts` uses only the origin of `S3_ENDPOINT`. Cloudflare displays the S3 address with `/<bucket>` appended, and passing that through produced `/<bucket>/<bucket>/…` URLs that broke CORS.
- The app's R2 token is (correctly) object read/write only, so bucket CORS must be set in the Cloudflare dashboard.
- **Bucket setup still required:**
  1. **CORS** on the bucket allowing `PUT` with the `Content-Type` header from the site origins (`http://localhost:3000` and the production domain).
  2. **Public access** (custom domain or r2.dev) set as `S3_PUBLIC_URL`, also as a Coolify build variable, since `next/image` remotePatterns are fixed at build time.

**Notes from phase 8:**

- **CSP** is built per request in `lib/csp.ts` and set by `src/proxy.ts`, which now runs on all page routes (static assets excluded). This lets `connect-src` use the runtime R2 endpoint. Scripts allow `'unsafe-inline'`, because nonces are incompatible with partial prerendering. Everything else is locked down: `object-src 'none'`, `frame-ancestors 'none'`, `base-uri`/`form-action 'self'`, and `connect-src` limited to self plus the bucket. `'unsafe-eval'` and `ws:` are allowed only in dev.
- **Fixed headers** in `next.config.ts`: HSTS (2 years), nosniff, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and no `X-Powered-By`.
- **Error boundaries:** `(site)/error.tsx`, `admin/(dashboard)/error.tsx`, and `global-error.tsx` with inline styles, because global CSS isn't available there. In Next 16 the recovery prop is `retry`, and `error` is `unknown`.
- **`/api/health`** pings MongoDB and returns 200 `{status:"ok"}` or 503. Point Coolify's health check at it.
- **Verification so far:** no console or CSP violations on page loads. The Claude-in-Chrome extension bypasses CSP in tabs it controls (eval ran despite a correct header), so enforcement has to be checked in Playwright.

**Notes from phase 9:**

- `pnpm test` runs Vitest (`tests/unit/`): validation, slugs, dates, prefs, upload rules, session tokens, the post-login redirect guard, `toUpdate` and the CSP. `server-only` is aliased to a stub in `vitest.config.ts`.
- `pnpm test:e2e` runs Playwright (`tests/e2e/`) against a **production build on port 3200** using a separate **`portfolio_e2e` database**: the web server command runs `pnpm seed --force` against it first, and `global-teardown.ts` drops it afterwards. That teardown refuses to drop any other database. The test admin and secret in `tests/e2e/env.ts` exist only there. Real content is never touched (verified after the run).
- **Coverage:** axe (WCAG 2.2 A/AA, serious/critical) on 5 pages × light/dark/high-contrast/high-contrast-dark; the preferences menu (including no flash before hydration, checked by blocking JS bundles); public pages, the mobile menu and 404s; contact form → admin inbox; admin login/redirect/logout; project create → publish → public page → edit → delete; profile edit and clear; section hiding; reordering; security headers; CSP enforcement; anti-framing.
- **Real bugs the tests found and fixed:** the root 404 page had no `<title>`; the accessibility menu overflowed the window at larger text with no way to scroll (now scrolls within the available height).
- **CSP testing gotcha:** Chrome exempts DevTools-injected code (`page.evaluate`, `addScriptTag`, and the Claude-in-Chrome extension) from `'unsafe-eval'`, so "eval ran" proves nothing. The CSP test checks `connect-src` blocking instead.

**Notes from phase 10:**

- `Dockerfile`: node:22-alpine, multi-stage (deps → build → runner). It runs `node server.js` from `.next/standalone` as a non-root user, with a `HEALTHCHECK` on `/api/health`. Build args are only `NEXT_PUBLIC_SITE_URL` and `S3_PUBLIC_URL`; secrets are runtime-only.
- **`.dockerignore` must exclude `.env*`.** Next's standalone output copies a root `.env` file into `.next/standalone/` (seen locally), so without the exclusion secrets could end up in the image. It also excludes `tests/` and the test configs, which import from `tests/`, because Next typechecks the whole project during the build.
- The standalone server was verified with runtime env only (health, pages, sitemap with the production URL, OG image, `next/image`).
- Step-by-step Coolify, Atlas and R2 setup is in `docs/DEPLOY.md`.

---

## Stack

| Concern       | Choice                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Framework     | **Next.js 15+ (App Router, React 19, TypeScript strict)**, with `output: "standalone"`                                               |
| Styling       | **Tailwind CSS v4** + **shadcn/ui** (Radix primitives, which are accessible by default)                                              |
| Theming       | `next-themes`: system, light or dark, applied as a class on `<html>` with no flash                                                   |
| Animation     | `motion` (Framer Motion), used sparingly and turned off under reduced motion                                                         |
| DB            | MongoDB Atlas through **Mongoose**, with a cached connection singleton                                                               |
| Validation    | **zod** schemas shared by forms (react-hook-form) and server actions                                                                 |
| Auth          | Custom and minimal: bcrypt password hash + a signed `jose` JWT in an httpOnly cookie. `middleware.ts` guards `/admin/**`             |
| Rich text     | Markdown (project case studies, bio) edited with a split-pane markdown editor and rendered with `react-markdown` + `rehype-sanitize` |
| Uploads       | Presigned PUT URLs to S3/R2 using `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`                                             |
| Images        | `next/image`, with `remotePatterns` set to the bucket's public domain                                                                |
| Icons / fonts | `lucide-react`; `next/font` with Inter or Geist (self-hosted, no layout shift)                                                       |
| Tooling       | pnpm, ESLint, Prettier, Vitest (utils and zod schemas), Playwright + `@axe-core/playwright` (end-to-end and accessibility checks)    |

Start with a **fresh Next.js app in the same repo**. Delete the Vite app, the `src/components/canvas`, `shaders` and `hooks` stubs, and the 3D dependencies. Keep the git history. Migrate the content of `src/data/portfolio.ts` once through a seed script, then delete the file.

---

## Information architecture

### Public site

All pages are server-rendered from the DB with ISR. Cache tags are invalidated when the admin saves.

- `/` is a one-page layout:
  - **Hero**: name, title, tagline, location, CTA buttons (Contact, Resume) and social links.
  - **About**: bio in markdown, plus a photo.
  - **Featured projects**: a card grid.
  - **Experience**: a timeline.
  - **Skills**: grouped chips. Proficiency is optional, shown as a label rather than a percentage bar.
  - **Education**.
  - **Contact**: a form plus links.
- `/projects` lists every project, filterable by tech or tag.
- `/projects/[slug]` is a project detail or case-study page: cover image, gallery, markdown body, tech, links, role and dates.
- `/resume` redirects to the uploaded PDF.
- `sitemap.xml`, `robots.txt`, per-page metadata, and Open Graph images. The OG images are generated dynamically with `next/og`.
- A sticky header with section anchors, a theme toggle and an accessibility menu. On mobile the navigation is a sheet.

### Admin (`/admin`, protected)

- `/admin/login`.
- `/admin`: a dashboard summarising counts, unread messages and quick links.
- `/admin/profile`: name, title, tagline, location, email, socials, avatar, resume PDF upload, bio (markdown), and SEO defaults.
- `/admin/projects`: a list with drag-to-reorder, "featured" and "published" toggles, and create/edit/delete. The editor covers title, slug (auto-generated), summary, markdown body, tech tags, links, cover image, gallery and dates.
- `/admin/experience`, `/admin/education` and `/admin/skills` (categories and their items): CRUD with reordering.
- `/admin/messages`: contact-form submissions, with mark-read and delete.
- `/admin/settings`: change password and site-wide options such as the default theme and which sections are visible.

Every mutation goes through a **Server Action** that does three things in order:

1. Calls `requireAdmin()`.
2. Parses the input with zod.
3. Writes to the DB, then calls `revalidateTag()`.

The public site updates immediately after a save; no redeploy is needed.

---

## Data model (Mongoose)

The collections are `profile` (a singleton), `projects`, `experiences`, `education`, `skillCategories`, `messages`, `admins` and `settings` (a singleton). Every list collection has an `order: number` field for manual sorting. Projects have `published` and `featured` flags and a unique `slug`.

```ts
Project {
  slug, title, summary, body /* markdown */,
  tech: string[], tags: string[],
  links: { github?, live?, caseStudy? },
  cover?: { url, key, alt },          // alt text is required (accessibility)
  gallery: { url, key, alt }[],
  role?, startDate?, endDate?,
  featured, published, order, createdAt, updatedAt
}
Experience     { role, company, companyUrl?, location?, start, end?/*null=present*/, highlights: string[], tech: string[], order }
Education      { degree, institution, start, end, notes?, order }
SkillCategory  { name, order, items: { name, level?: "familiar"|"proficient"|"expert" }[] }
Profile        { name, title, tagline, location, email, socials{linkedin,github,...}, bio, avatar?, resume?, seo{title,description,ogImage?} }
Message        { name, email, subject?, body, read, createdAt, ip hash }
Admin          { email, passwordHash, updatedAt }
```

Files: `src/models/*.ts`, the connection in `src/lib/db.ts`, and zod schemas in `src/lib/validation/*.ts`. Data access goes through `src/lib/queries.ts`, which wraps reads in `unstable_cache` (or the `"use cache"` directive) with tags such as `projects` and `profile`.

---

## Accessibility and theming

- Target **WCAG 2.2 AA**. Use semantic landmarks, a skip-to-content link and visible focus rings. All interactive parts are Radix/shadcn primitives with correct ARIA.
- Contrast tokens are checked in both themes. Content images must have alt text, which the admin form enforces.
- The **accessibility menu** in the header is a popover. Its preferences are saved in `localStorage` and applied as `data-*` attributes on `<html>` by a tiny inline script before paint, so nothing flashes. It offers:
  - Theme: system, light or dark.
  - Text size: 100%, 115% or 130%. This scales the root `font-size`, and the layout uses rem throughout.
  - **High contrast** mode, an alternate token set.
  - **Reduce motion**, which also respects `prefers-reduced-motion` by default.
  - **Dyslexia-friendly font**, e.g. Atkinson Hyperlegible.
  - Underline all links, and extra letter or line spacing.
- Design tokens are CSS variables in `src/app/globals.css` for `:root`, `.dark` and `[data-contrast=high]`, mapped into Tailwind v4's `@theme`.
- Keyboard testing covers the entire admin, including the drag-to-reorder lists, which get up/down buttons as a keyboard alternative.

## Visual direction

The look is a clean, editorial "engineer portfolio": generous whitespace, a restrained neutral palette with one accent colour, and subtle borders and cards. Typography is crisp, with a large hero heading and a readable 65ch measure for text. Motion is limited to small fade-ins on scroll. The admin uses the shadcn dashboard layout (sidebar, data tables, forms, toasts).

---

## Security

- **Admin bootstrap:** the first run seeds the admin from the `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars, only when no admin exists yet. After that, change the password in the UI.
- **Sessions:** a JWT signed with `AUTH_SECRET` in an `httpOnly`, `Secure`, `SameSite=Lax` cookie with a 7-day expiry. It is checked in `proxy.ts` and checked again in every server action and admin route handler with `requireAdmin()`.
- **Login protection:** rate limiting on login and the contact form, using an in-memory or Mongo TTL counter keyed by a hash of the IP, plus a honeypot field on the contact form. Cloudflare Turnstile is optional.
- **Uploads:** the presign endpoint is admin-only and checks MIME type and size (images up to 5 MB, the PDF up to 10 MB). Object keys are random UUIDs.
- **Markdown** output is sanitized.
- **Security headers:** the CSP is set per request in `src/proxy.ts`; the fixed headers are in `next.config.ts` (see the phase 8 notes).
- **⚠️ Secrets:** `.env.example` currently contains what looks like a **real Atlas password** (`DB_PASS=...`). It's gitignored via `.env*`, so it hasn't been committed, but `.env.example` is meant to be committed in the new setup. Replace the values with placeholders and **rotate that Atlas password**. Real secrets live only in Coolify env vars and a local `.env.local`.

---

## Deployment (Coolify)

- **`Dockerfile`**: a multi-stage build on `node:22-alpine`. It runs `corepack enable` and `pnpm install --frozen-lockfile`, then `pnpm build`, then copies `.next/standalone`, `.next/static` and `public` into the runner stage. It runs as a non-root user on port 3000.
- **Coolify setup:** create a new resource from the Git repo, choose the **Dockerfile** build pack and expose port 3000. Set the domain, and Coolify handles HTTPS through Traefik and Let's Encrypt.
- **Health check:** `GET /api/health` returns 200 and pings the DB. Point Coolify's health check at it.
- **Env vars**, set in Coolify; `.env.example` lists them with placeholders:
  ```
  MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/portfolio?retryWrites=true&w=majority
  AUTH_SECRET=<32+ random bytes>
  ADMIN_EMAIL=ansarulsohan@gmail.com
  ADMIN_PASSWORD=<initial, change after first login>
  S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
  S3_REGION=auto
  S3_BUCKET=portfolio
  S3_ACCESS_KEY_ID=...
  S3_SECRET_ACCESS_KEY=...
  S3_PUBLIC_URL=https://cdn.<yourdomain>      # public bucket domain for next/image
  NEXT_PUBLIC_SITE_URL=https://<yourdomain>
  ```
- **Atlas:** add the Coolify server's public IP to the Network Access allowlist. Create a dedicated DB user with readWrite access on the `portfolio` DB only.
- **Bucket:** configure CORS to allow PUT from the site's origin so browser uploads work.
- Remove `netlify.toml` and `nixpacks.toml`.

---

## Project structure (target)

```
src/
  app/
    (site)/layout.tsx, page.tsx, projects/page.tsx, projects/[slug]/page.tsx
    admin/login/page.tsx
    admin/(dashboard)/layout.tsx, page.tsx, profile/, projects/, projects/[id]/, experience/, education/, skills/, messages/, settings/
    api/health/route.ts, api/upload/presign/route.ts
    sitemap.ts, robots.ts, opengraph-image.tsx, globals.css, layout.tsx
  components/
    site/      Header, Hero, ProjectCard, ExperienceTimeline, SkillGroups, ContactForm, Footer
    admin/     Sidebar, DataTable, SortableList, MarkdownEditor, ImageUploader, ConfirmDialog
    a11y/      AccessibilityMenu, ThemeToggle, SkipLink, PrefsScript
    ui/        (shadcn generated)
  lib/         db.ts, auth.ts (sign/verify/requireAdmin), s3.ts, queries.ts, rate-limit.ts, slug.ts, validation/
  actions/     profile.ts, projects.ts, experience.ts, education.ts, skills.ts, messages.ts, auth.ts
  models/      Profile.ts, Project.ts, Experience.ts, Education.ts, SkillCategory.ts, Message.ts, Admin.ts
  middleware.ts
scripts/seed.ts     # imports current portfolio.ts content → Mongo (one-time, idempotent)
Dockerfile, .dockerignore, .env.example, next.config.ts
```

---

## Implementation phases

1. **Scaffold.** Do this on a new branch, `rebuild/nextjs`.
   - `create-next-app` (TypeScript, Tailwind, ESLint, src dir), then shadcn init.
   - Remove the Vite and 3D files. Copy this plan to `docs/`.
2. **Data layer.** Write `db.ts`, the models, the zod schemas and `queries.ts`. Then write `scripts/seed.ts` and use it to migrate the existing content from `portfolio.ts` (profile, 4 skill categories, 1 project, 3 experiences, 2 education entries) plus the admin account.
3. **Design system.** Tokens for light, dark and high contrast; fonts; `PrefsScript`, `ThemeToggle` and `AccessibilityMenu`; the base layout with a skip link.
4. **Public site.** The home page sections, the projects list and detail pages, the contact form (server action, rate limit, saved to `messages`), and SEO (metadata, sitemap, OG images).
5. **Auth.** The login page, `lib/auth.ts`, `middleware.ts`, and logout.
6. **Admin CRUD.** Profile, then projects (markdown editor, uploads, reorder, publish/feature), experience, education, skills, messages and settings. Each one uses the server action → `revalidateTag` flow.
7. **Uploads.** `lib/s3.ts`, the presign route, the `ImageUploader` component (preview, alt text, delete removes the object) and the resume upload.
8. **Hardening.** Security headers, rate limits, error and not-found pages, loading skeletons, and `/api/health`.
9. **Tests.**
   - Vitest for the zod schemas, slug generation and auth token signing/verification.
   - Playwright end-to-end tests covering: login → create project → see it on `/projects/[slug]` → delete; theme and accessibility toggles persist across reloads; an axe scan on the main pages in both themes.
10. **Deploy.**
    - Dockerfile and `.env.example`, then the Coolify resource and env vars, the Atlas IP allowlist and bucket CORS.
    - Run the seed once against prod, with `pnpm seed` run inside the container or locally against the prod URI.
    - Update `CLAUDE.md` and README for the new architecture.

---

## Verification

- `pnpm lint`, `pnpm typecheck` and `pnpm test` (Vitest) all pass. `pnpm build` produces the standalone output.
- **Local end-to-end:**
  - Set `.env.local` to a dev Atlas DB (or a local `mongo` container) and an R2 dev bucket, then run `pnpm seed` and `pnpm dev`.
  - The public pages show the migrated content.
  - Log in at `/admin/login`, add a project with a cover image, and confirm it appears on `/` and `/projects/<slug>` without a restart.
  - Edit and delete it, and confirm both changes show up on the public site.
- `pnpm test:e2e` (Playwright + axe) reports no serious or critical accessibility violations in light, dark and high-contrast modes.
- Manual checks:
  - Navigate the whole site and admin by keyboard.
  - Use VoiceOver for a spot check.
  - Run Lighthouse on mobile and aim for 95+ in Performance, Accessibility, Best Practices and SEO.
- Test the Docker image locally: `docker build -t portfolio . && docker run -p 3000:3000 --env-file .env.local portfolio`, then confirm `/api/health` returns 200.
- After deploying to Coolify, the health check is green, HTTPS works, an upload succeeds (bucket CORS is correct), and the contact form submission shows up in `/admin/messages`.
