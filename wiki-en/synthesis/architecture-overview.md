---
title: Architecture overview
category: synthesis
summary: High-level architecture of the branded SERP monitor plus the Karpathy-wiki documentation layer
tags: [overview, architecture, diagram]
sources: 1
updated: 2026-05-19
lang: en
mirror: ../../wiki/synthesis/architecture-overview.md
---

# Architecture overview

## TL;DR
The project has two independent but semantically connected layers: (1) **working prototype** of branded SERP monitoring with a classifier; (2) **documentation** — a Karpathy LLM-Wiki with atomic pages in UA+EN.

---

## Layer 1 — Branded SERP Monitor (StarCasino NL)

![Branded SERP Monitor Architecture](../assets/diagrams/task-2-architecture.svg)

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
      SCORE{Combined<br/>score ≥ 30}
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

## Layer 2 — Documentation (Karpathy LLM-Wiki)

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

## Related
- [[../sources/kraken-leads-test-task]]
- [[task-2-answer]] — sequential answer to the PDF
- [[../concepts/domain-classification]], [[../concepts/affiliate-detection]], [[../concepts/competitor-thief-detection]], [[../concepts/classifier-scoring]]
- [[../comparisons/affiliate-vs-brand-thief-signals]]
