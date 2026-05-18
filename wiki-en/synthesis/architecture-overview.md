---
title: Architecture overview
category: synthesis
summary: High-level architecture for both tasks — SEO-site generation (Task 1) and branded SERP monitoring (Task 2) — plus the Karpathy-wiki documentation layer
tags: [overview, architecture, task1, task2, diagram]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/synthesis/architecture-overview.md
---

# Architecture overview

## TL;DR
The project has three independent but semantically connected layers: (1) **Task 1** — concept and partial PoC of an SEO-site generation system (intake → queue → pipeline → publish); (2) **Task 2** — full prototype of branded SERP monitoring with a classifier; (3) **documentation** — a Karpathy LLM-Wiki with atomic pages in UA+EN. Currently implemented: Task 1 intake layer + Task 2 prototype (planned).

---

## Layer 1 — Task 1: SEO Automation System

![Task 1 Architecture](../assets/diagrams/task-1-architecture.svg)

> 📄 [Mermaid source](../assets/diagrams/task-1-architecture.mmd) (for editing/regen)

<details>
<summary>Mermaid source (inline)</summary>

```mermaid
flowchart LR
    subgraph SOURCES["Task intake (implemented in intake/)"]
      direction TB
      S1["📊 Google Sheets<br/><i>OAuth 2.0 + 60s polling</i>"]
      S2["📝 Web Form UI<br/><i>Fastify + Vanilla JS</i>"]
    end

    I["Intake Service<br/>(intake/src/sheets, web)"]
    Q[("Unified Task Queue<br/>SQLite + state machine")]
    SIM["Status Simulator<br/>(queued → … → published)"]

    subgraph PIPE["Pipeline (concept, not implemented)"]
      direction LR
      P1["SERP Analysis<br/><i>SerpAPI / DataForSEO</i>"]
      P2["Competitor Scraping<br/><i>Playwright + Readability</i>"]
      P3["Topical Brief<br/><i>LLM clustering</i>"]
      P4["AI Content<br/><i>Claude Sonnet via OpenRouter</i>"]
      P5["HTML + SEO<br/><i>Astro + Schema.org</i>"]
      P6["Deploy<br/><i>Cloudflare Pages API</i>"]
      P1 --> P2 --> P3 --> P4 --> P5 --> P6
    end

    S1 -->|"polling"| I
    S2 -->|"POST /api/tasks"| I
    I --> Q
    Q --> SIM
    SIM -.->|"when source='sheet'"| S1
    SIM ---> PIPE
    PIPE -->|"output URL"| SIM

    style SOURCES fill:#1a2332,stroke:#4ea1ff,color:#e4e7ee
    style PIPE fill:#2a1a2a,stroke:#b06bff,color:#e4e7ee,stroke-dasharray: 5 5
```

</details>

**Key concepts:** [[../concepts/google-sheets-intake]], [[../concepts/web-ui-intake]], [[../concepts/task-queue]] (implemented); [[../concepts/serp-collection]], [[../concepts/competitor-scraping]], [[../concepts/content-generation-pipeline]], [[../concepts/seo-quality-control]], [[../concepts/html-schema-markup]], [[../concepts/cloudflare-deployment]] (concept).

---

## Layer 2 — Task 2: Branded SERP Monitor (StarCasino NL)

![Task 2 Architecture](../assets/diagrams/task-2-architecture.svg)

> 📄 [Mermaid source](../assets/diagrams/task-2-architecture.mmd) (for editing/regen)

<details>
<summary>Mermaid source (inline)</summary>

```mermaid
flowchart TB
    CRON["⏱️ Daily Cron<br/>(query: starcasino, geo: NL)"]
    SERP["SERP Fetch<br/><i>SerpAPI free tier<br/>+ Playwright fallback<br/>+ mock fixture</i>"]
    SC["Page Scraper<br/><i>Playwright Chromium<br/>outbound links, redirects, CTA</i>"]

    subgraph CLASS["Classifier (rules:0.6 + LLM:0.4)"]
      direction LR
      R["Rule signals<br/>• domain match<br/>• outbound link ratios<br/>• affiliate-param regex<br/>• redirect chain<br/>• CTA destination"]
      L["LLM signal<br/><i>Claude Opus 4.7<br/>via OpenRouter</i><br/>JSON structured output"]
      SCORE{Combined<br/>score ≥ 40}
      R --> SCORE
      L --> SCORE
    end

    SCORE -->|"argmax"| CAT["Category"]

    subgraph OUT["Output categories"]
      direction TB
      OFF["✅ Official<br/><i>starcasino.nl</i>"]
      AFF["🔗 Affiliate<br/><i>aff_params → starcasino</i>"]
      THIEF["⚠️ Competitor Brand Thief<br/><i>brand mention but<br/>monetisation → other casino</i>"]
      UNC["❓ Unclear"]
    end

    DB[("SQLite snapshots<br/>+ classifications<br/>+ domain history")]

    DASH["📊 Dashboard<br/>(Fastify + Chart.js)<br/>• Pie chart<br/>• Time-series<br/>• Drill-down per domain"]

    CRON --> SERP --> SC --> CLASS
    CAT --> OFF
    CAT --> AFF
    CAT --> THIEF
    CAT --> UNC
    OFF --> DB
    AFF --> DB
    THIEF --> DB
    UNC --> DB
    DB --> DASH

    style CRON fill:#1a2a1a,stroke:#4ad295,color:#e4e7ee
    style CLASS fill:#2a201a,stroke:#ffb84a,color:#e4e7ee
    style THIEF fill:#2a1a1a,stroke:#ff6b6b,color:#e4e7ee
    style OFF fill:#1a2a1a,stroke:#4ad295,color:#e4e7ee
```

</details>

**Key distinction affiliate vs competitor-thief:** see [[../comparisons/affiliate-vs-brand-thief-signals]]. The decisive signal is the **final destination of monetised links after redirect resolution**, not brand mention.

---

## Layer 3 — Documentation (Karpathy LLM-Wiki)

![Documentation Layer](../assets/diagrams/docs-layer.svg)

> 📄 [Mermaid source](../assets/diagrams/docs-layer.mmd) (for editing/regen)

<details>
<summary>Mermaid source (inline)</summary>

```mermaid
flowchart LR
    subgraph L1["Layer 1 — Raw (immutable)"]
      PDF["📄 raw/<br/>kraken-leads-test-task.pdf<br/>+ external-refs/"]
    end

    subgraph L2A["Layer 2A — wiki/ (UA primary)"]
      direction TB
      IDX_UA["📋 index.md<br/>(auto-regenerated)"]
      LOG_UA["📜 log.md<br/>(append-only)"]
      E_UA["entities/<br/>tools, brands, APIs"]
      C_UA["concepts/<br/>system components,<br/>ADRs, phases"]
      S_UA["sources/<br/>LLM summaries"]
      CMP_UA["comparisons/"]
      SYN_UA["synthesis/<br/>(↑ this page)"]
    end

    subgraph L2B["Layer 2B — wiki-en/ (EN mirror)"]
      MIR["Mirror of wiki/<br/>same pages<br/>frontmatter mirror: …"]
    end

    subgraph L3["Layer 3 — Schema"]
      CM["📐 CLAUDE.md<br/>iron rules + skills matrix<br/>+ karpathy-coder principles"]
    end

    PDF -.->|"LLM reads"| S_UA
    S_UA --> C_UA
    S_UA --> E_UA
    C_UA --> SYN_UA
    E_UA --> SYN_UA
    CMP_UA --> SYN_UA
    L2A <-.->|"1:1 mirror"| L2B
    CM -.->|"governs"| L2A
    CM -.->|"governs"| L2B

    style L1 fill:#1a1a2a,stroke:#8b93a5,color:#e4e7ee
    style L2A fill:#1a2332,stroke:#4ea1ff,color:#e4e7ee
    style L2B fill:#1a2332,stroke:#4ea1ff,color:#e4e7ee,stroke-dasharray: 3 3
    style L3 fill:#2a201a,stroke:#ffb84a,color:#e4e7ee
```

</details>

**Iron rules:** `raw/` immutable, all writes go to `wiki/`/`wiki-en/`, every page has `lang` + `mirror` frontmatter, every claim has a citation. Tooling: `init_vault.py`, `update_index.py`, `lint_wiki.py`, `graph_analyzer.py`.

---

## Cross-layer integration

Layer 1 (intake) and Layer 2 (monitor) are not connected at runtime — they are **two separate test-task problems**. But conceptually:

- Domains classified in Task 2 (e.g. affiliate sites driving traffic to StarCasino) can become **competitor intelligence input** for the content generation pipeline of Task 1 (Phase 5 in [[phase-plan]]).
- The Task 2 dashboard can **show impact** of SEO sites generated through Task 1 (tracking their position in the SERP for brand queries).

This cross-link is described as a stretch goal in [[../concepts/scaling-bottlenecks]] (production phase).

## Related
- [[../sources/kraken-leads-test-task]]
- [[task-1-answer]] (not yet created) — sequential answer to PDF Task 1
- [[task-2-answer]] (not yet created) — sequential answer to PDF Task 2
- [[../concepts/google-sheets-intake]], [[../concepts/web-ui-intake]], [[../concepts/task-queue]]
