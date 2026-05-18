---
title: Web UI intake
category: concept
summary: Веб-форма для ручного створення SEO-задач — альтернатива Google Sheets для разових/ad-hoc задач
tags: [task1, intake, web-ui]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/concepts/web-ui-intake.md
---

# Web UI intake

## Definition
HTML-форма у браузері для створення SEO-задачі вручну. Поля: `keyword`, `geo`, `language`, `brand`, `content_type`. Задача потрапляє в ту саму чергу, що й Sheet-tasks, але з міткою `source='web'`.

## Why it matters
Sheets чудові для пакетного завантаження ("сто ключових слів на квартал"), але незручні для:
- швидкого ad-hoc запиту ("дамо терміново на тренд лендінг")
- тестування пайплайну без перезабруднення production Sheet
- роботи зовнішніх ролей, які не мають доступу до Sheets з причин compliance

UI дає миттєвий path-to-task без табличного контексту. Користувач сам обирає джерело — теза з PDF: "вебінтерфейс аналог" як рівноправна альтернатива.

## How it would work (proposed design)

- `POST /api/tasks` — приймає JSON, валідує через `zod` (whitelist `contentType`), вставляє запис у чергу з `source='web'`, `sheet_row_id=NULL`.
- HTML-форма + жива таблиця всіх задач з обох джерел (live refresh).
- Web-tasks **не** мають Sheet writeback (для них немає Sheet рядка); вони видимі тільки в UI.

Та сама state-machine (`queued → ... → published`), що й для sheet-tasks (див. [[task-queue]]).

*Цей концепт **не імплементовано** в репозиторії — Task 1 є теоретичною частиною за вимогами PDF. Дизайн зафіксовано для phase plan і референсу в [[../synthesis/architecture-overview]].*

## Tradeoffs

- **No auth у demo:** будь-хто з мережі може створити задачу. Production: SSO (Google Workspace OIDC) + RBAC, бо створення задачі коштує LLM-токени.
- **Не зберігаємо чернетки:** один submit = один task. Production: drafts + bulk import з CSV.
- **No edit після submit:** для змін → видалити + створити нову (демо). Production: edit endpoint + audit log.

## Related
- [[google-sheets-intake]] — основне production джерело
- [[task-queue]] — куди потрапляють обидва джерела
- [[../entities/fastify]]
- [[../synthesis/task-1-answer]]

## Sources
- [[../sources/kraken-leads-test-task]] — питання 1 PDF
