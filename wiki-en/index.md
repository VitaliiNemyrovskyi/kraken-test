# Index — Kraken Leads Test Task (EN mirror)

_Updated 2026-05-18 • 11 pages • English mirror of [[../wiki/index]]_

> Content catalog of every page in `wiki-en/`. Each entry mirrors a Ukrainian
> page under `wiki/`. Answer queries by reading the language-appropriate index
> first, then drilling into relevant pages.
>
> **Topic:** Kraken Leads — SEO/Affiliate iGaming Test Task
> **Tasks:** (1) automated SEO-site generation system, (2) branded SERP monitoring for StarCasino NL.

## Synthesis (2)

- [[synthesis/architecture-overview|Architecture overview]] — High-level architecture for both tasks plus the Karpathy-wiki documentation layer (with SVG diagrams) _(1 sources · upd 2026-05-18)_
- [[synthesis/task-2-answer|Task 2 — answer to PDF questions]] — Sequential answer to Task 2 PDF questions — branded SERP monitoring concept for StarCasino (NL) with domain auto-classification and dashboards _(1 sources · upd 2026-05-18)_

## Concept (7)

- [[concepts/affiliate-detection|Affiliate site detection (→ StarCasino)]] — Signals to classify a site as a proper affiliate _(1 sources · upd 2026-05-18)_
- [[concepts/classifier-scoring|Classifier scoring (combined rule + LLM)]] — Combined scoring matrix for the domain classifier — rule 0.6 + LLM 0.4, argmax with threshold 40 _(1 sources · upd 2026-05-18)_
- [[concepts/competitor-thief-detection|Competitor brand thief detection]] — Signals to detect a site that ranks on the StarCasino brand but monetises traffic for competitor casinos _(1 sources · upd 2026-05-18)_
- [[concepts/domain-classification|Domain classification (StarCasino branded SERP)]] — Splits domains from a branded SERP into 4 categories _(1 sources · upd 2026-05-18)_
- [[concepts/google-sheets-intake|Google Sheets intake]] — SEO task intake from Google Sheets via OAuth 2.0 + polling _(1 sources · upd 2026-05-18)_
- [[concepts/task-queue|Unified task queue]] — Single SQLite queue merging tasks from all intake sources _(1 sources · upd 2026-05-18)_
- [[concepts/web-ui-intake|Web UI intake]] — Browser form for manual SEO task creation _(1 sources · upd 2026-05-18)_

## Entity (1)

- [[entities/starcasino-nl|StarCasino (Netherlands)]] — Dutch-licensed online casino brand; the primary brand for Task 2 monitoring _(1 sources · upd 2026-05-18)_

## Source (1)

- [[sources/kraken-leads-test-task|Kraken Leads — Test Task for AI Engineer (SEO & Affiliate, iGaming)]] — PDF with two tasks _(upd 2026-05-18)_

## Comparison (0)
_No pages yet. Will hold pairwise analyses (SerpAPI vs DataForSEO, Affiliate vs Brand-Thief signals, etc.)._
