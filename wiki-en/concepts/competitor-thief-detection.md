---
title: Competitor brand thief detection
category: concept
summary: Signals to detect a site that ranks on the StarCasino brand but monetises traffic for competitor casinos — the most threatening category
tags: [task2, classification, competitor-thief, signals, critical]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/concepts/competitor-thief-detection.md
---

# Competitor brand thief detection

## Definition
A "competitor brand thief" is a site that **ranks on the brand query** (i.e. contains `starcasino` in title/H1/snippet to win the SERP slot) but **monetises traffic for a competitor casino**. The user searches for StarCasino, clicks, reads a "review", clicks the CTA — and lands on JACKS.NL, BetCity, TonyBet, Unibet, or any other casino from [[../entities/nl-competitor-casinos]].

## Why it matters
This is the **most threatening category** in branded SERP monitoring. Every such result is a **lost conversion** for the brand + revenue for the competitor on a stolen user. Unlike affiliate (where the commission flows back to the brand), thief is pure ROI leakage. A brand manager must surface such sites immediately to trigger DMCA / ad-buyout / SEO countermeasures.

## How we use it
A site is classified as `competitor_brand_thief` when (weighted in [[classifier-scoring]]):

1. **compLinkRatio ≥ 0.4** — at least 40% of outbound links point to competitor casinos from [[../entities/nl-competitor-casinos]]
2. **hasAffParamsToComp = true** — outbound links to competitors carry affiliate parameters (that's how they monetise!)
3. **primaryCtaTarget = 'competitor'** — primary CTA after resolve → other casino
4. **redirectsToComp = true** — `etld1(redirectFinalUrl)` ∈ COMPETITOR_CASINOS after resolve
5. **brandMentionsInText ≥ 3** — `/star\s*casino/gi` count in main text ≥ 3 (proves the site **deliberately** ranks on the brand)

**Competitor casino list (NL market):**
```ts
const COMPETITOR_CASINOS = new Set([
  'tonybet.nl', 'hollandcasino.nl', 'jacks.nl',
  'betcity.nl', 'unibet.nl', '711.nl', 'toto.nl',
  'circusonline.nl', 'hommerson.nl', 'jvh.nl',
  'leovegas.nl', 'kansino.nl', 'bingoal.nl',
]);
```

(Maintained dynamically through [[../entities/nl-competitor-casinos]]; list must be updated as new KSA licence-holders launch.)

## Tradeoffs

- **False positive risk:** a review site that honestly compares StarCasino vs competitors but **doesn't monetise itself** (e.g. journalism). Mitigation: LLM signal checks "is this site monetised for or against the brand" as a sanity check.
- **False negative risk:** a thief hiding behind an obfuscated redirect chain through a "neutral" intermediate domain. Mitigation: redirect resolution max 5 hops, 10s budget; final domain is the deciding factor.
- **Dual-promote edge case:** a site promotes StarCasino **and** competitors simultaneously. We classify it as `competitor_brand_thief` (weight +35 vs +25 for affiliate), because even partial diversion is brand damage. Argument in [[adr-008-dual-promote-tiebreak]].

## Real-world behavioural patterns

- **"Best alternatives to X"** listicles, where X is the brand. Reviews briefly mention X, then focus on competitors with aff links.
- **Bonus-aggregator** sites: "StarCasino bonus code" → page where StarCasino is listed but "best alternatives" carry aff CTAs.
- **PBN (Private Blog Network)** with SEO-stuffing on the brand, all outbound links to one casino (network operator).

## Related

- [[domain-classification]]
- [[affiliate-detection]] — the opposite category
- [[classifier-scoring]]
- [[adr-008-dual-promote-tiebreak]]
- [[../comparisons/affiliate-vs-brand-thief-signals]]
- [[../entities/nl-competitor-casinos]]
- [[../synthesis/task-2-answer]]

## Sources

- [[../sources/kraken-leads-test-task]] — Task 2 PDF (the central question)
