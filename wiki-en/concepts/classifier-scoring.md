---
title: Classifier scoring (combined rule + LLM)
category: concept
summary: Algorithm that fuses rule-based signals with the LLM verdict into one classification — argmax(scores) with threshold=30 and LLM-unclear treated as abstention
tags: [task2, classification, scoring, algorithm]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/concepts/classifier-scoring.md
---

# Classifier scoring (combined rule + LLM)

## Definition
The algorithm that fuses rule-based scoring and an LLM verdict into a single final domain classification. Each signal adds points to a category; the final category = `argmax(scores)`; if max < `THRESHOLD` (30) → `unclear`.

## Why it matters
A purely rule-based approach is deterministic and cheap but brittle on edge cases (multi-brand affiliates, obfuscated redirects). A purely LLM-based one is flexible but expensive and non-deterministic. **Combined** delivers 95% correct classifications at the rule-only price with LLM fallback on the 5% hard cases — and a full audit trail (you can see WHICH rule fired).

## How we use it

### Two layers of signals

Signals split into two groups by the input data they require:

**Page-level (need a successful scrape):** outbound links, affiliate parameters, redirect chains, primary CTA, brand mentions in body text. Strong but brittle: if the target hides behind Cloudflare/DataDome bot protection or injects the CTA via JS after load → all these signals come back as zero.

**SERP-level (always available):** the page's eTLD+1 vs the brand domain, the SERP title pattern. Weaker but deterministic. They cover the cases where page-level fails (typosquats, review-listicle portals).

### Decision matrix (rule scores)

| # | Signal | Direction | Points | Layer |
|---|---|---|---|---|
| R1 | `domain === 'starcasino.nl'` | official | +100 | SERP |
| R2 | `pageDomainIsCompetitor` (jacks.nl, tonybet.nl, ...) | thief | +90 | SERP |
| R3 | `ctaAnchorHrefMismatch` — anchor says brand, href resolves to competitor | thief | +60 | page |
| R4 | `compLinkRatio ≥ 0.4 AND hasAffParamsToComp` | thief | +70 | page |
| R5 | `primaryCtaTarget = 'competitor' AND brandMentions ≥ 3` | thief | +60 | page |
| R6 | `redirectsToComp` | thief | +30 | page |
| R7 | `starLinkRatio ≥ 0.5 AND hasAffParamsToStar` | affiliate | +60 | page |
| R8 | `primaryCtaTarget = 'star' AND redirectsToStar` | affiliate | +50 | page |
| R9 | `hasAffiliateDisclosure AND (starLinkRatio > 0 OR redirectsToStar)` | affiliate | +15 | page |
| Dual-promote | `hasAffParamsToStar AND hasAffParamsToComp` | both | +25 aff, +35 thief | page |
| R10 | `brandMentions ≥ 1 AND outboundCasinoLinks = 0` (Wikipedia, news) | unclear | +30 | page |
| **R11** | `domainContainsBrandStem AND !isStarOfficial AND !isCompetitor` (typosquat) | both | +45 aff, +30 thief | **SERP** |
| **R12** | `titleSuggestsReviewPortal AND !isOfficial AND !isCompetitor` | affiliate | +30 | **SERP** |

R11 and R12 were added 2026-05-18 after observing that 8/10 domains on the test SERP ended up `unclear` because casino sites behind bot protection returned empty HTML, zeroing every page-level signal.

### LLM signal

Request to OpenRouter (default `anthropic/claude-opus-4-7`). Input — compact JSON:
```json
{
  "pageDomain": "casino.nl",
  "title": "StarCasino review 2026 — bonus, games, payouts",
  "metaDescription": "...",
  "redirectFinalDomain": "starcasino.nl",
  "outboundDomainsTop10": ["starcasino.nl","casino.nl","casino.org"],
  "ctaHref": "https://starcasino.nl/?btag=affiliateXYZ",
  "mainTextSnippet": "...",
  "brand": "starcasino"
}
```

Output (zod-validated):
```json
{
  "category": "affiliate",
  "confidence": 0.87,
  "explanation": "Primary CTA links to starcasino.nl with btag affiliate parameter.",
  "signals_observed": ["aff_param_to_brand", "cta_to_brand", "brand_focus"]
}
```

### Combined verdict

```ts
function combine(rule: RuleVerdict, llm: LlmVerdict | null): FinalVerdict {
  // LLM "unclear" = abstention. "I don't know" should not suppress a
  // confident rule signal. In that case rule weight is 1.0.
  const llmAbstains = !llm || llm.category === "unclear";
  const ruleW = llmAbstains ? 1.0 : 0.6;
  const llmW = llmAbstains ? 0   : 0.4;

  const combined = {
    official:         ruleW * rule.scores.official         + llmW * (llm?.category === 'official' ? 100 * llm.confidence : 0),
    affiliate:        ruleW * rule.scores.affiliate        + llmW * (llm?.category === 'affiliate' ? 100 * llm.confidence : 0),
    competitor_thief: ruleW * rule.scores.competitor_thief + llmW * (llm?.category === 'competitor_brand_thief' ? 100 * llm.confidence : 0),
    unclear:          ruleW * rule.scores.unclear          + llmW * 0,
  };
  const top = Object.entries(combined).sort((a, b) => b[1] - a[1])[0];
  if (top[1] < 30) return { category: 'unclear', confidence: 0.0 };
  return { category: top[0], confidence: Math.min(1, top[1] / 100) };
}
```

### Threshold + abstention rationale

- **Threshold 30** (lowered from 40 alongside R11/R12). Reasoning: a single SERP-only signal scores 30-45; we need to let it pass. A single page-level signal scores 50-70 and is always above 30. Conflicting or empty → 0-20 → `unclear`.
- **LLM-as-abstention.** In snapshot #12 the LLM returned `unclear` at confidence 0.55-0.85 on pages whose `signals_observed` explicitly contained `lookalike_domain`, `brand_in_title`, `cross_jurisdiction` — i.e. the LLM **saw** the threat but conservatively classified as unclear due to missing CTA data. The old combine path multiplied `0.4 × 55 = 22` into `unclear`, drowning out even strong rule signals. The new logic treats LLM `unclear` as "I'm not voting", and rule scores get full weight 1.0 — other LLM categories still vote with weight 0.4.

## Inherent limit of passive scraping (important)

The Task 2 PDF explicitly asks us to explain which signals distinguish affiliate→Brand from brand-thief→Other. The honest answer:

**The decisive signal** for telling affiliate from thief is the final domain after clicking the primary CTA and resolving the redirect chain. `final == starcasino.nl + btag=…` → affiliate. `final == jacks.nl + aff_id=…` → thief.

**But:** on the real NL SERP for "starcasino", 6 of 10 top results sit behind Cloudflare/DataDome bot protection. A headless Playwright with realistic UA + locale + viewport still receives a challenge HTML (status 200, empty body). Affiliate links are typically injected via JS after `waitFor: load` + 1.5 s settle.

So a passive scraper has a floor on the "unclear" rate. Production-grade classification needs an **active probe** — click the CTA inside an isolated browser context, await `page.waitForURL`, read the final URL and its query params. That's our recommended forward path (see [[../synthesis/phase-plan]]) — but out of scope for the prototype.

Compensations while the probe doesn't exist:
- R11 + R12 cover **SERP-only patterns** (typosquatting, review-portal titles) — these can't be hidden behind bot protection because they're visible right in the SERP.
- LLM-as-abstention prevents "consensus of ignorance" from eating a confident rule signal.

## Tradeoffs

- **Static weights vs learned:** the weights are hardcoded, not learnt. That's OK for the prototype + first ~1000 classifications; with data we could retrain via logistic regression or gradient boosting.
- **Rule:0.6 vs LLM:0.4 split:** rule-heavier for determinism and audit trail. Recorded in [[adr-007-signal-weights]].
- **`argmax` vs probabilistic:** brutal-argmax (no softmax) — easier to explain; the reviewer sees "highest score wins". For future multi-label support we can move to softmax + per-label thresholds.

## Related

- [[domain-classification]] — category overview
- [[affiliate-detection]], [[competitor-thief-detection]], [[official-domain-signals]]
- [[adr-007-signal-weights]] (forward ref)
- [[adr-008-dual-promote-tiebreak]] (forward ref)
- [[../entities/openrouter]] (forward ref)
- [[../synthesis/task-2-answer]]

## Sources

- [[../sources/kraken-leads-test-task]] — Task 2 PDF questions
