---
title: Affiliate site detection (→ StarCasino)
category: concept
summary: Signals to classify a site as a proper affiliate — outbound links to the brand domain with affiliate parameters, primary CTA resolving to the brand
tags: [task2, classification, affiliate, signals]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/concepts/affiliate-detection.md
---

# Affiliate site detection

## Definition
A "proper" affiliate is a site that **monetises branded traffic in the brand's favour**, earning a commission. If a user navigated through a `starcasino` query and finally landed on `starcasino.nl?btag=affiliate123` — the affiliate brought the traffic. The conversion is recorded on the partner's tracking parameter.

## Why it matters
The affiliate cascade is a **desirable** market pattern: the partner wins commission, the brand wins legitimate brand-keyword traffic, and the user gets an informational layer (review, comparison, bonus details). Telling a "proper affiliate" apart from a "competitor brand thief" is critical, because the former are allies and the latter are threats.

## How we use it
A site is classified as `affiliate` when these conditions co-occur (weighted in [[classifier-scoring]]):

1. **starLinkRatio ≥ 0.5** — more than half the outbound links from the landing page point to `starcasino.nl` (or other brand domains)
2. **hasAffParamsToStar = true** — at least one brand link contains an affiliate parameter: `btag`, `aff_id`, `ref`, `partnerid`, `clickid`, `sub_id`, `utm_source=affiliate`
3. **primaryCtaTarget = 'star'** — the primary CTA (typically "Play Now" / "Spel nu") after click-resolve ends at `starcasino.nl`
4. **redirectsToStar = true** — `etld1(redirectFinalUrl) === 'starcasino.nl'` after resolving the redirect chain (max 5 hops, 10s)

**Regex for affiliate parameter detection:**
```js
const AFFILIATE_PARAMS = /[?&](btag|aff_id|ref|partnerid|clickid|sub_id|trackid|p|partner)=/i;
const AFFILIATE_UTM = /utm_source=(affiliate|partner|aff)/i;
const AFFILIATE_NETWORKS = /(income-access|netrefer|affise|tonic|cake|hasoffers|partner\.|aff\.|track\.|go\.)/i;
```

**Canonical pattern:** review-style content about StarCasino → a large CTA button "Play at StarCasino" → resolve → `starcasino.nl/landing?btag=affilXYZ123`.

## Tradeoffs

- **False negative risk:** an affiliate with no visible aff parameter (server-side cookie tracking + clean URLs) — rare in iGaming, since tracking is usually URL-based. Mitigation: fall back on CTA target + brand link ratio.
- **False positive risk:** a legitimate content site (industry review) that incidentally uses `?ref=...` for its own UTMs. Mitigation: LLM signal arbitrates edge cases.
- **Multi-brand affiliates:** a site that promotes StarCasino **alongside** other casinos. If StarCasino is the primary CTA → affiliate; if another casino is the primary CTA → competitor brand thief (see [[adr-008-dual-promote-tiebreak]]).

## Related

- [[domain-classification]]
- [[competitor-thief-detection]] — the direct opposite
- [[classifier-scoring]]
- [[../comparisons/affiliate-vs-brand-thief-signals]]
- [[../entities/starcasino-nl]]
- [[../synthesis/task-2-answer]]

## Sources

- [[../sources/kraken-leads-test-task]] — Task 2 PDF question 3
