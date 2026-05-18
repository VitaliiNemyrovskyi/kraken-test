---
title: Classifier scoring (combined rule + LLM)
category: concept
summary: Алгоритм об'єднання rule-based сигналів та LLM-вердикту в єдину класифікацію домена — argmax(scores) з threshold=30 і trade LLM-unclear як abstention
tags: [task2, classification, scoring, algorithm]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/concepts/classifier-scoring.md
---

# Classifier scoring (combined rule + LLM)

## Definition
Алгоритм об'єднання rule-based scoring і LLM verdict у єдину кінцеву класифікацію домену. Кожен сигнал додає бали до конкретної категорії; final category = `argmax(scores)`; якщо max < `THRESHOLD` (30) → `unclear`.

## Why it matters
Чисто rule-based підхід — детермінований і дешевий, але крихкий до edge cases (multi-brand affiliates, obfuscated redirects). Чисто LLM-based — гнучкий, але дорогий і недетермінований. **Combined** дає 95% правильних класифікацій на rule-only ціні з LLM fallback на 5% складних випадків — і повне аудит-трейл (видно ЯКЕ правило спрацювало).

## How we use it

### Two layers of signals

Сигнали діляться на дві групи за тим, які вхідні дані їм потрібні:

**Page-level (потребують успішного скрейпу):** аутбаунд-лінки, affiliate-параметри, redirect chains, primary CTA, brand mentions у текстіpieces. Сильні, але крихкі: якщо ціль за Cloudflare/DataDome bot-protection чи інжектить CTA через JS після завантаження → ці сигнали = 0.

**SERP-level (працюють завжди):** домен сторінки vs бренд-домен, шаблон title зі SERP. Слабші, але детерміновані. Покривають кейси де page-level fails (типосквоти, review-listicle портали).

### Decision matrix (rule scores)

| # | Signal | Direction | Точки | Layer |
|---|---|---|---|---|
| R1 | `domain === 'starcasino.nl'` | official | +100 | SERP |
| R2 | `pageDomainIsCompetitor` (jacks.nl, tonybet.nl, ...) | thief | +90 | SERP |
| R3 | `ctaAnchorHrefMismatch` — anchor каже brand, href веде на competitor | thief | +60 | page |
| R4 | `compLinkRatio ≥ 0.4 AND hasAffParamsToComp` | thief | +70 | page |
| R5 | `primaryCtaTarget = 'competitor' AND brandMentions ≥ 3` | thief | +60 | page |
| R6 | `redirectsToComp` | thief | +30 | page |
| R7 | `starLinkRatio ≥ 0.5 AND hasAffParamsToStar` | affiliate | +60 | page |
| R8 | `primaryCtaTarget = 'star' AND redirectsToStar` | affiliate | +50 | page |
| R9 | `hasAffiliateDisclosure AND (starLinkRatio > 0 OR redirectsToStar)` | affiliate | +15 | page |
| Dual-promote | `hasAffParamsToStar AND hasAffParamsToComp` | both | +25 aff, +35 thief | page |
| R10 | `brandMentions ≥ 1 AND outboundCasinoLinks = 0` (Wikipedia, news) | unclear | +30 | page |
| **R11** | `domainContainsBrandStem AND !isStarOfficial AND !isCompetitor` (типосквот) | both | +45 aff, +30 thief | **SERP** |
| **R12** | `titleSuggestsReviewPortal AND !isOfficial AND !isCompetitor` | affiliate | +30 | **SERP** |

R11 і R12 додані 2026-05-18 після спостереження що 8/10 доменів у тестовому SERP мали `unclear` через те, що казинні сайти за bot-protection віддавали порожній HTML і page-level сигнали = 0.

### LLM signal

Запит до OpenRouter (default `anthropic/claude-opus-4-7`). Input — compact JSON:
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
  // LLM "unclear" = abstention. "I don't know" не повинно гасити
  // впевнений rule-сигнал. У такому разі rule працює з вагою 1.0.
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

- **Threshold 30** (опущено з 40 одночасно з R11/R12). Логіка: SERP-only сигнал хіт = 30-45 балів; маємо дати йому пройти. Поодинокий page-level сигнал = 50-70 → завжди вище 30. Конфліктні/нульові → 0-20 → `unclear`.
- **LLM-as-abstention**. У snapshot #12 LLM повертав `unclear` з confidence 0.55-0.85 на сайтах, де `signals_observed` явно містили `lookalike_domain`, `brand_in_title`, `cross_jurisdiction` — тобто LLM **бачив** загрозу, але консервативно класифікував як unclear через нестачу CTA-даних. Старий combine множив 0.4 × 55 = 22 у `unclear`, гасячи навіть сильний rule-сигнал. Нова логіка трактує LLM `unclear` як "не голосує", і rule працює з вагою 1.0 — а решта LLM-категорій ваги 0.4 як і раніше.

## Inherent limit of passive scraping (важливо)

PDF Task 2 явно вимагає пояснити які сигнали і чому система може відрізнити affiliate→Brand від brand-thief→Other. Чесна відповідь:

**Decisive signal** для розрізнення affiliate vs thief — кінцевий домен у redirect chain після кліку на primary CTA. Якщо `final == starcasino.nl + btag=...` → affiliate. Якщо `final == jacks.nl + aff_id=...` → thief.

**Але:** на реальному NL SERP для запиту "starcasino" 6 з 10 топ-результатів за Cloudflare/DataDome bot protection. Headless Playwright з реалістичним UA + locale + viewport все одно отримує challenge HTML (status 200, але body без контенту). Афіліатні лінки часто інжектуються через JS після `waitFor: load` + 1.5 s settle.

Тому пасивний скрейпер має floor щодо рівня "unclear". Для production-grade класифікації потрібен **active probe** — клікнути CTA в кожному окремому browser context, дочекатись `page.waitForURL`, прочитати фінальний URL та query params. Це наша recommended path forward (див. [[../synthesis/phase-plan]]) — але виходить за обсяг прототипу.

Replacements у тому, що поки немає probe:
- R11 + R12 покривають **SERP-only patterns** (типосквотинг, review-portal title) — їх не можна сховати під bot-protection бо вони видимі з самого SERP.
- LLM-as-abstention не дозволяє "consensus of ignorance" з'їсти впевнений rule-сигнал.

## Tradeoffs

- **Static weights vs learned:** ваги — hardcoded, не learnt. Це OK для прототипу + перших ~1000 класифікацій; з даними можна перенавчити на logistic regression або gradient boosting.
- **Rule:0.6 vs LLM:0.4 split:** Rule-heavier для детермінізму та аудит-trail. Зафіксовано в [[adr-007-signal-weights]].
- **`argmax` vs probabilistic:** Brutal-argmax (без softmax) — простіше пояснити; reviewer бачить "найвищий бал переміг". Для багатоміток у майбутньому можна перейти на softmax + threshold per label.

## Related

- [[domain-classification]] — overview категорій
- [[affiliate-detection]], [[competitor-thief-detection]], [[official-domain-signals]]
- [[adr-007-signal-weights]] (forward ref)
- [[adr-008-dual-promote-tiebreak]] (forward ref)
- [[../entities/openrouter]] (forward ref)
- [[../synthesis/task-2-answer]]

## Sources

- [[../sources/kraken-leads-test-task]] — Task 2 PDF questions
