---
title: "Kraken Leads — Test Task для AI Engineer (SEO & Affiliate, iGaming)"
category: source
summary: PDF з двома задачами — концепція системи генерації SEO-сайтів + прототип моніторингу брендованої видачі StarCasino NL
tags: [task1, task2, brief, kraken-leads]
source_path: raw/kraken-leads-test-task.pdf
source_date: 2026-05
authors: ["Kraken Leads team", "Marta Savran (recruiter)"]
ingested: 2026-05-18
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/sources/kraken-leads-test-task.md
---

# Kraken Leads — Test Task

## TL;DR
Тестове завдання на позицію AI Engineer у Kraken Leads (SEO & Affiliate, iGaming). Два блоки: (1) теоретичний дизайн **повністю автоматизованої системи генерації SEO-сайтів** з 10 sub-questions; (2) теорія + **робочий прототип моніторингу брендованої видачі StarCasino (NL)** з класифікацією доменів на 3 категорії.

## Key claims / requirements

### Task 1 (theoretical)
Система має:
1. Отримувати задачі з Google Sheets або веб-інтерфейсу
2. Аналізувати Google SERP за keyword
3. Збирати дані зі сторінок конкурентів
4. Формувати SEO-структуру (headings, content requirements)
5. Генерувати контент через AI
6. Створювати HTML з коректною SEO-розміткою
7. Публікувати через Cloudflare Pages
8. Оновлювати статус у Sheets + дозволяти редагування/регенерацію
9. Масштабуватись до 1000+ сайтів/місяць
10. Бути описана з phase plan + estimates + tooling per subtask

### Task 2 (theoretical + prototype)
Концепція + прототип для **StarCasino (Нідерланди)**. Топ-10 SERP за запитом "starcasino", geo=NL. Три категорії доменів:
- **Офіційний** — starcasino.nl
- **Партнерський (proper)** — веде трафік на StarCasino з affiliate-параметрами
- **Конкурент, що краде брендований трафік** — ранжується на бренд, але перенаправляє на інші казино

Має пояснити: які сигнали використовуються, як відрізнити affiliate→Star від competitor-thief, механізм регулярного моніторингу, дашборди з розподілом, як зміни відстежуються в часі.

## Surprises / contradictions
Жодних явних протиріч у PDF. Цікаве рішення: ставити "competitor stealing brand" як окрему категорію — це specific iGaming SEO загроза, не просто SERP-конкурент.

## Methods
Не дослідницька стаття, а brief. Спосіб роботи — інженерний: запропонувати архітектуру, обґрунтувати tradeoffs, побудувати працюючий прототип Task 2.

## Connections
- Формує всі concept-сторінки у `wiki/concepts/` — кожен концепт відповідає на конкретне sub-question PDF
- Drives [[../synthesis/task-1-answer]] і [[../synthesis/task-2-answer]] (sequential views)
- [[../entities/kraken-leads]], [[../entities/starcasino-nl]] — згадані в PDF

## Where it's cited in this wiki
- [[../concepts/google-sheets-intake]]
- [[../concepts/web-ui-intake]]
- [[../concepts/task-queue]]
