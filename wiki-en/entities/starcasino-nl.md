---
title: StarCasino (Netherlands)
category: entity
summary: Dutch-licensed online casino brand that Kraken Leads supports with SEO/affiliate work; the primary brand for Task 2 monitoring
tags: [task2, brand, igaming, nl, ksa]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/entities/starcasino-nl.md
---

# StarCasino (Netherlands)

## What it is
Online casino brand operating in the Netherlands under a **KSA (Kansspelautoriteit)** licence — the Dutch gambling regulator that has been issuing licences since 2021 under the Wet Kansspelen op Afstand (KOA Act). Domain: `starcasino.nl`.

## Why it matters
**This is the client brand for Task 2.** Everything in the monitoring system orbits around it: brand keyword tracking, domain classification, dashboards. Without understanding the brand (its licence, jurisdiction, legal constraints) the classifier cannot correctly interpret signals.

## Key facts
- **Regulator:** KSA (Kansspelautoriteit), Netherlands — [[../concepts/igaming-compliance-nl]]
- **Domain:** `starcasino.nl` (primary); possibly `.com`/`.eu` redirects
- **Brand mentions to watch:** `starcasino`, `star casino`, `starcasino nl`, `starcasino bonus`, `starcasino review`, `starcasino login`, `starcasino app`
- **Affiliate tracking:** standard iGaming parameters — `btag`, `aff_id`, `partnerid` ([[../concepts/affiliate-detection]])
- **NL market competitors:** [[nl-competitor-casinos]] — TonyBet, Holland Casino, JACKS.NL, BetCity, Unibet, 711.nl, Toto.nl, and other KSA-licensed operators
- **Regulatory constraints:** 24+ age, compulsory responsible-gambling messaging, no targeting of prohibited demographics

## Related
- [[nl-competitor-casinos]] — competitor brands in the NL market
- [[../concepts/domain-classification]], [[../concepts/affiliate-detection]], [[../concepts/competitor-thief-detection]]
- [[../concepts/monitoring-cadence]]
- [[../concepts/igaming-compliance-nl]] (forward ref)
- [[../entities/kraken-leads]] (forward ref) — the affiliate company working with the brand

## Appears in
- [[../synthesis/task-2-answer]] — primary brand for Task 2
- [[../synthesis/architecture-overview]] — Layer 2 (Branded SERP Monitor)
- [[../sources/kraken-leads-test-task]] — mentioned in the PDF as an example

## Open questions
- Are there official data sources about the affiliate program (CPA structure, attribution window)? This affects the fine-tuning of the `AFFILIATE_PARAMS` regex.
- What localisations — NL only, or multi-language (NL + EN)? This shapes the SERP query strategy.
- Does StarCasino have additional domains (regional, app store landing)? Useful to extend official-detection.
