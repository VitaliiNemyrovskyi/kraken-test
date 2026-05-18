---
title: Scaling to 1000+ sites/month — bottlenecks and mitigations
category: concept
summary: Technical bottlenecks when scaling SEO generation to 1000+ sites (~50k pages) per month — LLM rate/cost, SERP API, scraping, CF Pages limits, indexation — with concrete mitigations and a cost model
tags: [task1, scaling, cost, bottlenecks, architecture]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/concepts/scaling-bottlenecks.md
---

# Scaling to 1000+ sites/month

## Definition
The scaling plan for the SEO-site generation system from MVP (1 site × 20 pages) to production scale (1000 sites × 50 pages = ~50k pages/month). Includes quantitative limits (rate limits, API costs), qualitative ones (Google indexation, content quality) and operational concerns (DevOps, observability).

## Why it matters
The PDF Task 1 asks explicitly: "how will the system scale to thousands of sites per month and what technical constraints might arise". Without measured bottlenecks and concrete mitigations the phrase "scale horizontally" is meaningless. The real constraints aren't linear: at 100 sites everything works; at 10,000 you hit rate limits, bans, regulatory exposure.

## Bottlenecks ranked by severity

### 1. LLM rate limits + cost ⚠️
- **Volume:** ~20k output tokens per page × 50k pages = **1B tokens/month**
- **Cost (Claude Sonnet 4.7 raw):** $15/M × 1B = $15k/month
- **Rate limit (Tier-3):** 800 RPM output → constraint at >25 pages/min throughput

**Mitigations:**
- **Prompt caching** (Anthropic): −50% input cost + ~75% speedup on repeated brand-guidelines
- **Batch API**: −50% cost for non-urgent jobs (regeneration overnight)
- **Model routing:** Haiku 4.5 drafts ($0.80/M) → Sonnet 4.7 final ($15/M) → GPT-4.1-mini localisation ($0.40/M)
- **OpenRouter gateway**: uniform API + auto-failover across providers

### 2. SERP API limits
- **Volume:** 3 calls/page × 50k = 150k calls/month
- **Cost:** SerpAPI $750/month vs **DataForSEO $90/month** (8× cheaper at scale)
- **Cache:** 24h per (keyword+geo); hit ratio 30-50% with keyword overlap

### 3. Web scraping (competitor analysis)
- **Volume:** 10-20 pages × 50k = 500k-1M fetches/month
- **Bandwidth:** ~500KB HTML × 1M = ~500GB transfer
- **Proxies:** Bright Data residential ~$15/GB
- **Per-domain rate:** robots.txt compliance + 1 req/sec/domain
- **Mitigation:** distributed Playwright workers via K8s + KEDA

### 4. Cloudflare Pages account limits
- **Free:** 500 projects/account; **Pro:** 1000
- **1000+ sites:** sub-account sharding via CF API
- **Alternative:** Workers Sites (no limit) or monorepo with Workers host routing

### 5. GitHub API (if Git-deploy)
- **5000 req/hour** per user
- **Solution:** GitHub Apps (15k/hr org limits) OR direct CF Pages Upload API via `wrangler`

### 6. Google indexation (non-technical hard constraint) ⚠️
- Mass-generated sites trigger spam filters → manual-action risk
- **Mitigations:**
  - Unique content per page (no boilerplate, RAG against operator KB)
  - E-E-A-T signals: author bio, sources, last-updated, contact
  - Ramp-up curve: 50/week → 100/week → 500/week
  - IndexNow + Google Indexing API for faster pickup
  - Sample-based human review for quality
  - LLM-judge on factual consistency (RTPs, bonuses, licenses)

### 7. Compliance (iGaming-specific)
- KSA (NL), MGA, UKGC each have different rules
- Compliance regex + LLM-judge per GEO + immutable audit log
- GEO-blocking US/restricted markets via Cloudflare Workers
- Details: [[igaming-compliance-nl]] (forward ref)

### 8. Database
- Postgres handles billions of rows with date partitioning
- Read replicas for analytics
- Pgvector for embeddings, or Qdrant if >10M embeddings

## Cost model (50k pages/month)

| Item | Cost |
|---|---|
| LLM (Sonnet + Haiku + cache + batch) | ~$10k |
| SERP (DataForSEO) | $90 |
| Proxies (Bright Data residential) | $500-1500 |
| Compute (K8s workers) | $500 |
| Cloudflare (Pages Pro + Workers + R2) | $50 |
| DB (Neon Postgres + Redis) | $300 |
| Observability (Grafana Cloud + Sentry) | $200 |
| **Total** | **~$12-15k/month** |
| **Per page** | **$0.24-0.30** |

## Phased build plan

| Phase | Goal | Team | Duration | Build cost | Run cost |
|---|---|---|---|---|---|
| **0. Discovery** | Legal review, brand voice extraction, prompt experiments | 1 eng + 1 SEO | 1 wk | $0 | $0 |
| **1. MVP** | Sheets intake → SERP → 1 template → manual CF deploy; 1 site × 20 pages | 2 eng | 4 wk | $4k | $300/mo |
| **2. Production** | Temporal workflows, multi-stage LLM, QC linters, admin UI, regeneration; **1k pages/month** | 2-3 eng + 1 SEO | 6 wk | $25k | $2k/mo |
| **3. Scale-out** | K8s + KEDA, account sharding, cost routing, compliance gates; **50k pages/month** | 3 eng + 1 SRE | 8 wk | $50k | $12-15k/mo |
| **4. Optimisation** | Continuous — fine-tuning, embedding-based brief reuse, ML SERP delta | 2 eng | ongoing | — | gradual cost drop |

**Total to 50k pages/month:** ~5 months calendar time, ~$80k build cost.

## Tradeoffs

- **Multi-provider vs single-vendor:** OpenRouter enables failover across 5+ LLM providers at 1-2% markup on token cost. Worth it under rate-limit constraints.
- **Workers Sites vs CF Pages:** Workers Sites has no 1000-project cap but somewhat trickier CI. Pages with sharding is simpler to operate but requires job-balance across accounts.
- **Self-hosted Qdrant vs Pinecone:** self-hosting saves $200-2k/month but adds DevOps. Migration typically happens at ~10M embeddings.
- **Programmatic SEO risks:** aggressive scaling without quality guardrails → manual action. Trade-off between speed and safety: ramp-up curve is mandatory.

## Related

- [[content-generation-pipeline]] (forward ref) — LLM stages in detail
- [[seo-quality-control]] (forward ref) — QC layer
- [[cloudflare-deployment]] (forward ref) — deploy details
- [[igaming-compliance-nl]] (forward ref) — per-GEO compliance
- [[../entities/cloudflare-pages]] (forward ref), [[../entities/temporal]] (forward ref), [[../entities/openrouter]] (forward ref)
- [[../synthesis/task-1-answer]] (forward ref) — primary deliverable view
- [[../synthesis/architecture-overview]] — Task 1 diagram

## Sources

- [[../sources/kraken-leads-test-task]] — PDF question on system scaling
- Anthropic published rate limits (Tier-3 at writing time)
- DataForSEO pricing docs
- Cloudflare Pages account limits docs
