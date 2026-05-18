---
title: Affiliate site detection (→ StarCasino)
category: concept
summary: Сигнали для класифікації сайту як партнерського: outbound links на бренд-домен з affiliate-параметрами, primary CTA веде на бренд після resolve редіректів
tags: [task2, classification, affiliate, signals]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/concepts/affiliate-detection.md
---

# Affiliate site detection

## Definition
"Proper" affiliate — це сайт, що **монетизує брендований трафік на користь бренду**, отримуючи commission. Якщо користувач перейшов на сайт через запит `starcasino` і фінально приземлився на `starcasino.nl?btag=affiliate123` — це affiliate приніс трафік. Конверсія записується на партнерський tracking-параметр.

## Why it matters
Affiliate-каскад — це **бажаний** ринковий зразок: партнер виграє commission, бренд виграє legitimate brand-keyword traffic, користувач отримує informational layer (review, comparison, bonus details). Розрізнити "proper affiliate" від "competitor brand thief" критично, бо перші — союзники, другі — загроза.

## How we use it
Сайт класифікується як `affiliate` якщо виконані одночасно (з вагами в [[classifier-scoring]]):

1. **starLinkRatio ≥ 0.5** — більше половини outbound links з landing-сторінки ведуть на `starcasino.nl` (або інші бренд-домени)
2. **hasAffParamsToStar = true** — принаймні один link на бренд містить affiliate-параметр: `btag`, `aff_id`, `ref`, `partnerid`, `clickid`, `sub_id`, `utm_source=affiliate`
3. **primaryCtaTarget = 'star'** — primary CTA (зазвичай "Play Now" / "Spel nu") після click-resolve кінчається на `starcasino.nl`
4. **redirectsToStar = true** — `etld1(redirectFinalUrl) === 'starcasino.nl'` після resolving redirect chain (max 5 hops, 10s)

**Regex для detection affiliate parameters:**
```js
const AFFILIATE_PARAMS = /[?&](btag|aff_id|ref|partnerid|clickid|sub_id|trackid|p|partner)=/i;
const AFFILIATE_UTM = /utm_source=(affiliate|partner|aff)/i;
const AFFILIATE_NETWORKS = /(income-access|netrefer|affise|tonic|cake|hasoffers|partner\.|aff\.|track\.|go\.)/i;
```

**Класичний паттерн:** review-style контент про StarCasino → велика CTA-кнопка "Play at StarCasino" → resolve → `starcasino.nl/landing?btag=affilXYZ123`.

## Tradeoffs

- **False negative ризик:** affiliate без visible aff parameter (server-side cookie tracking + clean URLs) — рідкісно у iGaming, бо tracking зазвичай через URL. Mitigation: fallback на CTA target + brand link ratio.
- **False positive ризик:** легітимний content site (огляд індустрії), що випадково використовує `?ref=...` для своїх власних UTM. Mitigation: перевірка через LLM signal у edge cases.
- **Multi-brand affiliates:** сайт, що промує StarCasino **і** інші казино одночасно. Якщо StarCasino — primary CTA → affiliate; якщо інше казино — competitor brand thief (див. [[adr-008-dual-promote-tiebreak]]).

## Related

- [[domain-classification]]
- [[competitor-thief-detection]] — пряма протилежність
- [[classifier-scoring]]
- [[../comparisons/affiliate-vs-brand-thief-signals]]
- [[../entities/starcasino-nl]]
- [[../synthesis/task-2-answer]]

## Sources

- [[../sources/kraken-leads-test-task]] — Task 2 PDF question 3
- iGaming industry: standard affiliate-tracking params [[../entities/openrouter]]'у не потрібні; це industry knowledge
