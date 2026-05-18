# syntax=docker/dockerfile:1.6

# ── UI build stage ──
# We don't need Chromium during the Vite build; skip the browser download.
FROM node:20-bookworm-slim AS ui-builder
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js ./
COPY src ./src
COPY ui ./ui
RUN npx vite build

# ── Runtime stage ──
# Playwright base image ships matching Chromium + every OS dep already
# resolved. Version pin must track the playwright npm version.
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/data/starcasino.db \
    QUERY=starcasino \
    GEO=Netherlands \
    BRAND_DOMAIN=starcasino.nl \
    SERP_SOURCE=serpapi \
    SERP_LIMIT=10 \
    CLASSIFIER_LLM_ENABLED=true \
    OPENROUTER_MODEL=anthropic/claude-opus-4-7 \
    MONITOR_CRON="0 */6 * * *" \
    RUN_ON_START=true \
    SCRAPER_CONCURRENCY=3 \
    SCRAPER_RATE_PER_DOMAIN_MS=1000

COPY package*.json ./
RUN npm ci --omit=dev --include=dev=tsx --include=dev=typescript \
    && npm cache clean --force
# We need `tsx` + `typescript` at runtime to execute TS directly.
# (Compiling via `tsc` first would need runtime path tweaks.)

COPY tsconfig*.json ./
COPY src ./src
COPY ui ./ui
COPY data/mock-serp.json ./data/mock-serp.json
COPY --from=ui-builder /app/src/dashboard/public ./src/dashboard/public

RUN mkdir -p /data && chown -R pwuser:pwuser /data /app

USER pwuser

EXPOSE 3000

# Default entry: web (Fastify only). docker-compose overrides this with
# src/worker.ts for the worker container.
CMD ["npx", "tsx", "src/web.ts"]
