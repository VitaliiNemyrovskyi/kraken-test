---
title: "Kraken Leads — Test Task for AI Engineer (SEO & Affiliate, iGaming)"
category: source
summary: PDF with two tasks — design of an automated SEO-site generation system + a working prototype for branded SERP monitoring at StarCasino NL
tags: [task1, task2, brief, kraken-leads]
source_path: raw/kraken-leads-test-task.pdf
source_date: 2026-05
authors: ["Kraken Leads team", "Marta Savran (recruiter)"]
ingested: 2026-05-18
updated: 2026-05-18
lang: en
mirror: ../../wiki/sources/kraken-leads-test-task.md
---

# Kraken Leads — Test Task

## TL;DR
Test task for the AI Engineer position at Kraken Leads (SEO & Affiliate, iGaming). Two blocks: (1) theoretical design of a **fully automated SEO-site generation system** with 10 sub-questions; (2) theory + a **working prototype for branded SERP monitoring at StarCasino (NL)** with domain classification into 3 buckets.

## Key claims / requirements

### Task 1 (theoretical)
The system must:
1. Receive tasks from Google Sheets or a web interface
2. Analyze Google SERP for a given keyword
3. Collect data from competitor pages
4. Build SEO structure (headings, content requirements)
5. Generate content via AI
6. Produce HTML with correct SEO markup
7. Publish through Cloudflare Pages
8. Update status in Sheets + allow editing/regeneration
9. Scale to 1000+ sites/month
10. Be described with a phase plan + estimates + tooling per subtask

### Task 2 (theoretical + prototype)
Concept + prototype for **StarCasino (Netherlands)**. Top-10 SERP for the query "starcasino", geo=NL. Three domain categories:
- **Official** — starcasino.nl
- **Affiliate (proper)** — drives traffic to StarCasino with affiliate parameters
- **Competitor stealing brand traffic** — ranks on the brand but redirects users to other casinos

Must explain: which signals are used, how to tell affiliate→Star apart from competitor-thief, the monitoring cadence, dashboards with the distribution, how change over time is tracked.

## Surprises / contradictions
No explicit contradictions inside the PDF. Notable design choice: positioning "competitor stealing brand" as its own category — that's a specific iGaming SEO threat, not just a generic SERP competitor.

## Methods
Not a research paper, but a brief. The way to operate is engineering: propose an architecture, justify tradeoffs, build a working prototype for Task 2.

## Connections
- Seeds every concept page under `wiki-en/concepts/` — each concept answers a specific PDF sub-question
- Drives [[../synthesis/task-1-answer]] and [[../synthesis/task-2-answer]] (sequential views)
- [[../entities/kraken-leads]], [[../entities/starcasino-nl]] — mentioned in PDF

## Where it's cited in this wiki
- [[../concepts/google-sheets-intake]]
- [[../concepts/web-ui-intake]]
- [[../concepts/task-queue]]
