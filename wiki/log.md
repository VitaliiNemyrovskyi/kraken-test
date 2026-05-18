# Log — heuristic-torvalds-ae2864

> Append-only timeline. Every LLM operation leaves an entry here.
>
> Format: `## [YYYY-MM-DD] <op> | <title>` followed by an optional detail line.
> Valid ops: `ingest`, `query`, `lint`, `create`, `update`, `delete`, `note`.
>
> Grep the last 10 entries: `grep "^## \[" log.md | tail -10`

## [2026-05-18] note | Vault initialized
Topic: **Kraken Leads — SEO/Affiliate iGaming Test Task (Task 1: SEO automation system, Task 2: branded SERP monitoring for StarCasino NL)**. Layers created: `raw/`, `wiki/{entities,concepts,sources,comparisons,synthesis}`.
Schema loader: `CLAUDE.md` (project-customized: UA primary + EN mirror rule, project context, karpathy-coder principles for prototype, skills matrix).

## [2026-05-18] create | wiki-en/ mirror + raw/kraken-leads-test-task.pdf
Created English mirror tree at `wiki-en/` with same subfolders and templates. Copied source PDF to `raw/kraken-leads-test-task.pdf` (immutable). Next: `/wiki-ingest raw/kraken-leads-test-task.pdf` to create source-summary + initial entity/concept pages in both languages.

## [2026-05-18] create | google-sheets-intake + web-ui-intake + task-queue

Created 3 UA concept pages + EN mirrors. Filed back from intake/ prototype implementation.

## [2026-05-18] create | synthesis/architecture-overview + 3 mermaid diagrams (PNG/SVG)

Created architecture-overview synthesis page (UA+EN) with 3 layered diagrams. Generated PNG/SVG assets via mermaid.ink. Updated root README.md with embedded diagrams + reviewer quick path. Canva candidates rejected as marketing-style, not technical.

## [2026-05-18] update | diagrams: replace PNG with SVG

Removed PNG files (raster, blurry on zoom). Replaced image links in README, wiki/synthesis/architecture-overview.md, wiki-en/synthesis/architecture-overview.md with SVG. Vector → unlimited zoom, accessibility (text stays text), smaller file footprint.

## [2026-05-18] create | task-2-answer synthesis + 4 concepts + 1 entity (UA+EN)

Created wiki/synthesis/task-2-answer.md as primary deliverable view (10 PDF sub-questions answered with [[wikilinks]]). Added concepts/{domain-classification, affiliate-detection, competitor-thief-detection, classifier-scoring}.md and entities/starcasino-nl.md. EN mirrors for all. Forward refs to ADRs and other concepts remain as expected for compounding wiki.

## [2026-05-18] create | concepts/scaling-bottlenecks (UA+EN)

Detailed answer to PDF Task 1 question 'how to scale to 1000+ sites/month' — 8 bottlenecks ranked by severity, mitigations, cost model ($0.24-0.30/page at 50k pages/mo), 5-phase build plan with team/duration/cost estimates.

## [2026-05-18] delete | remove intake/ (out of PDF scope)

Task 1 is theoretical-only per PDF brief. intake/ Node.js prototype removed via git rm. Wiki concepts (google-sheets-intake, web-ui-intake, task-queue) rewritten as concept-only design (UA+EN). Task 1 architecture diagram regenerated. README and architecture-overview updated. prototype/ folder remains for upcoming Task 2 implementation.

## [2026-05-18] update | classifier: 4 new signals + 6 worked LLM examples + comparisons page

Added pageDomainIsCompetitor (+90 thief), ctaAnchorHrefMismatch (+60 thief, cloaking detect), hasAffiliateDisclosure (+15 aff legitimacy), redirect chain hops capture. LLM prompt rewritten with 6 few-shot examples covering every category and pattern. New mock fixture entries: tonybet.nl (direct-competitor-on-brand) and shadyreview.nl (cloaked anchor). Smoke test: 1 official / 5 affiliate / 5 thief / 1 unclear across 12 fixture entries. Created wiki/comparisons/affiliate-vs-brand-thief-signals.md (UA+EN) — THE document answering PDF question about distinguishing affiliate from competitor brand thief.
