---
title: Task 2 — відповідь на питання PDF
category: synthesis
summary: Sequential відповідь на питання Task 2 з тестового завдання — концепція моніторингу брендованої видачі StarCasino (NL) з автокласифікацією доменів і дашбордами
tags: [task2, deliverable-view, starcasino, nl, classification]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/synthesis/task-2-answer.md
---

# Task 2 — відповідь на питання PDF

> **Бренд:** StarCasino (Нідерланди) • **Geo:** NL • **Основний запит для прототипу:** `starcasino`, топ-10 SERP
> **Source:** [[../sources/kraken-leads-test-task]] (питання 2)
> **Архітектура:** [[architecture-overview#Шар 2 — Task 2: Branded SERP Monitor (StarCasino NL)]]

Кожна відповідь — 2-3 речення прямої відповіді + [[wikilinks]] на atomic-сторінки для деталей.

---

## 1. Як автоматично визначатиметься тип домену?

**Коротка відповідь:** Багаторівневий класифікатор поєднує rule-based сигнали (60% ваги) з LLM-аналізом (40%). Для кожного домену з SERP результат — одна з 4 категорій (`official`, `affiliate`, `competitor_brand_thief`, `unclear`) з confidence score.

**Деталі:** [[../concepts/domain-classification]] — overview трьох категорій; [[../concepts/classifier-scoring]] — combined rule+LLM scoring matrix з вагами та threshold.

---

## 2. Які сигнали використовуватимуться?

**Коротка відповідь:** 8 rule-based сигналів + LLM verdict через OpenRouter:
- **Domain match** (для official)
- **Outbound link ratios** до брендового домену vs до конкурентних казино
- **Affiliate-параметри** у URL (`btag`, `aff_id`, `ref`, `partnerid`, `clickid`, `sub_id`, `utm_source=affiliate`)
- **Redirect chain resolution** (max 5 hops, 10s budget) через affiliate networks (income-access, netrefer, affise)
- **Primary CTA destination** після resolve
- **Brand mention density** у тексті (TF-IDF)
- **Schema.org Organization/Brand markup**
- **WHOIS / SSL certificate org** (для official-розрізнення)

**Деталі:** [[../concepts/official-domain-signals]], [[../concepts/affiliate-detection]], [[../concepts/competitor-thief-detection]]; [[../entities/nl-competitor-casinos]] — список (TonyBet, Holland Casino, JACKS.NL, BetCity, Unibet, 711.nl, Toto.nl).

---

## 3. Як відрізнити affiliate (→ StarCasino) від конкурента (→ інше казино)?

**Це ключове питання Task 2.** Decisive signal — **final destination of monetised links after redirect resolution**, НЕ brand mention.

### 11 сигналів класифікатора (реалізовано у `prototype/`)

| # | Сигнал | Куди | Вага |
|---|---|---|---|
| **R1** | `pageDomain === 'starcasino.nl'` | `official` | +100 |
| **R2** | `pageDomain ∈ COMPETITOR_CASINOS` (конкурент сам у SERP) | `thief` | +90 |
| **R3** | **Cloaking:** anchor text каже "StarCasino", href → конкурент | `thief` | +60 |
| **R4** | `compLinkRatio ≥ 0.4 AND hasAffParamsToComp` | `thief` | +70 |
| **R5** | `primaryCtaTarget='competitor' AND brandMentions ≥ 3` | `thief` | +60 |
| **R6** | `redirectsToComp` (CTA chain ends at competitor) | `thief` | +30 |
| **R7** | `starLinkRatio ≥ 0.5 AND hasAffParamsToStar` | `affiliate` | +60 |
| **R8** | `primaryCtaTarget='star' AND redirectsToStar` | `affiliate` | +50 |
| **R9** | Видимий affiliate disclosure ("partnerlink"/"we earn") | `affiliate` | +15 |
| **R10** | Dual-promote (aff params на бренд **і** на конкурента) | tiebreak | +25 aff / +35 thief |
| **R11** | Brand mention без монетизації (Wikipedia, news) | `unclear` | +30 |

### 6 паттернів які класифікатор ловить

1. **Proper affiliate** (review-style з aff params на CTA) → R7+R8+R9 → 1.00 confidence
2. **Alternatives listicle** ("StarCasino alternatives" з CTA на JACKS) → R4+R5+R6 → 1.00
3. **Bonus aggregator** (з кращим конкурентним бонусом) → R4+R5 → 1.00
4. **Cloaking** (anchor "StarCasino" → href конкурент) → R3+R5+R6 → 1.00
5. **Direct competitor's site** (tonybet.nl сам на бренд-запит) → R2 → 0.90
6. **Informational** (Wikipedia) → R11 → unclear

**Dual-promote edge case** (сайт промує і StarCasino, і інших): схиляється до `competitor_brand_thief` (weight +35 vs +25 для affiliate). Зафіксовано в [[../concepts/adr-008-dual-promote-tiebreak]].

**Anti-cloaking захист:** realistic User-Agent + Playwright JS execution + повний redirect chain capture + LLM as sanity check (6-shot prompt).

**Повна сторінка-довідник:** [[../comparisons/affiliate-vs-brand-thief-signals]] — детальний розбір кожного з 11 сигналів, всіх 6 паттернів, та false-negative ризиків.

---

## 4. Механізм регулярного моніторингу

**Коротка відповідь:** Cron-trigger щодня; для top-priority brand queries — 4× на день. Кожен запуск — immutable snapshot. Зміни між snapshots детектяться через `domain_history` table з полем `category_changes` (counter).

- **Cadence:** daily для `starcasino`, `star casino`, `starcasino nl`; weekly для long-tail (`starcasino bonus`, `starcasino review`, `starcasino login`, etc.)
- **Storage:** append-only snapshots; не перезаписуємо, тільки додаємо. Дозволяє time-series аналіз.
- **Multi-geo support:** через config — NL основний, інші geo додаються без коду

**Деталі:** [[../concepts/monitoring-cadence]], [[../concepts/drift-detection]].

---

## 5. Зберігання даних

**Коротка відповідь:** PostgreSQL у production, SQLite у прототипі. 5 таблиць:

```sql
keywords         (id, query, geo, language, brand)
snapshots        (id, keyword_id, fetched_at, source)
serp_results     (id, snapshot_id, position, url, domain, title, snippet)
classifications  (id, result_id, category, confidence, rule_score_json,
                  llm_verdict_json, signals_json, classified_at)
domain_history   (domain, keyword_id, first_seen, last_seen,
                  last_category, category_changes)
```

Деталі схеми та індексів: [[../concepts/storage-schema-task2]] (forward ref).

---

## 6. Як рахуються відсотки та кількість доменів?

**Коротка відповідь:** Aggregation за останнім snapshot по `keyword_id` + `geo`. Для кожної категорії: count + percentage (count / total * 100). Для time-series — group by `taken_at::date`.

Приклад SQL:
```sql
SELECT category,
       COUNT(*) AS count,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
FROM classifications c
JOIN serp_results r ON r.id = c.result_id
JOIN snapshots s ON s.id = r.snapshot_id
WHERE s.id = (SELECT MAX(id) FROM snapshots WHERE keyword_id = ?)
GROUP BY category;
```

API endpoint: `GET /api/summary?keyword=starcasino&geo=nl` повертає `{official: 1, affiliate: 4, competitor_brand_thief: 3, unclear: 2}` + percentages.

---

## 7. Дашборди

**Коротка відповідь:** Fastify-сервер з Chart.js inline (no build step). 4 view:

1. **Latest distribution** — pie chart `official/affiliate/thief/unclear` за останнім snapshot
2. **Time-series** — line chart % per category за період (drift detection)
3. **Top domains per category** — таблиця з expand для drill-down (signals + LLM explanation)
4. **Domain history** — для конкретного домену: всі snapshots, де він з'являвся, його категорії в часі, кількість category-changes

**Деталі:** [[../concepts/dashboard-design]]; запозичує підхід з [[../entities/fastify]] + Chart.js, який вже застосований у [[../concepts/web-ui-intake|intake demo]].

---

## 8. Список конкретних доменів у кожній категорії

**Коротка відповідь:** API `GET /api/domains/:category?keyword=starcasino` повертає список доменів у категорії з останнього snapshot, відсортованих за position у SERP. Кожен запис: `{domain, url, position, confidence, explanation}`.

Очікувані результати для top-10 NL по запиту `starcasino`:

| Категорія | Очікувані домени (приклади) |
|---|---|
| `official` | `starcasino.nl` |
| `affiliate` | гemblers-themed media sites що ведуть на starcasino з aff params (`casino.org`, `casino.nl`, partner мережі) |
| `competitor_brand_thief` | review сайти, що ranking-катать на бренд StarCasino, але CTA — на JACKS.NL, BetCity, Unibet etc. |
| `unclear` | загальні media (Wikipedia, news), що не монетизуються |

Точний список буде з реального SERP fetch у [[#9. Практичний прототип|прототипі]].

---

## 9. Практичний прототип (top-10 NL по `starcasino`)

**Коротка відповідь:** Node.js 20 + TypeScript strict + Fastify + Playwright + SQLite + OpenRouter. **У плані** після інших priority робіт. Архітектура повністю описана у [[architecture-overview#Шар 2 — Task 2: Branded SERP Monitor (StarCasino NL)]].

**Stack обґрунтований у:** [[../concepts/adr-005-stack-nodejs]] (узгодженість з [[../concepts/web-ui-intake|intake-сервісом]]); [[../concepts/adr-006-storage-sqlite]] (single-process simplicity); [[../concepts/adr-007-signal-weights]] (rule 0.6 + LLM 0.4 rationale); [[../concepts/adr-008-dual-promote-tiebreak]] (competitor wins).

**CLI:**
- `npm run analyze` — реальний run (SerpAPI + Playwright + OpenRouter)
- `npm run analyze:mock` — fully offline на `data/mock-serp.json`
- `npm run dashboard` — Fastify на :3000

**Verification:**
- `starcasino.nl` → `official`, confidence > 0.9
- 2-3 сайти → `affiliate` або `competitor_brand_thief` з пояснюючим signals JSON
- Dashboard рендерить pie + drill-down

---

## 10. Масштабування

**Коротка відповідь:** Лінійно з кількістю запитів × geo × cadence.

- **N запитів × M geos × 30 днів** = N×M×30 snapshots/місяць
- DataForSEO заміняє SerpAPI на великих обсягах (~$0.0006/SERP vs $0.005 у SerpAPI)
- LLM-класифікація кешується per domain (TTL 7 днів) — більшість доменів стабільні
- Worker pool через k8s/ECS + Redis queue замість cron, якщо потрібен throughput > 100 snapshots/хв

**Деталі:** [[../concepts/scaling-bottlenecks]] (forward ref).

---

## Зв'язок з Task 1

Класифіковані як `affiliate` домени з Task 2 — це **competitor intelligence input** для content generation pipeline в Task 1 ([[architecture-overview#Cross-layer integration]]). А дашборд Task 2 може **показувати impact** SEO-сторінок, створених через Task 1 (їх rankings по бренд-запитах).

---

## Related

- [[../sources/kraken-leads-test-task]] — оригінальне завдання
- [[architecture-overview]] — діаграми
- [[../concepts/domain-classification]], [[../concepts/affiliate-detection]], [[../concepts/competitor-thief-detection]], [[../concepts/classifier-scoring]]
- [[../entities/starcasino-nl]], [[../entities/nl-competitor-casinos]]
- [[task-1-answer]] (ще не створено)
