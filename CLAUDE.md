# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Personal portfolio for **G.M. Ansarul Kabir** (GitHub `ansarulSohan`). The old Vite "game homescreen" site has been removed. It is being rebuilt as a **Next.js full-stack app with an admin CMS**: content is stored in MongoDB Atlas, uploads go to an S3-compatible bucket, and the app deploys as a Docker container on Coolify.

**`docs/REBUILD_PLAN.md` is the source of truth** for architecture, data model, accessibility requirements and phase order. Read it before starting work, and update its phase status as phases complete.

Phase 1 (scaffold) is done. Phases 2 to 10 have not been built yet.

## Stack notes

- **Next.js 16** (App Router, React 19, TypeScript strict). `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Next 16 APIs differ from older versions; for example, the middleware file is `proxy.ts`. Per `AGENTS.md`, check `node_modules/next/dist/docs/` before using a Next API.
- **Tailwind v4** is wired through the `@tailwindcss/turbopack` loader in `next.config.ts`, not PostCSS. Theme tokens are CSS variables in `src/app/globals.css` (`:root` and `.dark`), mapped in `@theme inline`.
- **shadcn/ui** uses the `radix-nova` style with Lucide icons (see `components.json`). Add components with `pnpm dlx shadcn@latest add <name>`. Class merging comes from the `cn` package (shadcn's own), re-exported from `src/lib/utils.ts`.
- `scripts/data/legacy-portfolio.ts` holds the old site's content. It exists only for the phase 2 seed script; delete it after seeding.

## Commands

```bash
pnpm dev          # http://localhost:3000
pnpm build        # next build
pnpm start        # serve production build
pnpm lint         # eslint (next core-web-vitals + typescript + prettier)
pnpm typecheck    # tsc --noEmit
```

There are no tests yet. Vitest and Playwright arrive in phase 9.

## Conventions

- Env vars are listed in `.env.example`, with placeholders only. Real values go in `.env.local` (gitignored) or Coolify.
- Unused vars and args are allowed when prefixed with `_`.
