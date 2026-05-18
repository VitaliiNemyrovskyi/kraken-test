---
title: Unified task queue
category: concept
summary: Єдина SQLite-таблиця-черга, що зливає задачі з усіх intake джерел; state machine + status writeback per source
tags: [task1, queue, sqlite, state-machine]
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

## How we use it (demo прототип)
Реалізовано у `intake/src/storage/`:

**SQLite table** (`schema.sql`):
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  source TEXT CHECK(source IN ('web','sheet')),
  sheet_row_id TEXT,                    -- NULL для web; sheet row id для sheet
  keyword, geo, language, brand, content_type TEXT,
  status TEXT CHECK(status IN ('queued','scraping',...,'published','failed')),
  output_url TEXT,
  created_at, status_updated_at TEXT,
  UNIQUE(source, sheet_row_id)          -- idempotency для poller
);
```

**State machine** (`intake/src/types.ts:TASK_STATUS_FLOW` + `intake/src/status/simulator.ts`):
- Лінійна прогресія через 6 станів
- `advanceTask(id)` робить step+1
- `failTask(id)` → термінальний `failed`
- При досягненні `published` генерується fake `output_url` (демо)
- Якщо `source='sheet'` → автоматичний `syncBackToSheet` через `spreadsheets.values.update`

**Idempotency:** `UNIQUE(source, sheet_row_id)` constraint означає, що `poller.pollOnce()` може запускатись довільну кількість разів — нові рядки додасть, існуючі пропустить.

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
- Реалізація: `intake/src/storage/{schema.sql,db.ts}`, `intake/src/status/simulator.ts`
