---
title: Domain classification (StarCasino branded SERP)
category: concept
summary: Розподіл доменів з брендованої SERP на 4 категорії (official / affiliate / competitor brand thief / unclear) на основі combined rule+LLM scoring
tags: [task2, classification, overview, igaming]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/concepts/domain-classification.md
---

# Domain classification

## Definition
Процес автоматичного присвоєння категорії кожному домену з топ-10 SERP за брендованим запитом. Чотири категорії: `official` (сам бренд), `affiliate` (партнерський сайт, що веде трафік на бренд), `competitor_brand_thief` (сайт, що використовує бренд для перенаправлення на конкурента), `unclear` (недостатньо сигналів).

## Why it matters
Без класифікації топ-10 brand-видачі — це просто список URL. З нею — це actionable intelligence: видно скільки трафіку отримує бренд напряму, скільки через партнерів, і скільки **краде** конкурент через бренд-запит. Останній сценарій — пряма загроза, що вимагає або DMCA, або репресивних SEO заходів, або купівлі реклами на бренд.

## How we use it
Class = `argmax(combined_score)` де `combined_score = 0.6 * rule_score + 0.4 * llm_score` (див. [[classifier-scoring]]). Якщо max < 40 → `unclear`.

**Pipeline:**
1. SERP fetch (top-10 для query+geo)
2. Per result: scrape page (outbound links, redirects, CTA destination)
3. Rule signals: 8 правил (домен match, outbound ratios, affiliate-параметри, redirect chains, CTA target)
4. LLM signal: structured JSON output від Claude через OpenRouter
5. Combine + decide
6. Save до `classifications` + update `domain_history`

**Категорії з прикладами:**

| Категорія | Як виглядає | Приклад |
|---|---|---|
| `official` | Сам бренд або його редірект | `starcasino.nl` |
| `affiliate` | Огляд/review StarCasino з CTA `→ starcasino.nl?btag=...` | Партнерський media-сайт |
| `competitor_brand_thief` | Сторінка про "StarCasino", але CTA → інше казино | Огляд "StarCasino alternatives" з CTA на JACKS.NL |
| `unclear` | Згадка бренду без монетизації | Wikipedia, news article |

## Tradeoffs

- **4 категорії, не більше:** Збільшення granularity (наприклад, ділити affiliate на "exclusive" vs "multi-brand") додає complexity без actionable value для першої версії.
- **Rule-heavy (60%):** LLM використовується для edge cases, не для primary decision. Це дешевше і детермінованіше; LLM-only підхід коштував би у 5-10× більше при тих самих результатах.
- **No human-in-the-loop за замовчуванням:** автокласифікація автоматизує, не замінює ручний review. Reviewer-флаг для `confidence < 0.7` — у бекапі.

## Related

- [[classifier-scoring]] — combined scoring matrix з вагами
- [[official-domain-signals]], [[affiliate-detection]], [[competitor-thief-detection]] — деталі per-категорія
- [[../comparisons/affiliate-vs-brand-thief-signals]] — критичне розрізнення
- [[../entities/starcasino-nl]], [[../entities/nl-competitor-casinos]]
- [[../synthesis/task-2-answer]]

## Sources

- [[../sources/kraken-leads-test-task]] — Task 2 PDF questions
