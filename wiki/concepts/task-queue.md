---
title: Unified task queue
category: concept
summary: Єдина персистентна черга, що зливає задачі з усіх intake джерел; state machine + status writeback per source
tags: [task1, queue, state-machine]
sources: 1
updated: 2026-05-18
lang: ua
mirror: ../../wiki-en/concepts/task-queue.md
---

# Unified task queue

## Definition
Спільна персистентна черга задач, в яку входять записи з [[google-sheets-intake|Sheets]] та [[web-ui-intake|web UI]]. Кожний запис проходить state machine `queued → scraping → generating → reviewing → publishing → published` (або термінальний `failed`). Витоки джерела зберігаються через `source` колонку, тож writeback статусу спрямовується тільки в той канал, звідки прийшла задача.

## Why it matters
Без єдиної черги downstream-pipeline (scraping, LLM gen, deploy) має знати про два різні джерела. З нею — pipeline бачить однорідний `Task` об'єкт, бізнес-логіка не дублюється. Це класичний adapter pattern: intake-шар нормалізує input, queue — це internal data model.

## How it would work (proposed design)

**Table schema** (Postgres у production, SQLite у dev):
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  source TEXT CHECK(source IN ('web','sheet')),
  sheet_row_id TEXT,                    -- NULL для web; sheet row id для sheet
  keyword, geo, language, brand, content_type TEXT,
  status TEXT CHECK(status IN ('queued','scraping','generating','reviewing','publishing','published','failed')),
  output_url TEXT,
  created_at, status_updated_at TEXT,
  UNIQUE(source, sheet_row_id)          -- idempotency для poller
);
```

**State machine:**
- Лінійна прогресія через 6 станів (`queued → scraping → generating → reviewing → publishing → published`) або термінальний `failed`
- `advanceTask(id)` робить step+1
- При досягненні `published` записується `output_url` (deployed page URL)
- Якщо `source='sheet'` → автоматичний writeback у Sheet через `spreadsheets.values.update`

**Idempotency:** `UNIQUE(source, sheet_row_id)` constraint означає, що sheet poller може запускатись довільну кількість разів — нові рядки додасть, існуючі пропустить.

*Цей концепт **не імплементовано** в репозиторії — Task 1 є теоретичною частиною за вимогами PDF.*

## Tradeoffs

- **SQLite vs Redis Streams/BullMQ (production):** SQLite вистачає для одного процесу + до сотень задач/день. У production з 1000+ сайтів/місяць → BullMQ або Temporal workflows для durable retries (див. [[../entities/temporal]]).
- **Linear state machine:** не підтримує паралельні гілки (наприклад, "QC reject → back to generating"). У production стан = DAG, можливо з Temporal child workflows.
- **Status push, не pull:** Sheet writeback робиться синхронно при advance; повільний Sheets API може блокувати UI. Mitigation: винести у background job (deferred у демо).

## Related
- [[google-sheets-intake]], [[web-ui-intake]] — джерела
- [[../entities/temporal]], [[../entities/bullmq]] — production альтернативи
- [[../synthesis/task-1-answer]]

## Sources
- [[../sources/kraken-leads-test-task]] — питання 8 PDF ("оновлення статусу")
