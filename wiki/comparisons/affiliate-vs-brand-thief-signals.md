---
title: Affiliate vs Competitor Brand Thief — повний перелік сигналів
category: comparison
summary: 11 сигналів класифікатора з вагами; розбір 6 реальних паттернів брендованої видачі; як відрізнити affiliate (веде на бренд) від competitor-brand-thief (краде трафік на конкурента)
tags: [task2, classification, signals, critical, deliverable]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/comparisons/affiliate-vs-brand-thief-signals.md
---

# Affiliate vs Competitor Brand Thief — сигнали

> Це primary документ-відповідь на питання PDF: **"які сигнали будуть використовуватися для визначення категорії сайту… яким чином система зможе автоматично відрізняти партнерський сайт, що веде на StarCasino, від сайту, який використовує бренд для перенаправлення користувачів на інші продукти"**.

## TL;DR — головний критерій

**Final domain of monetised links after redirect resolution.** Усе інше — це підтвердження або захист від обходу:

- **Proper affiliate:** redirect chain primary CTA закінчується на `starcasino.nl` з affiliate-параметром → бренд монетизує, affiliate отримує commission.
- **Competitor brand thief:** redirect chain закінчується на іншому KSA-licensed казино (TonyBet, JACKS, Holland Casino, BetCity, Unibet, …) з affiliate-параметром → конкурент монетизує, бренд **втрачає** клієнта.

Сторінка може 20 разів згадувати "StarCasino" у H1/title/body — якщо CTA веде на JACKS, **це thief**. І навпаки: сторінка може мати тільки 1 trackable посилання на бренд серед мінімального тексту — якщо це primary CTA з aff-param, **це affiliate**.

---

## 11 сигналів класифікатора з вагами

Реалізовано в [`prototype/src/classifier/{rules,scoring}.ts`](../../prototype/src/classifier/).

| # | Сигнал | Куди | Вага | Логіка |
|---|---|---|---|---|
| **R1** | `pageDomain === 'starcasino.nl'` | `official` | **+100** | Безапеляційно: домен — це бренд |
| **R2** | `pageDomain ∈ COMPETITOR_CASINOS` | `thief` | **+90** | Сам сайт конкурента ранжується на бренд-запит — пряма SEO-крадіжка слоту в SERP, без редиректів |
| **R3** | `ctaAnchorMentionsBrand AND redirectFinalDomain ∈ COMPETITOR` | `thief` | **+60** | **Cloaking**: текст CTA каже "Speel bij StarCasino", але href резольвиться на JACKS/TonyBet. Найпідступніший паттерн |
| **R4** | `compLinkRatio ≥ 0.4 AND hasAffParamsToComp` | `thief` | **+70** | Більшість outbound links — на конкурентів з aff-параметрами |
| **R5** | `primaryCtaTarget='competitor' AND brandMentions ≥ 3` | `thief` | **+60** | Сторінка SEO-stuffing на бренд, але primary CTA — на конкурента |
| **R6** | `redirectsToComp` (final domain — конкурент) | `thief` | **+30** | Резерв-сигнал; додає вагу до R3-R5 |
| **R7** | `starLinkRatio ≥ 0.5 AND hasAffParamsToStar` | `affiliate` | **+60** | Більшість outbound — на бренд з aff-params |
| **R8** | `primaryCtaTarget='star' AND redirectsToStar` | `affiliate` | **+50** | Primary CTA після redirect resolution приземляється на бренд |
| **R9** | `hasAffiliateDisclosure AND (starLinks > 0 OR redirectsToStar)` | `affiliate` | **+15** | Видимий disclosure ("partnerlink", "we earn commission", "in samenwerking met") + бренд-трафік = легітимний affiliate (EU consumer directive / FTC requirement) |
| **R10** | Dual-promote (aff params на бренд **і** на конкурента) | `+25 aff`, `+35 thief` | tiebreak | thief leans win (ADR-008): часткова диверсія = шкода бренду |
| **R11** | `brandMention ≥ 1 AND outboundCasinoLinks = 0` | `unclear` | **+30** | Інформаційна згадка без монетизації (Wikipedia, news) |

**Decision:** `argmax(combined_score)` де `combined = 0.6*rule + 0.4*llm` (або `rule*1.0` якщо LLM disabled). Якщо max < 40 → `unclear`. Деталі в [[../concepts/classifier-scoring]].

---

## 6 реальних паттернів — як їх ловимо

### Паттерн 1: Proper affiliate (review-style)

**Що це:** автентичний review StarCasino з CTA-кнопкою → starcasino.nl з btag-параметром.

**Приклад з mock:** `casino.nl` — "StarCasino review 2026 — bonus, spellen, uitbetalingen"
- 2 outbound links, обидва на `starcasino.nl`, обидва з aff-параметрами (`btag=cas-nl-12345`, `aff_id=cas-nl`)
- Primary CTA: "Speel bij StarCasino" → `starcasino.nl/?btag=cas-nl-12345`
- Disclosure: "Disclosure: dit is een affiliate review — we earn commission"

**Сигнали які спрацьовують:** R7 (+60), R8 (+50), R9 (+15) → affiliate score = 125 → confidence 1.00.

### Паттерн 2: Alternatives listicle (classic thief)

**Що це:** "StarCasino alternatieven" — стаття, що згадує бренд тільки в title для ranking, а всі CTA — на конкурентів з aff-параметрами.

**Приклад з mock:** `bestecasinos.nl` — "StarCasino alternatieven — 5 beste casino's"
- 3 outbound на JACKS / BetCity / Holland Casino, всі з aff-параметрами
- Primary CTA: "Speel bij JACKS" → `jacks.nl?aff_id=bc-jck-002`
- Brand mention тільки в title

**Сигнали:** R4 (+70), R5 (+60), R6 (+30) → thief score = 160 → confidence 1.00.

### Паттерн 3: Bonus aggregator with competitor focus (thief)

**Що це:** сайт-агрегатор бонусів, що згадує StarCasino, але primary CTA — на конкурента з кращим бонусом.

**Приклад з mock:** `casinoz.nl` — "StarCasino bonuscode 2026 — €100 welkomstbonus"
- 4 outbound: 3 з aff-params на Unibet/Toto/711, 1 на starcasino.nl без params
- Primary CTA: "Unibet €200" → `unibet.nl?btag=cz-u-01`
- Brand mention висока — "StarCasino" 4+ рази в тексті

**Сигнали:** R4 (+70), R5 (+60) → thief score = 130 → confidence 1.00.

### Паттерн 4: Cloaking (anchor / href mismatch) ⚠️

**Що це:** anchor text CTA каже "Speel bij StarCasino" — користувач думає, що йде на бренд. Але href резольвиться на TonyBet. Користувач помічає підступ лише після переходу.

**Приклад з mock:** `shadyreview.nl` — "StarCasino ervaringen 2026"
- Primary CTA anchor: **"Speel nu bij StarCasino →"**
- Primary CTA href: `go.shadyreview.nl/r?id=star` → redirect chain → `tonybet.nl?aff_id=shady-555`
- 4 brand mentions у тексті

**Сигнали:** R3 (+60), R5 (+60), R6 (+30) → thief score = 150 → confidence 1.00.

> **Це найважливіша edge-case** — ловить deceptive UX, який інший класифікатор пропустив би (anchor → brand, all rule signals would point affiliate). Decisive: **redirect chain ending**, не текст.

### Паттерн 5: Direct competitor's own site (domain theft)

**Що це:** сайт конкурента (наприклад, `tonybet.nl`) сам ранжується на запит `starcasino`. Жодних outbound links, жодних редиректів — просто SEO-stuffing на бренд щоб виграти SERP-слот.

**Приклад з mock:** `tonybet.nl` ранжується на "starcasino"
- pageDomain = tonybet.nl ∈ COMPETITOR_CASINOS
- Outbound — всі внутрішні
- Жодного редиректу, жодного aff-параметра

**Сигнали:** R2 (+90) → thief score = 90 → confidence 0.90.

> Інші класифікатори тут провалюються — outbound link analysis показує "нічого підозрілого". Але **домен сам по собі — це загроза**.

### Паттерн 6: Informational (unclear)

**Що це:** Wikipedia, news article, регуляторна стаття — згадує бренд без монетизації.

**Приклад з mock:** `nl.wikipedia.org/wiki/StarCasino`
- 2 outbound: kansspelautoriteit.nl, starcasino.nl — без aff-params
- Жодного primary CTA
- Brand mentioned in encyclopedic context

**Сигнали:** R11 (+30) — нижче порогу 40 → `unclear` confidence 0.00.

---

## Що НЕ спрацьовує (false-negative ризики)

| Сценарій | Чому пропускаємо | Mitigation |
|---|---|---|
| Affiliate без aff-параметра (server-side cookie attribution) | R7/R8 потребують aff-params | LLM (Layer 4) може зловити через intent. У production — sync з brand affiliate platform |
| Multi-brand affiliate (StarCasino + 5 інших, всі з aff) | Dual-promote → thief за замовчуванням | ADR-008: thief leans win — це навмисно, навіть часткова диверсія = шкода бренду |
| Заблокований scraper / 404 / parked domain | Scrape fail → unclear | Log + retry; LLM на SERP snippet only |
| Brand spelling variants ("st@rcasino", typo) | Regex `/star\s*casino/gi` не ловить | LLM (Layer 4) ловить semantic match |

---

## Анти-cloaking захист (deeper dive)

Cloaking — це коли сайт показує різний контент різним user-agents. Захист:

1. **Realistic User-Agent + locale.** Playwright емулює `KrakenLeads-Monitor/0.1` з NL locale. Якщо сайт серверує різний HTML — це red flag.
2. **JavaScript-rendered redirects.** Playwright виконує JS, тож redirects через `window.location = ...` ловляться.
3. **Anchor/href mismatch** (R3) — якщо anchor text каже "StarCasino" але href резольвиться на конкурента, це cloaking patтерн навіть без JS.
4. **Redirect chain capture** — фіксуємо hops + intermediate domains. Chain >2 hops через unknown shortener (e.g. `go.shadyreview.nl`) → підозріло.
5. **LLM як sanity check** — структурований prompt з few-shot examples (Layer 4 backup).

---

## Як це працює end-to-end

```
SERP fetch (SerpAPI) → top-10 URLs

  For each URL:
    Playwright scrape page (JS-rendered HTML)
    Extract outbound links + primary CTA + main text
    Resolve redirect chain on CTA (HEAD-follow up to 5 hops, 10s budget)
    Detect: anchor text, affiliate disclosure, brand mentions

  For each scraped page:
    Run rules.ts:extractSignals → 15 signals
    Run scoring.ts:scoreSignals → 4 category scores (R1-R11)
    Run classifier/llm.ts:classifyWithLlm → LLM verdict (4-shot examples, JSON output)
    combineWithLlm → argmax(combined_score), threshold 40

  Persist snapshot → SQLite
  Update domain_history.category_changes (для drift detection)
```

---

## Related

- [[../concepts/classifier-scoring]] — повна decision matrix + threshold rationale
- [[../concepts/affiliate-detection]] — деталі сигналів affiliate
- [[../concepts/competitor-thief-detection]] — деталі сигналів thief
- [[../concepts/adr-008-dual-promote-tiebreak]] (forward ref) — чому thief leans win
- [[../entities/nl-competitor-casinos]] (forward ref) — поточний список конкурентів
- [[../synthesis/task-2-answer]] — primary deliverable view

## Sources

- [[../sources/kraken-leads-test-task]] — PDF Task 2 ("сигнали для визначення категорії сайту")
- Реалізація: [`prototype/src/classifier/`](../../prototype/src/classifier/)
- Mock fixture з 6-ма паттернами: [`prototype/data/mock-serp.json`](../../prototype/data/mock-serp.json)
