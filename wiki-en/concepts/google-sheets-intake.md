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

## How it would work (proposed design)

1. **OAuth 2.0** with access_type=offline; refresh token persisted in the DB (survives restart). Alternative — Google Service Account, simpler for server-only flows but requires share-with-email for every Sheet.
2. **Schema contract:** row 1 of the sheet = headers `id | keyword | geo | language | brand | content_type | status | output_url`. Validated on boot; without correct headers the poller fail-fasts with a clear error.
3. **Polling worker:** every `POLL_INTERVAL_SECONDS` (default 60s) reads the entire range; for each new `id` inserts a task into the internal queue (idempotency via `UNIQUE(source, sheet_row_id)` in the DB).
4. **Writeback:** when the pipeline advances status (`scraping → generating → publishing → published`), if the task's source is a Sheet, we update `status` and `output_url` columns via `spreadsheets.values.update`.

*This concept is **not implemented** in this repository — Task 1 is the theoretical part per the PDF brief. The design is captured here for the phase plan and for reference in [[../synthesis/architecture-overview]].*

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
