---
title: Google Sheets intake
category: concept
summary: SEO task intake from Google Sheets via OAuth 2.0 + polling, with status writeback back to the sheet
tags: [task1, intake, google-sheets, oauth, polling]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/concepts/google-sheets-intake.md
---

# Google Sheets intake

## Definition
Layer that automatically pulls SEO tasks from a Google Sheet into the internal queue. The sheet serves as a UX-frontend for non-technical users (SEO managers, copywriters); each row is one page-generation task. Execution status is written back to the sheet, so the task owner monitors progress in a familiar UI.

## Why it matters
Direct requirement from the PDF ([[sources/kraken-leads-test-task]]): "the system must receive tasks from Google Sheets or an analogous web interface". Sheets is the cheapest production-grade UI for a content team: zero onboarding, ubiquitous skill, bulk import for free.

## How we use it (demo prototype)
Implemented in [`intake/`](../../intake/):

1. **OAuth 2.0** with access_type=offline; refresh token stored in SQLite (survives restart) — `intake/src/sheets/oauth.ts`.
2. **Schema contract:** row 1 of the sheet = headers `id | keyword | geo | language | brand | content_type | status | output_url`. Validated in `intake/src/sheets/client.ts:HEADERS`.
3. **Polling worker:** every `POLL_INTERVAL_SECONDS` (default 60s) reads the entire range; for each new `id` inserts a task via `taskRepo.insert` (idempotency via `UNIQUE(source, sheet_row_id)`).
4. **Writeback:** when status changes via [[task-queue|status simulator]], if `task.source = 'sheet'`, the `status` and `output_url` columns are updated through `spreadsheets.values.update`.

## Tradeoffs

**Polling (current) vs Webhook (production)**:
- Polling: trivial setup, but up to 60s latency.
- Webhook (Apps Script `onEdit` → POST to API): instant, but requires public URL (ngrok in dev, or deployed instance) + retry queue on endpoint failure.

**OAuth 2.0 vs Service Account**:
- OAuth: production-like, explicit user grant. Chosen for the prototype.
- Service Account: simpler for server-only flows, but requires share-with-email for every sheet.

## Related
- [[web-ui-intake]] — alternative source for the same tasks
- [[task-queue]] — where intake events land
- [[../entities/google-sheets-api]]
- [[../entities/fastify]]
- [[../synthesis/task-1-answer]]

## Sources
- [[../sources/kraken-leads-test-task]] — PDF question 1
- Implementation: `intake/src/sheets/{oauth,client,poller}.ts`
