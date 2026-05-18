---
title: StarCasino (Netherlands)
category: entity
summary: Голландський лецензований онлайн-казино бренд, на якому Kraken Leads виконує SEO/affiliate робого; primary brand для Task 2 моніторингу
tags: [task2, brand, igaming, nl, ksa]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/entities/starcasino-nl.md
---

# StarCasino (Netherlands)

## What it is
Онлайн-казино бренд, що оперує в Нідерландах під ліцензією **KSA (Kansspelautoriteit)** — голландського регулятора азартних ігор, який видає ліцензії з 2021 у рамках Wet Kansspelen op Afstand (KOA Act). Domain: `starcasino.nl`.

## Why it matters
**Це бренд клієнта Task 2.** Усе у моніторинговій системі циклиться навколо: brand keyword tracking, домен-класифікація, дашборди. Без розуміння бренду (його ліцензії, юрисдикції, легальних обмежень) класифікатор не може правильно інтерпретувати сигнали.

## Key facts
- **Регулятор:** KSA (Kansspelautoriteit), Нідерланди — [[../concepts/igaming-compliance-nl]]
- **Domain:** `starcasino.nl` (primary); можливо `.com`/`.eu` redirects
- **Brand mentions to watch:** `starcasino`, `star casino`, `starcasino nl`, `starcasino bonus`, `starcasino review`, `starcasino login`, `starcasino app`
- **Affiliate tracking:** standard iGaming параметри — `btag`, `aff_id`, `partnerid` ([[../concepts/affiliate-detection]])
- **Конкуренти на ринку (NL):** [[nl-competitor-casinos]] — TonyBet, Holland Casino, JACKS.NL, BetCity, Unibet, 711.nl, Toto.nl та інші KSA-licensed
- **Regulatory constraints:** age 24+, compulsory responsible gambling messaging, no targeting on prohibited demographics

## Related
- [[nl-competitor-casinos]] — competitor brands в NL ринку
- [[../concepts/domain-classification]], [[../concepts/affiliate-detection]], [[../concepts/competitor-thief-detection]]
- [[../concepts/monitoring-cadence]]
- [[../concepts/igaming-compliance-nl]] (forward ref)
- [[../entities/kraken-leads]] (forward ref) — affiliate-company що працює з брендом

## Appears in
- [[../synthesis/task-2-answer]] — primary brand у Task 2
- [[../synthesis/architecture-overview]] — Layer 2 (Branded SERP Monitor)
- [[../sources/kraken-leads-test-task]] — згадано в PDF як приклад

## Open questions
- Чи є офіційні data sources про affiliate program (CPA structure, attribution window)? Це впливає на тонке налаштування `AFFILIATE_PARAMS` regex.
- Які локалізації — лише NL, чи є multi-language (NL + EN)? Впливає на стратегію SERP queries.
- Чи має StarCasino додаткові domains (regional, app store landing)? Для розширення official-detection.
