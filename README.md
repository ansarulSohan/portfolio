# Portfolio — G.M. Ansarul Kabir

Source for [ansarulkabir.work](https://ansarulkabir.work): a Next.js 16 site with a
built-in admin for editing all content (profile, projects, experience,
education, skills, messages), stored in MongoDB Atlas, with uploads in
Cloudflare R2. Light/dark themes plus an accessibility menu (text size, high
contrast, reduced motion, hyperlegible font, link underlines, text spacing).

- **Deploying:** [`docs/DEPLOY.md`](docs/DEPLOY.md) (Coolify, env vars, Atlas, R2)
- **Architecture & decisions:** [`docs/REBUILD_PLAN.md`](docs/REBUILD_PLAN.md)

## Develop

```bash
pnpm install
cp .env.example .env.local   # fill in values
pnpm seed                    # first time on an empty database: content + admin
pnpm dev                     # http://localhost:3000 (admin at /admin)
```

## Check

```bash
pnpm lint && pnpm typecheck
pnpm test                    # unit tests (Vitest)
pnpm exec playwright install chromium   # once
pnpm test:e2e                # browser tests on a throwaway portfolio_e2e database
```

## Build

```bash
pnpm build && node .next/standalone/server.js     # needs .next/static + public copied in; the Dockerfile does this
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://ansarulkabir.work \
  --build-arg S3_PUBLIC_URL=https://cdn.ansarulkabir.work -t portfolio .
```
