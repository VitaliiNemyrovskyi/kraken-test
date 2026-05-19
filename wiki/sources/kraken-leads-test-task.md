---
title: "Kraken Leads — Test Task для AI Engineer (SEO & Affiliate, iGaming)"
category: source
summary: PDF з тестовим завданням — концепція + прототип моніторингу брендованої видачі StarCasino NL
tags: [brief, kraken-leads]
source_path: raw/kraken-leads-test-task.pdf
source_date: 2026-05
authors: ["Kraken Leads team", "Marta Savran (recruiter)"]
ingested: 2026-05-18
updated: 2026-05-19
lang: ua
mirror: ../../wiki-en/sources/kraken-leads-test-task.md
---

# Kraken Leads — Test Task

## TL;DR
Тестове завдання на позицію AI Engineer у Kraken Leads (SEO & Affiliate, iGaming). Теорія + **робочий прототип моніторингу брендованої видачі StarCasino (NL)** з класифікацією доменів на 3 категорії.

## Key claims / requirements

Концепція + прототип для **StarCasino (Нідерланди)**. Топ-10 SERP за запитом "starcasino", geo=NL. Три категорії доменів:
- **Офіційний** — starcasino.nl
- **Партнерський (proper)** — веде трафік на StarCasino з affiliate-параметрами
- **Конкурент, що краде брендований трафік** — ранжується на бренд, але перенаправляє на інші казино

Має пояснити: які сигнали використовуються, як відрізнити affiliate→Star від competitor-thief, механізм регулярного моніторингу, дашборди з розподілом, як зміни відстежуються в часі.

## Surprises / contradictions
Жодних явних протиріч у PDF. Цікаве рішення: ставити "competitor stealing brand" як окрему категорію — це specific iGaming SEO загроза, не просто SERP-конкурент.

## Methods
Не дослідницька стаття, а brief. Спосіб роботи — інженерний: запропонувати архітектуру, обґрунтувати tradeoffs, побудувати працюючий прототип.

## Connections
- Формує всі concept-сторінки у `wiki/concepts/` — кожен концепт відповідає на конкретне sub-question PDF
- Drives [[../synthesis/task-2-answer]] (sequential view)
- [[../entities/starcasino-nl]] — згаданий в PDF

## Where it's cited in this wiki
- [[../concepts/domain-classification]]
- [[../concepts/affiliate-detection]]
- [[../concepts/competitor-thief-detection]]
- [[../concepts/classifier-scoring]]
- [[../comparisons/affiliate-vs-brand-thief-signals]]
