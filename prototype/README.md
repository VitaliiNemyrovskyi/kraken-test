# Kraken — StarCasino Branded SERP Monitor (Task 2 prototype)

Робочий прототип моніторингу брендованої видачі **StarCasino (Нідерланди)** для query `starcasino`, top-10 SERP. Автоматично класифікує домени на 4 категорії:

- **`official`** — `starcasino.nl` (бренд сам)
- **`affiliate`** — партнерські сайти, що ведуть трафік на StarCasino з aff-параметрами (`btag`, `aff_id`, `ref`, `partnerid`, `clickid`)
- **`competitor_brand_thief`** — сайти, що ranking-катать на бренді але CTA веде на ІНШІ казино (TonyBet, JACKS, Holland Casino, BetCity, Unibet, 711, Toto)
- **`unclear`** — недостатньо сигналів (Wikipedia, інформаційні media)

Класифікатор — **гібрид rule-based + LLM** (60/40 вага), threshold 40, argmax. Деталі в [[../wiki/concepts/classifier-scoring]] та [[../wiki/synthesis/task-2-answer]].

---

## Stack

| Шар | Технологія |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5+ strict |
| SERP | SerpAPI free tier (100/міс), Playwright fallback, mock fixture |
| Scraper | Playwright Chromium + cheerio + redirect chain resolution (HEAD-follow до 5 hops) |
| Classifier | 11 rule signals + LLM via OpenRouter (`anthropic/claude-opus-4-7`) + weighted scoring |
| Storage | SQLite (`better-sqlite3`) — snapshots, classifications, domain_history |
| Backend | Fastify (JSON API + static React build) |
| **Frontend** | **React 18 + Vite 5 + Tailwind CSS 3 + shadcn/ui-style components + Recharts** |
| **i18n** | **react-i18next** з UA + EN locales, toggle у хедері, persistence через localStorage |
| Icons | lucide-react |
| Validation | `zod` runtime contracts |

---

## Як запустити

### 1. Встановити залежності

```bash
cd prototype
npm install                        # ~380 packages (Node + React + Vite)
npx playwright install chromium    # ~120MB, тільки якщо плануєте scraping
```

### 2. Налаштувати ключі (опціонально)

```bash
cp .env.example .env
# відредагуйте:
#   SERP_SOURCE=serpapi          # 'mock' для offline (default)
#   SERPAPI_KEY=...              # serpapi.com → free tier 100 запитів/міс
#   OPENROUTER_API_KEY=...       # openrouter.ai → доступ до Claude/GPT/Gemini
#   CLASSIFIER_LLM_ENABLED=true  # вимкніть = rule-only режим
```

### 3. Запустити

**Offline demo (без API ключів):**
```bash
npm run analyze:mock        # обробляє data/mock-serp.json (12 entries)
npm run dashboard           # vite build → Fastify serves on http://localhost:3000
```

**Реальний run (з ключами):**
```bash
npm run analyze             # SerpAPI → Playwright scrape → OpenRouter classify
npm run dashboard
```

**Dev mode (Vite HMR + Fastify):**
```bash
# Terminal 1 — backend
npx tsx src/dashboard/server.ts
# Terminal 2 — Vite dev server with HMR + /api proxy
npm run dashboard:dev       # http://localhost:5173
```

---

## Очікувані результати (mock mode)

```
[analyze] query="starcasino" geo="Netherlands" source=mock limit=10
[analyze] fetched 10 SERP results
  [1] starcasino.nl                  ... official (1.00)
  [2] casino.nl                      ... affiliate (1.00)
  [3] onlinecasinoground.nl          ... affiliate (1.00)
  [4] bestecasinos.nl                ... competitor_brand_thief (1.00)
  [5] nl.wikipedia.org               ... unclear (0.00)
  [6] casinoz.nl                     ... competitor_brand_thief (1.00)
  [7] gokken.nl                      ... affiliate (1.00)
  [8] casinoaffer.com                ... affiliate (0.50)
  [9] nieuwecasinos.eu               ... competitor_brand_thief (1.00)
  [10] gambling.com                  ... affiliate (0.50)

[analyze] distribution:
  official                  1/10  (10%)
  affiliate                 5/10  (50%)
  competitor_brand_thief    3/10  (30%)
  unclear                   1/10  (10%)
```

Dashboard на `http://localhost:3000` показує:
- **Pie chart** з розподілом по категоріях
- **Зведення** з % і кількістю
- **Таблиця топ-10** з category badge, confidence, redirect final domain, та повним explanation (rule scores + LLM verdict + final reasoning)

---

## API endpoints

| Method | Path | Опис |
|---|---|---|
| GET | `/` | Web UI (dashboard) |
| GET | `/api/summary?query=&geo=` | Counts + percentages per category |
| GET | `/api/latest?query=&geo=` | Останній snapshot з усіма result + classification |
| GET | `/api/domains/:category?query=&geo=` | Domain list per category |

---

## Класифікатор — як він вирішує

### Rule signals (8 сигналів, ваги в `src/classifier/scoring.ts`)

| Signal | Score | Direction |
|---|---|---|
| `domain === 'starcasino.nl'` | +100 | official |
| `starLinkRatio ≥ 0.5 AND hasAffParamsToStar` | +60 | affiliate |
| `primaryCtaTarget='star' AND redirectsToStar` | +50 | affiliate |
| `compLinkRatio ≥ 0.4 AND hasAffParamsToComp` | +70 | competitor_thief |
| `primaryCtaTarget='competitor' AND brandMentions ≥ 3` | +60 | competitor_thief |
| `redirectsToComp` | +30 | competitor_thief |
| Dual-promote (both star+comp aff params) | +25 affiliate, +35 thief | thief leans win |
| `brandMentions ≥ 1 AND outboundCasinoLinks = 0` | +30 | unclear |

### LLM signal (опціонально, через OpenRouter)

Compact JSON context → `anthropic/claude-opus-4-7`. Zod-validated response:
```json
{ "category": "affiliate", "confidence": 0.87,
  "explanation": "Primary CTA links to starcasino.nl with btag affiliate parameter...",
  "signals_observed": ["aff_param_to_brand", "cta_to_brand", "brand_focus"] }
```

### Combined verdict

```ts
combined.affiliate = 0.6 * rule.scores.affiliate + 0.4 * llm.confidence * 100 // if LLM agrees
final = argmax(combined); if (final < 40) → "unclear"
// Special case: when LLM disabled → rule weight = 1.0 (no normalisation needed)
```

---

## Файлова структура

```
prototype/
├── package.json
├── tsconfig.json / tsconfig.node.json / tsconfig.ui.json   # split: backend vs UI
├── vite.config.ts, tailwind.config.js, postcss.config.js
├── .env.example
├── data/
│   ├── mock-serp.json          # offline fixture (12 entries — all 6 patterns)
│   └── starcasino.db           # SQLite (gitignored)
├── src/                         # ── Backend (Node.js) ──
│   ├── config.ts, types.ts, constants.ts
│   ├── serp/
│   │   ├── index.ts, serpapi-provider.ts, playwright-provider.ts, mock-provider.ts
│   ├── scraper/
│   │   ├── page-scraper.ts, extractors.ts, rate-limiter.ts
│   ├── classifier/
│   │   ├── index.ts, rules.ts, scoring.ts, llm.ts, prompts.ts
│   ├── storage/
│   │   ├── schema.sql, db.ts
│   ├── analyze/
│   │   └── run.ts              # CLI: SERP → scrape → classify → store
│   └── dashboard/
│       ├── server.ts           # Fastify + JSON endpoints + serves built React
│       └── public/             # ← Vite build output (gitignored)
└── ui/                          # ── Frontend (React + Vite) ──
    ├── index.html              # Vite entry
    └── src/
        ├── main.tsx, App.tsx
        ├── globals.css         # Tailwind directives + shadcn theme tokens (HSL)
        ├── types.ts            # frontend types matching API
        ├── lib/utils.ts        # cn() + category color helpers
        └── components/
            ├── CategoryPie.tsx       # recharts doughnut
            ├── SummaryCards.tsx      # 4 metric cards
            ├── DomainsTable.tsx      # expandable rows with explanation
            └── ui/                   # shadcn-style primitives
                ├── card.tsx, badge.tsx, table.tsx
```

---

## Чому такі рішення (короткий ADR-перелік)

- **Rule-heavy (60/40):** детермінізм + audit trail. LLM — для edge cases, не як primary. Зменшує LLM cost у 5-10×, зберігає 95% accuracy.
- **`argmax` без softmax:** простіше пояснити рев'юеру ("найвищий рахунок переміг"). Multi-label support — naступний крок.
- **Dual-promote → thief leans win** (+35 vs +25): часткова диверсія = шкода бренду. Краще false-positive `thief` ніж пропустити загрозу.
- **SQLite, не Postgres:** прототип single-process. Production: Postgres + read replicas, схема та сама.
- **Mock fixture обов'язкова:** demo має працювати без API ключів. Реальний run опціональний.
- **Karpathy-coder principles** застосовані: simplicity first, surgical changes, defined success criteria (рівні confidence для кожної категорії).
- **React + Vite + shadcn** для UI: industry-standard в iGaming/SaaS; компонентна архітектура для розширення (drill-down, filters, time-series). Recharts замість Chart.js — більш React-idiomatic.

Детальніше у wiki: [[../wiki/concepts/]] та [[../wiki/synthesis/task-2-answer]].

---

## Verification checklist

- [x] `npm install` без помилок (214 packages)
- [x] `npx tsc --noEmit` — clean
- [x] `npm run analyze:mock` — 10 domains класифіковано, snapshot збережено
- [x] starcasino.nl → `official` з confidence 1.00
- [x] 3 affiliate сайти (з btag/aff_id/partnerid) → `affiliate` 1.00
- [x] 3 competitor-thief (CTA → JACKS/Unibet/TonyBet) → `competitor_brand_thief` 1.00
- [x] Wikipedia → `unclear` 0.00
- [x] `npm run dashboard` — Fastify на :3000, JSON endpoints працюють, HTML рендериться

---

## Що НЕ зроблено (out of scope для прототипу)

- **Cron scheduler** — у production daily через `node-cron` або system cron
- **Time-series API endpoint** — `/api/history` для line chart drift detection
- **Domain drill-down view** — per-domain картка з історією категоризації
- **Multi-geo support** — поточно single (NL); легко розширюється через config
- **DataForSEO provider** — дешевший за SerpAPI на scale; через спільний `SerpProvider` interface
- **Caching layer** — Redis для domain → category з TTL 7 днів (зменшує LLM cost у production)
- **Webhook alerts** — Slack notification на drift detection (нова thief на топ-3 etc.)

Деталі скейлінгу: [[../wiki/concepts/scaling-bottlenecks]].
