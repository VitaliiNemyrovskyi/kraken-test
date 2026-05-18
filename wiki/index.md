# Index — kraken-test

_Auto-generated 2026-05-18 • 12 pages_

> Content-oriented catalog of every page in `wiki/`. Updated by
> `scripts/update_index.py` or during `/wiki-ingest`. Answer queries
> by reading this file first, then drilling into relevant pages.

## Synthesis (2)

- [[synthesis/architecture-overview|Architecture overview]] — Високорівнева архітектура обох задач — генерація SEO-сайтів (Task 1) та моніторинг брендованої видачі (Task 2) — плюс шар документації Karpathy-wiki _(1 sources · upd 2026-05-18)_
- [[synthesis/task-2-answer|Task 2 — відповідь на питання PDF]] — Sequential відповідь на питання Task 2 з тестового завдання — концепція моніторингу брендованої видачі StarCasino (NL) з автокласифікацією доменів і дашбордами _(1 sources · upd 2026-05-18)_

## Concept (8)

- [[concepts/affiliate-detection|Affiliate site detection (→ StarCasino)]] — Сигнали для класифікації сайту як партнерського: outbound links на бренд-домен з affiliate-параметрами, primary CTA веде на бренд після resolve редіректів _(1 sources · upd 2026-05-18)_
- [[concepts/classifier-scoring|Classifier scoring (combined rule + LLM)]] — Combined scoring matrix домен-класифікатора — rule-based signals (0.6 weight) + LLM verdict (0.4 weight); argmax score з threshold 40 _(1 sources · upd 2026-05-18)_
- [[concepts/competitor-thief-detection|Competitor brand thief detection]] — Сигнали для виявлення сайту, що ranking-катає на бренді StarCasino, але монетизує трафік на користь конкурентних казино — найбільш загрозлива категорія _(1 sources · upd 2026-05-18)_
- [[concepts/domain-classification|Domain classification (StarCasino branded SERP)]] — Розподіл доменів з брендованої SERP на 4 категорії (official / affiliate / competitor brand thief / unclear) на основі combined rule+LLM scoring _(1 sources · upd 2026-05-18)_
- [[concepts/google-sheets-intake|Google Sheets intake]] — Прийом SEO-задач з Google Sheets через OAuth 2.0 + polling, із writeback статусів назад у Sheet _(1 sources · upd 2026-05-18)_
- [[concepts/scaling-bottlenecks|Scaling to 1000+ sites/month — bottlenecks and mitigations]] — Технічні bottlenecks при масштабуванні SEO-генерації до 1000+ сайтів (~50k pages) на місяць — LLM rate/cost, SERP API, scraping, CF Pages limits, indexation — з конкретними mitigations та cost model _(1 sources · upd 2026-05-18)_
- [[concepts/task-queue|Unified task queue]] — Єдина персистентна черга, що зливає задачі з усіх intake джерел; state machine + status writeback per source _(1 sources · upd 2026-05-18)_
- [[concepts/web-ui-intake|Web UI intake]] — Веб-форма для ручного створення SEO-задач — альтернатива Google Sheets для разових/ad-hoc задач _(1 sources · upd 2026-05-18)_

## Entity (1)

- [[entities/starcasino-nl|StarCasino (Netherlands)]] — Голландський лецензований онлайн-казино бренд, на якому Kraken Leads виконує SEO/affiliate робого; primary brand для Task 2 моніторингу _(1 sources · upd 2026-05-18)_

## Source (1)

- [[sources/kraken-leads-test-task|Kraken Leads — Test Task для AI Engineer (SEO & Affiliate, iGaming)]] — PDF з двома задачами — концепція системи генерації SEO-сайтів + прототип моніторингу брендованої видачі StarCasino NL _(upd 2026-05-18)_
