---
title: Scaling to 1000+ sites/month — bottlenecks and mitigations
category: concept
summary: Технічні bottlenecks при масштабуванні SEO-генерації до 1000+ сайтів (~50k pages) на місяць — LLM rate/cost, SERP API, scraping, CF Pages limits, indexation — з конкретними mitigations та cost model
tags: [task1, scaling, cost, bottlenecks, architecture]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/concepts/scaling-bottlenecks.md
---

# Scaling to 1000+ sites/month

## Definition
План масштабування системи генерації SEO-сайтів від MVP (1 сайт × 20 сторінок) до production-scale (1000 сайтів × 50 сторінок = ~50k pages/місяць). Включає кількісні обмеження (rate limits, API costs), якісні (Google indexation, content quality) та operational (DevOps, observability).

## Why it matters
PDF Task 1 явно питає: "як система зможе масштабуватися до тисяч сайтів на місяць і які технічні обмеження можуть виникнути". Без виміряних bottlenecks і конкретних mitigations — план "масштабуємо горизонтально" не означає нічого. Реальні обмеження не лінійні: на 100 сайтів — все працює; на 10,000 — натикаєшся на rate limits, ban, regulatory exposure.

## Bottlenecks ranked by severity

### 1. LLM rate limits + cost ⚠️
- **Volume:** ~20k output tokens per page × 50k pages = **1B tokens/місяць**
- **Cost (Claude Sonnet 4.7 raw):** $15/M × 1B = $15k/місяць
- **Rate limit (Tier-3):** 800 RPM output → constraint при >25 pages/min throughput

**Mitigations:**
- **Prompt caching** (Anthropic): −50% input cost + ~75% speedup на repeated brand-guidelines
- **Batch API**: −50% cost для non-urgent jobs (regeneration overnight)
- **Model routing:** Haiku 4.5 drafts ($0.80/M) → Sonnet 4.7 final ($15/M) → GPT-4.1-mini localisation ($0.40/M)
- **OpenRouter gateway**: uniform API + auto-failover між provider'ами

### 2. SERP API limits
- **Volume:** 3 calls/page × 50k = 150k calls/місяць
- **Cost:** SerpAPI $750/міс vs **DataForSEO $90/міс** (8× cheaper at scale)
- **Cache:** 24h per (keyword+geo); hit ratio 30-50% при keyword overlap

### 3. Web scraping (competitor analysis)
- **Volume:** 10-20 pages × 50k = 500k-1M fetches/місяць
- **Bandwidth:** ~500KB HTML × 1M = ~500GB transfer
- **Proxies:** Bright Data residential ~$15/GB
- **Rate per domain:** robots.txt compliance + 1 req/sec/domain
- **Mitigation:** distributed Playwright workers через K8s + KEDA

### 4. Cloudflare Pages account limits
- **Free:** 500 projects/account; **Pro:** 1000
- **1000+ sites:** sub-account sharding via CF API
- **Alternative:** Workers Sites (no limit) або monorepo з Workers host routing

### 5. GitHub API (if Git-deploy)
- **5000 req/hour** per user
- **Solution:** GitHub Apps (15k/hr org limits) OR direct CF Pages Upload API via `wrangler`

### 6. Google indexation (non-technical hard constraint) ⚠️
- Mass-generated sites trigger spam filters → ризик manual action
- **Mitigations:**
  - Unique content per page (no boilerplate, RAG проти operator KB)
  - E-E-A-T signals: author bio, sources, last-updated, contact
  - Ramp-up curve: 50/week → 100/week → 500/week
  - IndexNow + Google Indexing API для прискорення
  - Sample-based human review для quality
  - LLM-judge на factual consistency (RTPs, bonuses, licenses)

### 7. Compliance (iGaming specific)
- KSA (NL), MGA, UKGC mỗi мають різні правила
- Compliance regex + LLM-judge per GEO + immutable audit log
- GEO-blocking US/restricted markets через Cloudflare Workers
- Деталі: [[igaming-compliance-nl]] (forward ref)

### 8. Database
- Postgres handles billions rows з partitioning by date
- Read replicas для analytics
- Pgvector для embeddings, або Qdrant якщо >10M embeddings

## Cost model (50k pages/місяць)

| Item | Cost |
|---|---|
| LLM (Sonnet + Haiku + cache + batch) | ~$10k |
| SERP (DataForSEO) | $90 |
| Proxies (Bright Data residential) | $500-1500 |
| Compute (K8s workers) | $500 |
| Cloudflare (Pages Pro + Workers + R2) | $50 |
| DB (Neon Postgres + Redis) | $300 |
| Observability (Grafana Cloud + Sentry) | $200 |
| **Total** | **~$12-15k/місяць** |
| **Per page** | **$0.24-0.30** |

## Phased build plan

| Phase | Goal | Команда | Тривалість | Build cost | Run cost |
|---|---|---|---|---|---|
| **0. Discovery** | Legal review, brand voice extraction, prompt experiments | 1 eng + 1 SEO | 1 тиж | $0 | $0 |
| **1. MVP** | Sheets intake → SERP → 1 template → manual CF deploy; 1 site × 20 pages | 2 eng | 4 тиж | $4k | $300/міс |
| **2. Production** | Temporal workflows, multi-stage LLM, QC linters, admin UI, regeneration; **1k pages/місяць** | 2-3 eng + 1 SEO | 6 тиж | $25k | $2k/міс |
| **3. Scale-out** | K8s + KEDA, account sharding, cost routing, compliance gates; **50k pages/місяць** | 3 eng + 1 SRE | 8 тиж | $50k | $12-15k/міс |
| **4. Optimisation** | Continuous — fine-tuning, embedding-based brief reuse, ML SERP delta | 2 eng | ongoing | — | поступове зниження |

**Total to 50k pages/місяць:** ~5 місяців календарного часу, ~$80k build cost.

## Tradeoffs

- **More providers vs single-vendor:** OpenRouter дозволяє failover між 5+ LLM provider'ами, але додає 1-2% markup на token cost. Worth it при rate-limit constraints.
- **Workers Sites vs CF Pages:** Workers Sites не має 1000-project limit, але дещо складніший CI. Pages зі sharding — простіше підтримувати, але треба job-balance між accounts.
- **Self-hosted Qdrant vs Pinecone:** self-hosting економить $200-2k/місяць, але потребує DevOps. Migration трапляється на ~10M embeddings.
- **Programmatic SEO ризики:** агресивне scaling без quality guardrails → manual action. Trade-off між speed і safety: ramp-up curve обов'язковий.

## Related

- [[content-generation-pipeline]] (forward ref) — детально про LLM stages
- [[seo-quality-control]] (forward ref) — QC layer
- [[cloudflare-deployment]] (forward ref) — деталі deploy
- [[igaming-compliance-nl]] (forward ref) — compliance per GEO
- [[../entities/cloudflare-pages]] (forward ref), [[../entities/temporal]] (forward ref), [[../entities/openrouter]] (forward ref)
- [[../synthesis/task-1-answer]] (forward ref) — primary deliverable view
- [[../synthesis/architecture-overview]] — діаграма Task 1

## Sources

- [[../sources/kraken-leads-test-task]] — PDF question "як система зможе масштабуватися"
- Anthropic published rate limits (Tier-3 at writing time)
- DataForSEO pricing docs
- Cloudflare Pages account limits docs
