---
title: Competitor brand thief detection
category: concept
summary: Сигнали для виявлення сайту, що ranking-катає на бренді StarCasino, але монетизує трафік на користь конкурентних казино — найбільш загрозлива категорія
tags: [task2, classification, competitor-thief, signals, critical]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/concepts/competitor-thief-detection.md
---

# Competitor brand thief detection

## Definition
"Competitor brand thief" — сайт, що **ранжується на бренд-запиті** (тобто містить `starcasino` у title/H1/snippet щоб виграти SERP позицію), але **монетизує трафік на користь конкурентного казино**. Користувач шукає StarCasino, кликає, читає "огляд", натискає CTA — і потрапляє на JACKS.NL, BetCity, TonyBet, Unibet, або будь-яке інше казино з [[../entities/nl-competitor-casinos]].

## Why it matters
Це **найбільш загрозлива категорія** у branded SERP моніторингу. Кожен такий результат — це **втрачений конверт** для бренду + дохід конкуренту з украденого користувача. На відміну від affiliate (де commission повертається бренду), thief — це чисто витік ROI. Менеджер бренду має знати такі сайти негайно, щоб ініціювати DMCA / ad-buyout / SEO-conttermeasures.

## How we use it
Сайт класифікується як `competitor_brand_thief` якщо (з вагами в [[classifier-scoring]]):

1. **compLinkRatio ≥ 0.4** — щонайменше 40% outbound links ведуть на конкурентні казино з [[../entities/nl-competitor-casinos]]
2. **hasAffParamsToComp = true** — outbound links на конкурентів містять affiliate parameters (вони ж монетизують!)
3. **primaryCtaTarget = 'competitor'** — primary CTA після resolve → інше казино
4. **redirectsToComp = true** — `etld1(redirectFinalUrl)` ∈ COMPETITOR_CASINOS після resolve
5. **brandMentionsInText ≥ 3** — `/star\s*casino/gi` count у головному тексті ≥ 3 (показує що сайт **навмисно** ranking-катає на бренд)

**Список конкурентних казино (NL ринок):**
```ts
const COMPETITOR_CASINOS = new Set([
  'tonybet.nl', 'hollandcasino.nl', 'jacks.nl',
  'betcity.nl', 'unibet.nl', '711.nl', 'toto.nl',
  'circusonline.nl', 'hommerson.nl', 'jvh.nl',
  'leovegas.nl', 'kansino.nl', 'bingoal.nl',
]);
```

(Підтримується дин amically через [[../entities/nl-competitor-casinos]]; список потрібно оновлювати при нових KSA licence-holder'ах.)

## Tradeoffs

- **False positive ризик:** review сайт, що чесно порівнює StarCasino з конкурентами, але **сам не монетизує** (наприклад, журналістика). Mitigation: LLM signal перевіряє "is this site monetised for or against the brand" як sanity check.
- **False negative ризик:** thief, що ховається за obfuscated redirect chain через "neutral" intermediate domain. Mitigation: redirect resolution max 5 hops, 10s budget; кінцевий домен = вирішальний.
- **Dual-promote edge case:** сайт промує StarCasino **і** інших одночасно. Класифікуємо як `competitor_brand_thief` (weight +35 vs +25 для affiliate), бо часткова диверсія = шкода бренду. Argument в [[adr-008-dual-promote-tiebreak]].

## Поведінкові патерни (real-world)

- **"Best alternatives to X"** listicle, де X — бренд. Reviews коротко згадують X, далі focus на конкурентів з aff links.
- **Bonus-aggregator** сайти: "StarCasino bonus code" → сторінка, де StarCasino є, але "найкращі альтернативи" мають aff CTA.
- **PBN (Private Blog Network)** з SEO-stuffing на бренд, всі outbound links на одне казино (network operator).

## Related

- [[domain-classification]]
- [[affiliate-detection]] — протилежна категорія
- [[classifier-scoring]]
- [[adr-008-dual-promote-tiebreak]]
- [[../comparisons/affiliate-vs-brand-thief-signals]]
- [[../entities/nl-competitor-casinos]]
- [[../synthesis/task-2-answer]]

## Sources

- [[../sources/kraken-leads-test-task]] — Task 2 PDF (центральне питання)
