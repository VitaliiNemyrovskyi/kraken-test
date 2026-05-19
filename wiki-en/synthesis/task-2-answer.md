---
title: Task 2 — answer to PDF questions
category: synthesis
summary: Sequential answer to Task 2 PDF questions — branded SERP monitoring concept for StarCasino (NL) with domain auto-classification and dashboards
tags: [task2, deliverable-view, starcasino, nl, classification]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/synthesis/task-2-answer.md
---

# Task 2 — answer to PDF questions

> **Brand:** StarCasino (Netherlands) • **Geo:** NL • **Primary prototype query:** `starcasino`, top-10 SERP
> **Source:** [[../sources/kraken-leads-test-task]] (question 2)
> **Architecture:** [[architecture-overview#Layer 2 — Task 2: Branded SERP Monitor (StarCasino NL)]]

Each answer — 2-3 sentences of direct reply + [[wikilinks]] to atomic pages for details.

---

## 1. How will domain type be auto-detected?

**Short:** A multi-layer classifier combines rule-based signals (60% weight) with LLM analysis (40%). For each domain from SERP the output is one of 4 categories (`official`, `affiliate`, `competitor_brand_thief`, `unclear`) with a confidence score.

**Details:** [[../concepts/domain-classification]] — overview of the three categories; [[../concepts/classifier-scoring]] — combined rule+LLM scoring matrix with weights and threshold.

---

## 2. Which signals will be used?

**Short:** 8 rule-based signals + an LLM verdict via OpenRouter:
- **Domain match** (for official)
- **Outbound link ratios** to the brand domain vs to competitor casinos
- **Affiliate parameters** in URLs (`btag`, `aff_id`, `ref`, `partnerid`, `clickid`, `sub_id`, `utm_source=affiliate`)
- **Redirect chain resolution** (max 5 hops, 10s budget) through affiliate networks (income-access, netrefer, affise)
- **Primary CTA destination** after resolution
- **Brand mention density** in text (TF-IDF)
- **Schema.org Organization/Brand markup**
- **WHOIS / SSL certificate org** (for official disambiguation)

**Details:** [[../concepts/official-domain-signals]], [[../concepts/affiliate-detection]], [[../concepts/competitor-thief-detection]]; [[../entities/nl-competitor-casinos]] — list (TonyBet, Holland Casino, JACKS.NL, BetCity, Unibet, 711.nl, Toto.nl).

---

## 3. How to distinguish affiliate (→ StarCasino) from competitor (→ other casino)?

**This is the key question of Task 2.** Decisive signal — **final destination of monetised links after redirect resolution**, NOT brand mention.

### 11 classifier signals (implemented in `prototype/`)

| # | Signal | Direction | Score |
|---|---|---|---|
| **R1** | `pageDomain === 'starcasino.nl'` | `official` | +100 |
| **R2** | `pageDomain ∈ COMPETITOR_CASINOS` (competitor's own site in SERP) | `thief` | +90 |
| **R3** | **Cloaking:** anchor text says "StarCasino", href → competitor | `thief` | +60 |
| **R4** | `compLinkRatio ≥ 0.4 AND hasAffParamsToComp` | `thief` | +70 |
| **R5** | `primaryCtaTarget='competitor' AND brandMentions ≥ 3` | `thief` | +60 |
| **R6** | `redirectsToComp` (CTA chain ends at competitor) | `thief` | +30 |
| **R7** | `starLinkRatio ≥ 0.5 AND hasAffParamsToStar` | `affiliate` | +60 |
| **R8** | `primaryCtaTarget='star' AND redirectsToStar` | `affiliate` | +50 |
| **R9** | Visible affiliate disclosure ("partnerlink"/"we earn") | `affiliate` | +15 |
| **R10** | Dual-promote (aff params on brand **and** competitor) | tiebreak | +25 aff / +35 thief |
| **R11** | Brand mention without monetisation (Wikipedia, news) | `unclear` | +30 |

### 6 patterns the classifier handles

1. **Proper affiliate** (review-style with aff params on CTA) → R7+R8+R9 → 1.00 confidence
2. **Alternatives listicle** ("StarCasino alternatives" with CTA to JACKS) → R4+R5+R6 → 1.00
3. **Bonus aggregator** (with a better competitor bonus) → R4+R5 → 1.00
4. **Cloaking** (anchor "StarCasino" → href competitor) → R3+R5+R6 → 1.00
5. **Direct competitor's site** (tonybet.nl itself ranking on brand query) → R2 → 0.90
6. **Informational** (Wikipedia) → R11 → unclear

**Dual-promote edge case** (site promotes both StarCasino and others): leans towards `competitor_brand_thief` (weight +35 vs +25 for affiliate). Recorded in [[../concepts/adr-008-dual-promote-tiebreak]].

**Anti-cloaking defence:** realistic User-Agent + Playwright JS execution + full redirect chain capture + LLM as sanity check (6-shot prompt).

**Full reference page:** [[../comparisons/affiliate-vs-brand-thief-signals]] — detailed breakdown of every signal, all 6 patterns, and false-negative risks.

---

## 4. Regular monitoring mechanism

**Short:** Daily cron-trigger; for top-priority brand queries — 4× per day. Each run produces an immutable snapshot. Changes between snapshots are detected via the `domain_history` table with a `category_changes` counter field.

- **Cadence:** daily for `starcasino`, `star casino`, `starcasino nl`; weekly for long-tail (`starcasino bonus`, `starcasino review`, `starcasino login`, etc.)
- **Storage:** append-only snapshots; never overwritten, only added. Enables time-series analysis.
- **Multi-geo support:** via config — NL primary, additional geos added without code changes

**Details:** [[../concepts/monitoring-cadence]], [[../concepts/drift-detection]].

---

## 5. Data storage

**Short:** PostgreSQL in production, SQLite in the prototype. 5 tables:

```sql
keywords         (id, query, geo, language, brand)
snapshots        (id, keyword_id, fetched_at, source)
serp_results     (id, snapshot_id, position, url, domain, title, snippet)
classifications  (id, result_id, category, confidence, rule_score_json,
                  llm_verdict_json, signals_json, classified_at)
domain_history   (domain, keyword_id, first_seen, last_seen,
                  last_category, category_changes)
```

Schema & index details: [[../concepts/storage-schema-task2]] (forward ref).

---

## 6. How are percentages and domain counts computed?

**Short:** Aggregation over the latest snapshot by `keyword_id` + `geo`. For each category: count + percentage (count / total × 100). For time-series — group by `taken_at::date`.

Example SQL:
```sql
SELECT category,
       COUNT(*) AS count,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
FROM classifications c
JOIN serp_results r ON r.id = c.result_id
JOIN snapshots s ON s.id = r.snapshot_id
WHERE s.id = (SELECT MAX(id) FROM snapshots WHERE keyword_id = ?)
GROUP BY category;
```

API endpoint: `GET /api/summary?keyword=starcasino&geo=nl` returns `{official: 1, affiliate: 4, competitor_brand_thief: 3, unclear: 2}` + percentages.

---

## 7. Dashboards

**Short:** Fastify server with Chart.js inline (no build step). 4 views:

1. **Latest distribution** — pie chart `official/affiliate/thief/unclear` for the most recent snapshot
2. **Time-series** — line chart of % per category over time (drift detection)
3. **Top domains per category** — table with expand for drill-down (signals + LLM explanation)
4. **Domain history** — for a specific domain: every snapshot it appeared in, its categories over time, total category-changes

**Details:** [[../concepts/dashboard-design]]; stack — [[../entities/fastify]] + React + Recharts (Chart.js in demo fixtures).

---

## 8. List of specific domains in each category

**Short:** API `GET /api/domains/:category?keyword=starcasino` returns the list of domains in a category from the most recent snapshot, ordered by SERP position. Each record: `{domain, url, position, confidence, explanation}`.

Expected results for top-10 NL on query `starcasino`:

| Category | Expected domains (examples) |
|---|---|
| `official` | `starcasino.nl` |
| `affiliate` | gambling-themed media sites driving traffic to starcasino with aff params (`casino.org`, `casino.nl`, partner networks) |
| `competitor_brand_thief` | review sites that rank on the StarCasino brand but the CTA points to JACKS.NL, BetCity, Unibet, etc. |
| `unclear` | general media (Wikipedia, news) without monetisation |

Exact list to come from a real SERP fetch in [[#9. Practical prototype|the prototype]].

---

## 9. Practical prototype (top-10 NL for `starcasino`)

**Short:** Node.js 20 + TypeScript strict + Fastify + Playwright + SQLite + OpenRouter. **Planned** after other priority work. Architecture fully described in [[architecture-overview#Layer 2 — Task 2: Branded SERP Monitor (StarCasino NL)]].

**Stack rationale:** [[../concepts/adr-005-stack-nodejs]]; [[../concepts/adr-006-storage-sqlite]] (single-process simplicity); [[../concepts/adr-007-signal-weights]] (rule 0.6 + LLM 0.4 rationale); [[../concepts/adr-008-dual-promote-tiebreak]] (competitor wins).

**CLI:**
- `npm run analyze` — real run (SerpAPI + Playwright + OpenRouter)
- `npm run analyze:mock` — fully offline on `data/mock-serp.json`
- `npm run dashboard` — Fastify at :3000

**Verification:**
- `starcasino.nl` → `official`, confidence > 0.9
- 2-3 sites → `affiliate` or `competitor_brand_thief` with explanatory signals JSON
- Dashboard renders pie + drill-down

---

## 10. Scaling

**Short:** Linear with the number of queries × geos × cadence.

- **N queries × M geos × 30 days** = N×M×30 snapshots/month
- DataForSEO replaces SerpAPI at scale (~$0.0006/SERP vs $0.005 for SerpAPI)
- LLM classification is cached per domain (TTL 7 days) — most domains are stable
- Worker pool via k8s/ECS + Redis queue replaces cron when throughput exceeds ~100 snapshots/min

**Details:** specific bottlenecks (Playwright RAM, AI rate limits, Cloudflare Pages caps) and mitigations are described inline in the prototype and in [[../concepts/classifier-scoring]].

---

## Related

- [[../sources/kraken-leads-test-task]] — original brief
- [[architecture-overview]] — diagrams
- [[../concepts/domain-classification]], [[../concepts/affiliate-detection]], [[../concepts/competitor-thief-detection]], [[../concepts/classifier-scoring]]
- [[../entities/starcasino-nl]]
- [[../comparisons/affiliate-vs-brand-thief-signals]]
