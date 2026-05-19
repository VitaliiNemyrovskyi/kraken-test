# Index — kraken-test

_Auto-generated 2026-05-19 • 9 pages_

> Content-oriented catalog of every page in `wiki/`. Updated by
> `scripts/update_index.py` or during `/wiki-ingest`. Answer queries
> by reading this file first, then drilling into relevant pages.

## Synthesis (2)

- [[synthesis/architecture-overview|Architecture overview]] — Високорівнева архітектура моніторингу брендованої видачі плюс шар документації Karpathy-wiki _(1 sources · upd 2026-05-19)_
- [[synthesis/task-2-answer|Task 2 — відповідь на питання PDF]] — Sequential відповідь на питання Task 2 з тестового завдання — концепція моніторингу брендованої видачі StarCasino (NL) з автокласифікацією доменів і дашбордами _(1 sources · upd 2026-05-18)_

## Concept (4)

- [[concepts/affiliate-detection|Affiliate site detection (→ StarCasino)]] — Сигнали для класифікації сайту як партнерського: outbound links на бренд-домен з affiliate-параметрами, primary CTA веде на бренд після resolve редіректів _(1 sources · upd 2026-05-18)_
- [[concepts/classifier-scoring|Classifier scoring (combined rule + LLM)]] — Combined scoring matrix домен-класифікатора — rule-based signals (0.6 weight) + LLM verdict (0.4 weight); argmax score з threshold 30 _(1 sources · upd 2026-05-18)_
- [[concepts/competitor-thief-detection|Competitor brand thief detection]] — Сигнали для виявлення сайту, що ranking-катає на бренді StarCasino, але монетизує трафік на користь конкурентних казино — найбільш загрозлива категорія _(1 sources · upd 2026-05-18)_
- [[concepts/domain-classification|Domain classification (StarCasino branded SERP)]] — Розподіл доменів з брендованої SERP на 4 категорії (official / affiliate / competitor brand thief / unclear) на основі combined rule+LLM scoring _(1 sources · upd 2026-05-18)_

## Entity (1)

- [[entities/starcasino-nl|StarCasino (Netherlands)]] — Голландський ліцензований онлайн-казино бренд, на якому Kraken Leads виконує SEO/affiliate роботу; primary brand для моніторингу _(1 sources · upd 2026-05-18)_

## Source (1)

- [[sources/kraken-leads-test-task|Kraken Leads — Test Task для AI Engineer (SEO & Affiliate, iGaming)]] — PDF із завданням на концепцію + прототип моніторингу брендованої видачі StarCasino NL _(upd 2026-05-19)_

## Comparison (1)

- [[comparisons/affiliate-vs-brand-thief-signals|Affiliate vs Competitor Brand Thief — повний перелік сигналів]] — 11 сигналів класифікатора з вагами; розбір 6 реальних паттернів брендованої видачі; як відрізнити affiliate (веде на бренд) від competitor-brand-thief (краде трафік на конкурента) _(1 sources · upd 2026-05-18)_
