---
title: Google Sheets intake
category: concept
summary: Прийом SEO-задач з Google Sheets через OAuth 2.0 + polling, із writeback статусів назад у Sheet
tags: [task1, intake, google-sheets, oauth, polling]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/concepts/google-sheets-intake.md
---

# Google Sheets intake

## Definition
Шар, що автоматично переносить SEO-задачі з Google Sheet у внутрішню чергу. Sheet виступає UX-frontend для не-технічних користувачів (SEO-менеджерів, копірайтерів); кожен рядок — це задача на генерацію SEO-сторінки. Поточний статус виконання пишеться назад у Sheet, тож власник задачі бачить прогрес у звичному інтерфейсі.

## Why it matters
Реальне завдання PDF ([[sources/kraken-leads-test-task]]): "система повинна отримувати задачі з Google Sheets або вебінтерфейс аналог". Sheet — найдешевший production-grade UI для контент-команди: zero onboarding, всі вже вміють, масовий bulk import готовий з коробки.

## How it would work (proposed design)

1. **OAuth 2.0** з access_type=offline (refresh token зберігається у БД, переживає рестарт). Альтернатива — Google Service Account, простіший для server-only сценаріїв але потребує share-with-email кожного Sheet.
2. **Schema контракт:** перший рядок Sheet = headers `id | keyword | geo | language | brand | content_type | status | output_url`. Валідація на boot — без коректних заголовків polling fail-fast'иться з clear error.
3. **Polling worker:** кожні `POLL_INTERVAL_SECONDS` (default 60s) читає весь range; для кожного нового `id` створює задачу у внутрішній черзі (idempotency через `UNIQUE(source, sheet_row_id)` constraint у БД).
4. **Writeback:** при зміні статусу у pipeline (`scraping → generating → publishing → published`), якщо джерело задачі — Sheet, оновлюємо колонки `status` та `output_url` через `spreadsheets.values.update`.

*Цей концепт **не імплементовано** в репозиторії — Task 1 є теоретичною частиною за вимогами PDF. Дизайн зафіксовано для phase plan і референсу в [[../synthesis/architecture-overview]].*

## Tradeoffs

**Polling (поточний) vs Webhook (production)**:
- Polling: простота setup'у, але до 60s затримки.
- Webhook (Apps Script `onEdit` → push до API endpoint): миттєвий, але потребує public URL (ngrok для dev, або deployed instance) + retry queue на endpoint failure.

**OAuth 2.0 vs Service Account**:
- OAuth: production-like, user-explicit grant. Обрано для прототипу.
- Service Account: простіший для server-only, але потребує share-with-email кожного Sheet.

## Related
- [[web-ui-intake]] — альтернативне джерело тих самих задач
- [[task-queue]] — куди приземляються intake-події
- [[../entities/google-sheets-api]]
- [[../entities/fastify]]
- [[../synthesis/task-1-answer]]

## Sources
- [[../sources/kraken-leads-test-task]] — питання 1 PDF
