---
title: Unified task queue
category: concept
summary: A single SQLite queue table that merges tasks from all intake sources; state machine + per-source status writeback
tags: [task1, queue, sqlite, state-machine]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/concepts/task-queue.md
---

# Unified task queue

## Definition
Shared persistent task queue that ingests records from both [[google-sheets-intake|Sheets]] and [[web-ui-intake|web UI]]. Each record traverses the state machine `queued → scraping → generating → reviewing → publishing → published` (or terminal `failed`). The source of origin is preserved via the `source` column, so status writeback is directed only to the channel the task came from.

## Why it matters
Without a unified queue the downstream pipeline (scraping, LLM gen, deploy) would need to know about two different sources. With it — the pipeline sees a uniform `Task` object, business logic is not duplicated. This is the classic adapter pattern: intake normalizes inputs, queue is the internal data model.

## How we use it (demo prototype)
Implemented in `intake/src/storage/`:

**SQLite table** (`schema.sql`):
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  source TEXT CHECK(source IN ('web','sheet')),
  sheet_row_id TEXT,                    -- NULL for web; sheet row id for sheet
  keyword, geo, language, brand, content_type TEXT,
  status TEXT CHECK(status IN ('queued','scraping',...,'published','failed')),
  output_url TEXT,
  created_at, status_updated_at TEXT,
  UNIQUE(source, sheet_row_id)          -- poller idempotency
);
```

**State machine** (`intake/src/types.ts:TASK_STATUS_FLOW` + `intake/src/status/simulator.ts`):
- Linear progression through 6 states
- `advanceTask(id)` does step+1
- `failTask(id)` → terminal `failed`
- On reaching `published`, a fake `output_url` is generated (demo)
- If `source='sheet'` → automatic `syncBackToSheet` via `spreadsheets.values.update`

**Idempotency:** the `UNIQUE(source, sheet_row_id)` constraint means `poller.pollOnce()` can run arbitrarily many times — new rows get inserted, existing ones are skipped.

## Tradeoffs

- **SQLite vs Redis Streams/BullMQ (production):** SQLite suffices for a single process + up to hundreds of tasks/day. At 1000+ sites/month production scale → BullMQ or Temporal workflows for durable retries (see [[../entities/temporal]]).
- **Linear state machine:** does not support parallel branches (e.g. "QC reject → back to generating"). In production the state is a DAG, possibly using Temporal child workflows.
- **Status push, not pull:** sheet writeback runs synchronously on advance; a slow Sheets API can block the UI. Mitigation: move to a background job (deferred in demo).

## Related
- [[google-sheets-intake]], [[web-ui-intake]] — sources
- [[../entities/temporal]], [[../entities/bullmq]] — production alternatives
- [[../synthesis/task-1-answer]]

## Sources
- [[../sources/kraken-leads-test-task]] — PDF question 8 ("status updates")
- Implementation: `intake/src/storage/{schema.sql,db.ts}`, `intake/src/status/simulator.ts`
