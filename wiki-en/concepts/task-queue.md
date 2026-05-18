---
title: Unified task queue
category: concept
summary: A single persistent queue that merges tasks from all intake sources; state machine + per-source status writeback
tags: [task1, queue, state-machine]
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

## How it would work (proposed design)

**Table schema** (Postgres in production, SQLite in dev):
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  source TEXT CHECK(source IN ('web','sheet')),
  sheet_row_id TEXT,                    -- NULL for web; sheet row id for sheet
  keyword, geo, language, brand, content_type TEXT,
  status TEXT CHECK(status IN ('queued','scraping','generating','reviewing','publishing','published','failed')),
  output_url TEXT,
  created_at, status_updated_at TEXT,
  UNIQUE(source, sheet_row_id)          -- poller idempotency
);
```

**State machine:**
- Linear progression through 6 states (`queued → scraping → generating → reviewing → publishing → published`) or terminal `failed`
- `advanceTask(id)` does step+1
- On reaching `published`, `output_url` is recorded (deployed page URL)
- If `source='sheet'` → automatic writeback to the Sheet via `spreadsheets.values.update`

**Idempotency:** the `UNIQUE(source, sheet_row_id)` constraint means the sheet poller can run arbitrarily many times — new rows get inserted, existing ones are skipped.

*This concept is **not implemented** in this repository — Task 1 is the theoretical part per the PDF brief.*

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
