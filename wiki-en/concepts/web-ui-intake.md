---
title: Web UI intake
category: concept
summary: Browser form for manual SEO task creation — alternative to Google Sheets for ad-hoc tasks
tags: [task1, intake, web-ui]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/concepts/web-ui-intake.md
---

# Web UI intake

## Definition
HTML form in the browser for manual SEO task creation. Fields: `keyword`, `geo`, `language`, `brand`, `content_type`. The task lands in the same queue as sheet-tasks but with `source='web'`.

## Why it matters
Sheets are great for batch loading ("a hundred keywords per quarter") but inconvenient for:
- quick ad-hoc requests ("we need a trending landing today")
- testing the pipeline without polluting the production sheet
- external roles that lack sheet access for compliance reasons

The UI offers an immediate path-to-task without the spreadsheet context. The user picks the source — directly fulfilling the PDF's "web interface analogue" as a peer alternative.

## How it would work (proposed design)

- `POST /api/tasks` — accepts JSON, validates with `zod` (whitelist on `contentType`), inserts a queue row with `source='web'`, `sheet_row_id=NULL`.
- HTML form + live table of all tasks from both sources (auto-refresh).
- Web-tasks have **no** sheet writeback (no sheet row exists); they live only in the UI.

Same state machine (`queued → ... → published`) as sheet-tasks (see [[task-queue]]).

*This concept is **not implemented** in this repository — Task 1 is the theoretical part per the PDF brief.*

## Tradeoffs

- **No auth in demo:** anyone on the network can create a task. Production: SSO (Google Workspace OIDC) + RBAC, because every task costs LLM tokens.
- **No drafts:** one submit = one task. Production: drafts + bulk CSV import.
- **No edit after submit:** to change anything → delete + create new (demo). Production: edit endpoint + audit log.

## Related
- [[google-sheets-intake]] — primary production source
- [[task-queue]] — where both sources land
- [[../entities/fastify]]
- [[../synthesis/task-1-answer]]

## Sources
- [[../sources/kraken-leads-test-task]] — PDF question 1
