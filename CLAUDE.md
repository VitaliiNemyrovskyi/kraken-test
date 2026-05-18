# Kraken Leads Test Task — Project Memory & Wiki Schema

> **Project:** AI Engineer test task for Kraken Leads (SEO & Affiliate, iGaming vertical)
> **Initialized:** 2026-05-18
> **Methodology:** [Karpathy LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — compounding markdown knowledge base
> **Tooling:** [`llm-wiki@claude-code-skills`](https://github.com/anthropics/claude-code-skills) v2.3.0 + [`karpathy-coder@claude-code-skills`](https://github.com/anthropics/claude-code-skills) v2.3.0

You are the maintainer of this wiki and the architect of the prototype. You read from `raw/`, you write to `wiki/` and `prototype/`. You never edit `raw/`.

---

## Project context

Kraken Leads is an iGaming affiliate company. The test task has two parts:

- **Task 1 (theoretical):** Design a fully automated SEO-site generation system — Google Sheets intake → SERP analysis → competitor scraping → AI content → HTML → Cloudflare Pages, with selective regeneration. Output: design doc covering 10 sub-questions, scaling, tech choices, phase plan, estimates.
- **Task 2 (theoretical + working prototype):** Branded SERP monitoring for **StarCasino (NL)** — automatically classify domains in top-10 SERP into three buckets: `official`, `affiliate` (sends traffic to starcasino.nl), `competitor_brand_thief` (uses brand to divert traffic to other casinos). Output: concept doc + working Node.js/TypeScript prototype with dashboard.

Original requirements: [[sources/kraken-leads-test-task]] (raw: `raw/kraken-leads-test-task.pdf`).

---

## The three layers

```
raw/         → immutable sources (PDF task, external doc clippings). You only read.
wiki/        → LLM-owned knowledge base in Ukrainian (primary). You own.
wiki-en/     → English mirror of wiki/. Same atomic structure, translated content.
prototype/   → Working Node.js/TypeScript code for Task 2. Subject to karpathy-coder rules.
CLAUDE.md    → This file. Schema + conventions. Co-evolved with the user.
```

---

## Vault structure

```
raw/
├── kraken-leads-test-task.pdf       # The PDF brief — IMMUTABLE
├── external-refs/                    # Clippings of relevant docs (CF Pages, SerpAPI, KSA regs)
└── assets/                           # Images

wiki/                                 # Ukrainian (primary, matches task language)
├── index.md                          # Catalog
├── log.md                            # Append-only timeline
├── entities/                         # StarCasino, Kraken Leads, SerpAPI, Cloudflare, Claude, etc.
├── concepts/                         # SERP collection, classification, content gen pipeline, ADRs, phases
├── sources/                          # One summary page per ingested source
├── comparisons/                      # SerpAPI vs DataForSEO, Affiliate vs Brand-Thief, etc.
├── synthesis/                        # task-1-answer, task-2-answer, architecture overview, phase plan
└── .templates/                       # Page templates (reference only)

wiki-en/                              # English mirror
└── (same structure as wiki/)

prototype/                            # Node.js/TypeScript Task 2 implementation
├── package.json
├── src/
│   ├── serp/
│   ├── scraper/
│   ├── classifier/
│   ├── storage/
│   ├── analyze/
│   └── dashboard/
└── data/
```

---

## Page categorization for this project

Wikis are organized around iGaming-SEO domain:

- **`entities/`** — concrete tools, APIs, models, brands, companies. Examples:
  - `kraken-leads.md`, `starcasino-nl.md`, `cloudflare-pages.md`, `serpapi.md`, `claude-sonnet-4-7.md`, `openrouter.md`
  - Competitor casinos: `tonybet.md`, `holland-casino.md`, `jacks-nl.md`, `betcity-nl.md`, `unibet-nl.md`

- **`concepts/`** — system components, methods, ADRs, phase plans. Examples:
  - System components: `serp-collection.md`, `competitor-scraping.md`, `content-generation-pipeline.md`, `seo-quality-control.md`, `cloudflare-deployment.md`, `domain-classification.md`, `affiliate-detection.md`, `competitor-thief-detection.md`, `classifier-scoring.md`, `selective-regeneration.md`
  - Architecture Decision Records: `adr-001-orchestrator-temporal.md`, `adr-007-classification-signal-weights.md`, `adr-008-dual-promote-tiebreak.md` (frontmatter: `tags: [decision, adr]`)
  - Phase plans: `phase-1-mvp.md`, `phase-2-production.md`, `phase-3-scaleout.md` (tags: `[phase, plan]`)

- **`sources/`** — LLM summaries of ingested raw sources:
  - `kraken-leads-test-task.md` — summary of the PDF
  - External: `cloudflare-pages-docs.md`, `serpapi-docs.md`, `ksa-koa-regulations.md`, `data-for-seo-pricing.md`

- **`comparisons/`** — side-by-side analyses:
  - `serpapi-vs-dataforseo.md`, `serpapi-vs-playwright-scrape.md`, `affiliate-vs-brand-thief-signals.md`, `astro-vs-eleventy.md`, `cloudflare-vs-vercel.md`

- **`synthesis/`** — high-level overviews and task answers:
  - `task-1-answer.md` — sequential answer to all 10 PDF questions of Task 1 with `[[wikilinks]]` to details
  - `task-2-answer.md` — sequential answer to all PDF questions of Task 2
  - `architecture-overview.md` — combined view
  - `cost-model.md`, `scaling-analysis.md`

---

## Page frontmatter (required)

```yaml
---
title: <Title>
category: entity | concept | source | comparison | synthesis
summary: <one-line summary in the page's language>
tags: [tag1, tag2]                # Common tags: decision, adr, phase, igaming, seo, prototype
sources: <count>
updated: YYYY-MM-DD
lang: ua | en                     # CUSTOM for this project — must match folder (wiki/ → ua, wiki-en/ → en)
mirror: <relative-path-to-other-lang-version>   # CUSTOM — link to UA↔EN counterpart
---
```

For `source` pages, also include:
```yaml
source_path: raw/<path>
source_date: YYYY-MM
authors: [author1]
ingested: YYYY-MM-DD
```

---

## Iron rules for this project

1. **`raw/` is immutable.** Never edit `raw/kraken-leads-test-task.pdf` or anything else there.
2. **All wiki writes go to `wiki/` (UA) or `wiki-en/` (EN).** Never mix languages in one page.
3. **Every wiki page has YAML frontmatter** (see above; includes `lang` and `mirror`).
4. **UA is the primary language.** Create page in `wiki/` first, then mirror to `wiki-en/`. Both must stay in sync.
5. **Every claim has a citation.** Link to `[[sources/...]]` page or external URL.
6. **`synthesis/task-1-answer.md` and `synthesis/task-2-answer.md` must cover every sub-question of the PDF.** These are the primary deliverable views.
7. **For prototype code (Task 2), apply karpathy-coder principles** (see below).
8. **`wiki-en/` filenames mirror `wiki/`** (same kebab-case).
9. **Contradictions get flagged inline** with `> ⚠️ Contradiction:` and link both sides.
10. **Good answers get filed back** as new `comparisons/` or `synthesis/` pages.

---

## Karpathy-coder principles (for `prototype/`)

The Node.js/TypeScript prototype follows [Karpathy's 4 coding principles](https://x.com/karpathy/status/2015883857489522876):

1. **Think Before Coding** — surface assumptions, ask if uncertain, present tradeoffs.
2. **Simplicity First** — minimum code that solves the problem; no speculative abstractions.
3. **Surgical Changes** — every changed line traces to the stated goal.
4. **Goal-Driven Execution** — define success criteria, verify with tests/manual checks.

Before committing prototype code, run:
```bash
python ~/.claude/plugins/cache/claude-code-skills/karpathy-coder/2.3.0/scripts/complexity_checker.py <file>
python ~/.claude/plugins/cache/claude-code-skills/karpathy-coder/2.3.0/scripts/diff_surgeon.py
```

For an in-depth review: `/karpathy-check` (slash command from karpathy-coder plugin).

---

## The three operations

### Ingest (`/wiki-ingest <path>`)

When new raw source is added:
1. `python ~/.claude/plugins/cache/claude-code-skills/llm-wiki/2.3.0/scripts/ingest_source.py --vault . --source <path> --json` — get brief
2. Read source
3. Discuss with user: TL;DR, key claims, touched pages, contradictions
4. Wait for confirmation
5. Create `wiki/sources/<slug>.md` AND `wiki-en/sources/<slug>.md`
6. Update affected `entities/`, `concepts/`, `synthesis/` pages in BOTH languages
7. Update `wiki/index.md` and `wiki-en/index.md`
8. `append_log.py --op ingest`

### Query (`/wiki-query <question>`)

Answering a reviewer question or PDF sub-question:
1. Read `wiki/index.md` first
2. Pick 3–10 relevant pages
3. Synthesize: 1–3 sentence direct answer → supporting detail → `[[wikilinks]]` citations
4. If reusable, file back as new `synthesis/` or `comparisons/` page

### Lint (`/wiki-lint`)

Health check before delivery:
1. `python ~/.claude/plugins/cache/claude-code-skills/llm-wiki/2.3.0/scripts/lint_wiki.py --vault .`
2. `python ~/.claude/plugins/cache/claude-code-skills/llm-wiki/2.3.0/scripts/graph_analyzer.py --vault .`
3. Manually: every PDF sub-question has a path through the wiki, every entity mentioned has a page, every UA page has its EN mirror, every link resolves.

---

## Log format

`wiki/log.md` is append-only:

```
## [YYYY-MM-DD] <op> | <title>
<optional detail>
```

Valid ops: `ingest`, `query`, `lint`, `create`, `update`, `delete`, `note`.

---

## Useful skills available

When working on this project, invoke these skills via the Skill tool:

| Phase / Task | Skills to invoke |
|---|---|
| Task 1: System design | `engineering:system-design`, `engineering:architecture` |
| Task 1: Content gen pipeline knowledge | `marketing:content-creation`, `brand-voice:generate-guidelines`, `marketing:brand-review` |
| Task 1: SEO knowledge | `marketing:seo-audit` |
| Task 1: Competitor analysis pattern | `marketing:competitive-brief` |
| Task 1: Deployment | `engineering:deploy-checklist` |
| Task 2: Domain classification logic | `marketing:competitive-brief`, `marketing:seo-audit` |
| Task 2: Dashboard | `data:build-dashboard`, `data:create-viz`, `ui-styling`, `design:design-system` |
| Task 2: SQL schema | `data:sql-queries` |
| Prototype quality | `karpathy-coder:*` (slash: `/karpathy-check`) |
| Wiki ops | `llm-wiki:*` (slashes: `/wiki-ingest`, `/wiki-query`, `/wiki-lint`) |
| Wiki maintenance | `engineering:documentation` |
| Pre-delivery review | `engineering:code-review` |

---

## Style guide

- **Wiki pages:** concise, atomic (one concept per page), 150–500 words, frontmatter required, `[[wikilinks]]` everywhere.
- **UA:** використовуй академічний український стиль; технічні терміни англійською в дужках при першій згадці.
- **EN:** clear technical English; no marketing fluff.
- **Code:** TypeScript strict, no `any`, comments only when WHY is non-obvious.
- **Commits:** Conventional Commits format. NEVER bypass hooks.
