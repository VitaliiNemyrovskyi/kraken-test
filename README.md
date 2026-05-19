# Kraken Leads — Test Task (AI Engineer, SEO & Affiliate, iGaming)

> Тестове завдання на позицію AI Engineer • Test task for the AI Engineer position
> Test task PDF: [`raw/kraken-leads-test-task.pdf`](raw/kraken-leads-test-task.pdf)

Концепція моніторингу брендованої видачі StarCasino (NL) з автоматичною класифікацією доменів на три категорії, **плюс робочий прототип**: [`prototype/`](prototype/). Live demo: [kraken-test.swift-mail.app](https://kraken-test.swift-mail.app).

---

## 🗺️ Архітектура

![Branded SERP Monitor](wiki/assets/diagrams/task-2-architecture.svg)

### Documentation — Karpathy LLM-Wiki

![Documentation Layer](wiki/assets/diagrams/docs-layer.svg)

Деталі та [[wikilinks]] на atomic-сторінки → [wiki/synthesis/architecture-overview.md](wiki/synthesis/architecture-overview.md) (UA) · [wiki-en/synthesis/architecture-overview.md](wiki-en/synthesis/architecture-overview.md) (EN).

---

## 📚 Як читати документацію

Документація організована за методом **[Karpathy LLM-Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)** — atomic markdown pages + cross-references + version-controlled schema.

### Швидкий шлях (Reviewer, 10 хв)

| Крок | Файл | Мета |
|---|---|---|
| 1 | [`README.md`](README.md) (цей файл) | Огляд + діаграма |
| 2 | [`CLAUDE.md`](CLAUDE.md) | Методологія, iron rules, skills matrix |
| 3 | [`wiki/synthesis/architecture-overview.md`](wiki/synthesis/architecture-overview.md) | Архітектура з посиланнями на atomic concepts |
| 4 | [`wiki/synthesis/task-2-answer.md`](wiki/synthesis/task-2-answer.md) | Sequential відповідь на PDF-питання |
| 5 | [`wiki/concepts/`](wiki/concepts/) | Atomic concept pages (по одній на під-питання PDF) |
| 6 | [`prototype/`](prototype/) | Робочий прототип з SerpAPI + Playwright + Claude + Cloudflare deploy |

### Структура репозиторію

```
kraken-test/
├── README.md                    ← ви тут
├── CLAUDE.md                    ← schema + project memory (Karpathy)
├── raw/                         ← immutable sources (PDF + external refs)
├── wiki/                        ← UA wiki (primary)
│   ├── index.md, log.md
│   ├── entities/  concepts/  sources/  comparisons/  synthesis/
│   └── assets/diagrams/         ← SVG/D2/Mermaid sources
├── wiki-en/                     ← EN mirror
└── prototype/                   ← Робочий прототип (Node.js / TS / Fastify / React)
```

---

## 🚀 Quick start — prototype

```bash
cd prototype
cp .env.example .env       # SERPAPI_KEY, OPENROUTER_API_KEY
npm install && npx playwright install chromium
npm run analyze            # один реальний run для top-10 NL "starcasino"
npm run dashboard          # http://localhost:3000
```

Без API-ключів буде доступний `npm run analyze:mock` на fixture-даних.

---

## 🛠️ Tools & Methodology

- **Документація:** [`llm-wiki@claude-code-skills`](https://github.com/anthropics/claude-code-skills) (Karpathy method) + paralleled UA/EN trees
- **Code quality:** [`karpathy-coder@claude-code-skills`](https://github.com/anthropics/claude-code-skills) (4 principles)
- **Діаграми:** D2 + Mermaid → SVG
- **Prototype stack:** Node.js 20 + TypeScript 5 strict + Fastify + Playwright + SQLite + OpenRouter (LLM gateway) + SerpAPI + React + Vite + Tailwind + shadcn/ui + Recharts

---

## 📦 Deliverables checklist

- [x] Karpathy LLM-Wiki vault (UA + EN mirror, schema, templates, index, log)
- [x] Source-summary [`wiki/sources/kraken-leads-test-task.md`](wiki/sources/kraken-leads-test-task.md)
- [x] Architecture overview з SVG-діаграмами
- [x] Atomic concept pages: `domain-classification`, `affiliate-detection`, `competitor-thief-detection`, `classifier-scoring`
- [x] Entity: [`starcasino-nl`](wiki/entities/starcasino-nl.md)
- [x] Synthesis: [`task-2-answer.md`](wiki/synthesis/task-2-answer.md) — primary deliverable view
- [x] **Робочий прототип** — задеплоєний на [kraken-test.swift-mail.app](https://kraken-test.swift-mail.app)

---

## 🇺🇸 English

Same repository, both languages. EN documentation mirrors the UA primary tree under `wiki-en/`. Read the architecture overview at [`wiki-en/synthesis/architecture-overview.md`](wiki-en/synthesis/architecture-overview.md).

---

*Час витрачено на цю частину: TBD у фінальному звіті.*
