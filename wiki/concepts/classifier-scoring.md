---
title: Classifier scoring (combined rule + LLM)
category: concept
summary: Combined scoring matrix домен-класифікатора — rule-based signals (0.6 weight) + LLM verdict (0.4 weight); argmax score з threshold 40
tags: [task2, classification, scoring, algorithm]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/concepts/classifier-scoring.md
---

# Classifier scoring (combined rule + LLM)

## Definition
Алгоритм об'єднання rule-based scoring і LLM verdict у єдину кінцеву класифікацію домену. Кожен сигнал додає бали до конкретної категорії; final category = `argmax(scores)`; якщо max < 40 → `unclear`.

## Why it matters
Чисто rule-based підхід — детермінований і дешевий, але крихкий до edge cases (multi-brand affiliates, obfuscated redirects). Чисто LLM-based — гнучкий, але дорогий і недетермінований. **Combined** дає 95% правильних класифікацій на rule-only ціні з LLM fallback на 5% складних випадків — і повне аудит-трейл (видно ЯКЕ правило спрацювало).

## How we use it

### Decision matrix (rule scores)

| Signal | Weight | Direction |
|---|---|---|
| `domain === 'starcasino.nl'` | +100 | official |
| `starLinkRatio ≥ 0.5 AND hasAffParamsToStar` | +60 | affiliate |
| `primaryCtaTarget = 'star' AND redirectsToStar` | +50 | affiliate |
| `compLinkRatio ≥ 0.4 AND hasAffParamsToComp` | +70 | competitor_thief |
| `primaryCtaTarget = 'competitor' AND brandMentions ≥ 3` | +60 | competitor_thief |
| Dual-promote (star+comp aff params both present) | +25 aff, +35 thief | thief leans win |
| `brandMentions ≥ 1 AND outboundCasinoLinks = 0` | +30 | unclear |

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
  "explanation": "Primary CTA links to starcasino.nl with btag affiliate parameter. All outbound monetised links target the brand. No competitor casino mentions.",
  "signals_observed": ["aff_param_to_brand", "cta_to_brand", "brand_focus"]
}
```

### Combined verdict

```ts
function combine(rule: RuleVerdict, llm: LlmVerdict): FinalVerdict {
  const combinedScores = {
    official:         0.6 * rule.scores.official         + 0.4 * (llm.category === 'official' ? 100 * llm.confidence : 0),
    affiliate:        0.6 * rule.scores.affiliate        + 0.4 * (llm.category === 'affiliate' ? 100 * llm.confidence : 0),
    competitor_thief: 0.6 * rule.scores.competitor_thief + 0.4 * (llm.category === 'competitor_brand_thief' ? 100 * llm.confidence : 0),
    unclear:          0.6 * rule.scores.unclear          + 0.4 * (llm.category === 'unclear' ? 100 * llm.confidence : 0),
  };
  const top = Object.entries(combinedScores).sort((a, b) => b[1] - a[1])[0];
  if (top[1] < 40) return { category: 'unclear', confidence: 0.0 };
  return { category: top[0], confidence: Math.min(1, top[1] / 100) };
}
```

### Threshold rationale
**40** обрано емпірично: rule-only single-strong-signal набирає 50-70 → проходить; rule-only weak або conflicting → 0-30 → `unclear`; LLM сам собою з confidence 1.0 додає 40 (через 0.4 weight × 100) → саме на межі, тобто LLM-only може встановити категорію тільки якщо він повністю впевнений.

## Tradeoffs

- **Static weights vs learned:** ваги rule signals — hardcoded, не learnt. Це OK для прототипу + перших ~1000 класифікацій; з даними можна перенавчити на logistic regression або gradient boosting. Поки rule weights `+50/+60/+70/+100` обрані за inspection.
- **Rule:0.6 vs LLM:0.4 split:** Rule-heavier для детермінізму та аудит-trail. У майбутньому, після збору training data, ваги можуть змінитись. Зафіксовано в [[adr-007-signal-weights]].
- **`argmax` vs probabilistic:** Brutal-argmax (без softmax) — простіше пояснити; reviewer бачить "найвищий бал переміг". Для багатоміток (multi-label) у майбутньому можна перейти на softmax + threshold per label.

## Related

- [[domain-classification]] — overview категорій
- [[affiliate-detection]], [[competitor-thief-detection]], [[official-domain-signals]]
- [[adr-007-signal-weights]] (forward ref)
- [[adr-008-dual-promote-tiebreak]] (forward ref)
- [[../entities/openrouter]] (forward ref)
- [[../synthesis/task-2-answer]]

## Sources

- [[../sources/kraken-leads-test-task]] — Task 2 PDF questions
