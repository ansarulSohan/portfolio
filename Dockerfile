# syntax=docker/dockerfile:1
#
# Production image for Coolify. Multi-stage: install → build → a small runner
# with only Next's standalone output (no source, no dev dependencies).
#
# Build-time (non-secret, inlined into the build):
#   NEXT_PUBLIC_SITE_URL  e.g. https://ansarulkabir.work
#   S3_PUBLIC_URL         public bucket address, used by next/image
# Runtime only (set in Coolify, never baked into the image):
#   MONGODB_URI, AUTH_SECRET, S3_ENDPOINT, S3_REGION, S3_BUCKET,
#   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL (again, at runtime)
#
# The build never contacts MongoDB (all reads happen at request time).

ARG NODE_VERSION=22-alpine

# ---- deps: install dependencies from the lockfile -------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- build: compile the standalone server -------------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SITE_URL
ARG S3_PUBLIC_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    S3_PUBLIC_URL=${S3_PUBLIC_URL} \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ---- runner: just the standalone output -----------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# Coolify can use this, or its own check against /api/health (200 = DB reachable).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
