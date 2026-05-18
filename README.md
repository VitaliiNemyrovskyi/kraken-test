# Kraken Leads — Test Task (AI Engineer, SEO & Affiliate, iGaming)

> Тестове завдання на позицію AI Engineer • Test task for the AI Engineer position
> Test task PDF: [`raw/kraken-leads-test-task.pdf`](raw/kraken-leads-test-task.pdf)

Дві задачі в одному репозиторії:

- **Task 1** — концепція повністю автоматизованої системи генерації SEO-сайтів (Google Sheets → SERP → AI content → Cloudflare Pages), з частковим **робочим прототипом intake-шару**.
- **Task 2** — концепція моніторингу брендованої видачі StarCasino (NL) з автоматичною класифікацією доменів на 3 категорії, плюс **робочий прототип** (у плані).

---

## 🗺️ Архітектура

### Task 1 — SEO Automation System

![Task 1 — SEO Automation Architecture](wiki/assets/diagrams/task-1-architecture.svg)

### Task 2 — Branded SERP Monitor (StarCasino NL)

![Task 2 — Branded SERP Monitor](wiki/assets/diagrams/task-2-architecture.svg)

### Documentation — Karpathy LLM-Wiki

![Documentation Layer](wiki/assets/diagrams/docs-layer.svg)

Деталі та [[wikilinks]] на atomic-сторінки → [wiki/synthesis/architecture-overview.md](wiki/synthesis/architecture-overview.md) (UA) · [wiki-en/synthesis/architecture-overview.md](wiki-en/synthesis/architecture-overview.md) (EN).

---

## 📚 Як читати документацію

Документація організована за методом **[Karpathy LLM-Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)** — atomic markdown pages + cross-references + version-controlled schema.

### Швидкий шлях (Reviewer, 10 хв)

| Крок | Файл | Мета |
|---|---|---|
| 1 | [`README.md`](README.md) (цей файл) | Огляд + діаграми |
| 2 | [`CLAUDE.md`](CLAUDE.md) | Методологія, iron rules, skills matrix |
| 3 | [`wiki/synthesis/architecture-overview.md`](wiki/synthesis/architecture-overview.md) | Архітектура з посиланнями на atomic concepts |
| 4 | [`wiki/sources/kraken-leads-test-task.md`](wiki/sources/kraken-leads-test-task.md) | TL;DR оригінального завдання |
| 5 | [`wiki/concepts/`](wiki/concepts/) | Atomic concept pages (по одній на під-питання PDF) |
| 6 | [`intake/`](intake/) | Робочий прототип intake-шару |

### Структура репозиторію

```
kraken-test/
├── README.md                    ← ви тут
├── CLAUDE.md                    ← schema + project memory (Karpathy)
├── raw/                         ← immutable sources (PDF + external refs)
├── wiki/                        ← UA wiki (primary)
│   ├── index.md, log.md
│   ├── entities/  concepts/  sources/  comparisons/  synthesis/
│   └── assets/diagrams/         ← PNG/SVG/Mermaid sources
├── wiki-en/                     ← EN mirror
└── intake/                      ← Робочий прототип Task 1 intake (Node.js + Fastify + OAuth)
```

---

## 🚀 Quick start — Intake demo

```bash
cd intake
cp .env.example .env       # (опціонально) додати Google OAuth credentials
npm install
npm run dev                # → http://localhost:3001
```

Без Google credentials веб-форма все одно працює. Деталі: [`intake/README.md`](intake/README.md).

---

## 🛠️ Tools & Methodology

- **Документація:** [`llm-wiki@claude-code-skills`](https://github.com/anthropics/claude-code-skills) (Karpathy method) + paralleled UA/EN trees
- **Code quality:** [`karpathy-coder@claude-code-skills`](https://github.com/anthropics/claude-code-skills) (4 principles)
- **Діаграми:** Mermaid → PNG/SVG через [mermaid.ink](https://mermaid.ink/)
- **Tech stack:** Node.js 20 + TypeScript 5 strict + Fastify + SQLite + Google OAuth 2.0 + OpenRouter (LLM gateway)

---

## 📦 Deliverables checklist

- [x] Karpathy LLM-Wiki vault (UA + EN mirror, schema, templates, index, log)
- [x] Source-summary `wiki/sources/kraken-leads-test-task.md`
- [x] Architecture overview з 3 діаграмами (PNG + SVG + Mermaid source)
- [x] Atomic concept pages (intake): `google-sheets-intake`, `web-ui-intake`, `task-queue`
- [x] **Робочий intake-сервіс** з обома джерелами (Sheets OAuth + Web UI) + status simulator
- [ ] Решта concept/entity/comparison сторінок Task 1 (в плані)
- [ ] Concept-сторінки Task 2 + classifier ADRs (в плані)
- [ ] `synthesis/task-1-answer.md` та `task-2-answer.md` — sequential відповіді на PDF (в плані)
- [ ] Робочий прототип Task 2 (StarCasino monitor — у плані: [`/plans/...`](/Users/Nemyrovskyi/.claude/plans/users-nemyrovskyi-projects-kraken-test-lovely-hoare.md))

---

## 🇺🇸 English

Same repository, both languages. EN documentation mirrors the UA primary tree under `wiki-en/`. Read the architecture overview at [`wiki-en/synthesis/architecture-overview.md`](wiki-en/synthesis/architecture-overview.md). The prototype README under `intake/README.md` is bilingual where it matters. Code comments and identifiers are English-only.

---

*Час витрачено на цю частину: TBD у фінальному звіті.*
