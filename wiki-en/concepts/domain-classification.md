---
title: Domain classification (StarCasino branded SERP)
category: concept
summary: Splits domains from a branded SERP into 4 categories (official / affiliate / competitor brand thief / unclear) based on combined rule+LLM scoring
tags: [task2, classification, overview, igaming]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/concepts/domain-classification.md
---

# Domain classification

## Definition
The process of automatically assigning a category to every domain in the top-10 SERP for a branded query. Four categories: `official` (the brand itself), `affiliate` (partner site driving traffic to the brand), `competitor_brand_thief` (site that uses the brand to redirect to a competitor), `unclear` (insufficient signals).

## Why it matters
Without classification the top-10 of a branded SERP is just a list of URLs. With it — it's actionable intelligence: you see how much traffic the brand gets directly, how much through partners, and how much a **competitor steals** via the brand query. The last scenario is a direct threat that calls for either DMCA, repressive SEO measures, or buying ads on the brand.

## How we use it
Class = `argmax(combined_score)` where `combined_score = 0.6 * rule_score + 0.4 * llm_score` (see [[classifier-scoring]]). If max < 40 → `unclear`.

**Pipeline:**
1. SERP fetch (top-10 for query+geo)
2. Per result: scrape page (outbound links, redirects, CTA destination)
3. Rule signals: 8 rules (domain match, outbound ratios, affiliate params, redirect chains, CTA target)
4. LLM signal: structured JSON output from Claude via OpenRouter
5. Combine + decide
6. Persist to `classifications` + update `domain_history`

**Categories with examples:**

| Category | Looks like | Example |
|---|---|---|
| `official` | The brand itself or its redirect | `starcasino.nl` |
| `affiliate` | StarCasino review with CTA `→ starcasino.nl?btag=...` | Partner media site |
| `competitor_brand_thief` | Page about "StarCasino", but CTA → other casino | "StarCasino alternatives" listicle with CTA to JACKS.NL |
| `unclear` | Brand mention without monetisation | Wikipedia, news article |

## Tradeoffs

- **4 categories, not more:** Adding granularity (e.g. splitting affiliate into "exclusive" vs "multi-brand") increases complexity without actionable value for the first version.
- **Rule-heavy (60%):** LLM is used for edge cases, not as the primary decision-maker. Cheaper and more deterministic; an LLM-only approach would cost 5-10× more for similar results.
- **No human-in-the-loop by default:** auto-classification automates, doesn't replace manual review. A reviewer flag for `confidence < 0.7` is in the backlog.

## Related

- [[classifier-scoring]] — combined scoring matrix with weights
- [[official-domain-signals]], [[affiliate-detection]], [[competitor-thief-detection]] — per-category details
- [[../comparisons/affiliate-vs-brand-thief-signals]] — the critical distinction
- [[../entities/starcasino-nl]], [[../entities/nl-competitor-casinos]]
- [[../synthesis/task-2-answer]]

## Sources

- [[../sources/kraken-leads-test-task]] — Task 2 PDF questions
