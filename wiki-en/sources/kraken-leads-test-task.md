---
title: "Kraken Leads — Test Task for AI Engineer (SEO & Affiliate, iGaming)"
category: source
summary: PDF brief — concept + working prototype for branded SERP monitoring at StarCasino NL
tags: [brief, kraken-leads]
source_path: raw/kraken-leads-test-task.pdf
source_date: 2026-05
authors: ["Kraken Leads team", "Marta Savran (recruiter)"]
ingested: 2026-05-18
updated: 2026-05-19
lang: en
mirror: ../../wiki/sources/kraken-leads-test-task.md
---

# Kraken Leads — Test Task

## TL;DR
Test task for the AI Engineer position at Kraken Leads (SEO & Affiliate, iGaming). Theory + a **working prototype for branded SERP monitoring at StarCasino (NL)** with domain classification into 3 buckets.

## Key claims / requirements

Concept + prototype for **StarCasino (Netherlands)**. Top-10 SERP for the query "starcasino", geo=NL. Three domain categories:
- **Official** — starcasino.nl
- **Affiliate (proper)** — drives traffic to StarCasino with affiliate parameters
- **Competitor stealing brand traffic** — ranks on the brand but redirects users to other casinos

Must explain: which signals are used, how to tell affiliate→Star apart from competitor-thief, the monitoring cadence, dashboards with the distribution, how change over time is tracked.

## Surprises / contradictions
No explicit contradictions inside the PDF. Notable design choice: positioning "competitor stealing brand" as its own category — that's a specific iGaming SEO threat, not just a generic SERP competitor.

## Methods
Not a research paper, but a brief. The way to operate is engineering: propose an architecture, justify tradeoffs, build a working prototype.

## Connections
- Seeds every concept page under `wiki-en/concepts/` — each concept answers a specific PDF sub-question
- Drives [[../synthesis/task-2-answer]] (sequential view)
- [[../entities/starcasino-nl]] — mentioned in PDF

## Where it's cited in this wiki
- [[../concepts/domain-classification]]
- [[../concepts/affiliate-detection]]
- [[../concepts/competitor-thief-detection]]
- [[../concepts/classifier-scoring]]
- [[../comparisons/affiliate-vs-brand-thief-signals]]
