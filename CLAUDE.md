# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Personal portfolio for **G.M. Ansarul Kabir** (GitHub `ansarulSohan`). The old Vite "game homescreen" site has been removed. It is being rebuilt as a **Next.js full-stack app with an admin CMS**: content is stored in MongoDB Atlas, uploads go to an S3-compatible bucket, and the app deploys as a Docker container on Coolify.

**`docs/REBUILD_PLAN.md` is the source of truth** for architecture, data model, accessibility requirements and phase order. Read it before starting work, and update its phase status as phases complete.

Phases 1–6 are built (scaffold, data layer, design system, public site, admin auth, admin editors). Uploads (phase 7) come next.

## Stack notes

- **Next.js 16** (App Router, React 19, TypeScript strict). `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Next 16 APIs differ from older versions; for example, the middleware file is `proxy.ts`. Per `AGENTS.md`, check `node_modules/next/dist/docs/` before using a Next API.
- **Tailwind v4** is wired through the `@tailwindcss/turbopack` loader in `next.config.ts`, not PostCSS. Theme tokens are CSS variables in `src/app/globals.css` (`:root` and `.dark`), mapped in `@theme inline`.
- **shadcn/ui** uses the `radix-nova` style with Lucide icons (see `components.json`). Add components with `pnpm dlx shadcn@latest add <name>`. Class merging comes from the `cn` package (shadcn's own), re-exported from `src/lib/utils.ts`.
- `scripts/data/legacy-portfolio.ts` holds the old site's content. `pnpm seed` reads it to fill an empty database and create the first admin. It has already been seeded into Atlas; delete it once production is deployed.

## Commands

```bash
pnpm dev          # http://localhost:3000
pnpm build        # next build
pnpm start        # serve production build
pnpm lint         # eslint (next core-web-vitals + typescript + prettier)
pnpm typecheck    # tsc --noEmit
```

There are no tests yet. Vitest and Playwright arrive in phase 9.

```bash
pnpm seed [--dry-run|--force]   # import legacy content + first admin into MongoDB (reads .env.local)
MONGODB_URI= pnpm build         # must pass: proves no page queries the DB at build time
pnpm exec tsx --conditions=react-server --tsconfig tsconfig.json <script>  # run a script that imports server-only modules
```

## Architecture

- `src/app/(site)/` holds the public pages, which share the header and footer in `(site)/layout.tsx`. The root `layout.tsx` stays static: fonts, the prefs `<head>` script and `PrefsProvider`.
- **Data flow:** Mongoose models (`src/models/`) → DTO mappers (`lib/dto.ts`, plain serializable objects) → public queries (`lib/queries.ts`). Each public query awaits `io()` and then calls a tagged `"use cache"` function, so **every component that calls a query must be inside `<Suspense>`**, and the build never touches MongoDB. Admin writes must call `updateTag()` with the tags in `lib/cache-tags.ts`.
- `lib/validation/` (zod) is the single definition of every content shape, used by the seed script, forms and server actions. Months are `"YYYY-MM"` strings; an empty `end` means "present".
- **Theme and accessibility:** `lib/prefs.ts` is the source of truth. `PREFS_SCRIPT` (inline, runs before paint) and `applyPrefs()` (React menu) must stay in sync. Styles key off `<html>` attributes in `globals.css`: `.dark`, `data-contrast`, `data-text`, `data-font`, `data-links`, `data-spacing`, `data-motion`. The colour tokens were checked against WCAG AA, so re-check contrast if you change them.
- **Admin auth:** `src/proxy.ts` is only a fast signature check. **Every admin page, layout and server action must call `requireAdmin()`** from `lib/auth.ts`, which checks the database and the session version. Server actions are public endpoints, so the proxy doesn't protect them. Admin routes live in `src/app/admin/(dashboard)/`, behind a `<Suspense>` gate.
- **Admin editors:** client form state → server action with a plain object → `ActionResult`. Use `useAdminAction` (in `components/admin/`) and the accessible field components in `components/admin/fields.tsx`. Write updates with `toUpdate()` so cleared fields are unset. Don't pass plain functions from server pages to client components; pass server actions (`.bind()` them for fixed arguments) or strings.
- Models import `mongoose` as the default export and use `mongoose.models.X`, because `tsx` runs scripts as plain Node ESM, where `models` isn't a named export.

## Conventions

- Env vars are listed in `.env.example`, with placeholders only. Real values go in `.env.local` (gitignored) or Coolify.
- Unused vars and args are allowed when prefixed with `_`.
- shadcn components import `cn` from `@/lib/utils`. The CLI generates `from "cn"`, so fix that after `shadcn add`.
- No hardcoded personal content: anything the owner might change belongs in MongoDB and should be editable in the admin.
