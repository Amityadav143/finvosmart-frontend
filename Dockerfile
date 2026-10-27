# ============================================================
# FINVOSMART Frontend — Next.js 14 (standalone output)
# ============================================================

# ── Dependencies (full install incl. devDependencies for build) ──────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Use npm ci when a lockfile exists (reproducible); fall back to npm install otherwise.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# NEXT_PUBLIC_* values are baked into the build: pass them as build arguments.
ARG NEXT_PUBLIC_PREVIEW_FEATURES=false
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
ARG NEXT_PUBLIC_BING_SITE_VERIFICATION=
ENV NEXT_PUBLIC_PREVIEW_FEATURES=${NEXT_PUBLIC_PREVIEW_FEATURES} \
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=${NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} \
    NEXT_PUBLIC_BING_SITE_VERIFICATION=${NEXT_PUBLIC_BING_SITE_VERIFICATION}
ENV NEXT_TELEMETRY_DISABLED=1
# A self-contained server (.next/standalone/server.js) for the small runtime image below.
ENV NEXT_OUTPUT=standalone
RUN npm run build

# ── Runtime (minimal standalone image) ───────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node","server.js"]
