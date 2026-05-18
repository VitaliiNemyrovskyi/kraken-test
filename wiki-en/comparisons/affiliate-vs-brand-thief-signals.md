---
title: Affiliate vs Competitor Brand Thief — complete signals reference
category: comparison
summary: 11 classifier signals with weights; analysis of 6 real branded-SERP patterns; how to tell a proper affiliate (drives traffic to brand) apart from a competitor brand thief (steals traffic to competitors)
tags: [task2, classification, signals, critical, deliverable]
sources: 1
updated: 2026-05-18
lang: en
mirror: ../../wiki/comparisons/affiliate-vs-brand-thief-signals.md
---

# Affiliate vs Competitor Brand Thief — signals

> This is the primary document answering the PDF question: **"what signals will be used to determine the site category… it must be clear how the system will automatically distinguish a partner site that drives traffic to StarCasino from a site that uses the brand to redirect users to other products"**.

## TL;DR — the decisive criterion

**Final domain of monetised links after redirect resolution.** Everything else is either confirmation or anti-evasion:

- **Proper affiliate:** the redirect chain of the primary CTA ends at `starcasino.nl` with an affiliate parameter → the brand monetises, the affiliate earns commission.
- **Competitor brand thief:** the chain ends at a different KSA-licensed casino (TonyBet, JACKS, Holland Casino, BetCity, Unibet, …) with an affiliate parameter → the competitor monetises, the brand **loses** the user.

A page can mention "StarCasino" 20 times in H1/title/body — if the CTA resolves to JACKS, **it's a thief**. Conversely: a page can have one tracked brand link with minimal body text — if it's the primary CTA with an aff param, **it's an affiliate**.

---

## 11 classifier signals with weights

Implemented in [`prototype/src/classifier/{rules,scoring}.ts`](../../prototype/src/classifier/).

| # | Signal | Direction | Score | Logic |
|---|---|---|---|---|
| **R1** | `pageDomain === 'starcasino.nl'` | `official` | **+100** | Decisive: the domain is the brand |
| **R2** | `pageDomain ∈ COMPETITOR_CASINOS` | `thief` | **+90** | The competitor's own site ranks on the brand query — direct SEO theft of the SERP slot, no redirect needed |
| **R3** | `ctaAnchorMentionsBrand AND redirectFinalDomain ∈ COMPETITOR` | `thief` | **+60** | **Cloaking**: CTA anchor text says "Play at StarCasino" but the href resolves to JACKS/TonyBet. The most insidious pattern |
| **R4** | `compLinkRatio ≥ 0.4 AND hasAffParamsToComp` | `thief` | **+70** | Most outbound links go to competitors with affiliate parameters |
| **R5** | `primaryCtaTarget='competitor' AND brandMentions ≥ 3` | `thief` | **+60** | The page SEO-stuffs the brand but the primary CTA targets a competitor |
| **R6** | `redirectsToComp` (final domain is a competitor) | `thief` | **+30** | Reinforcing signal; stacks with R3-R5 |
| **R7** | `starLinkRatio ≥ 0.5 AND hasAffParamsToStar` | `affiliate` | **+60** | Most outbound links go to the brand with aff params |
| **R8** | `primaryCtaTarget='star' AND redirectsToStar` | `affiliate` | **+50** | Primary CTA after redirect resolution lands on the brand |
| **R9** | `hasAffiliateDisclosure AND (starLinks > 0 OR redirectsToStar)` | `affiliate` | **+15** | Visible disclosure ("partnerlink", "we earn commission", "in samenwerking met") + brand traffic = legitimate affiliate (EU consumer directive / FTC) |
| **R10** | Dual-promote (aff params on brand **and** on competitor) | `+25 aff`, `+35 thief` | tiebreak | thief leans win (ADR-008): even partial diversion is brand harm |
| **R11** | `brandMention ≥ 1 AND outboundCasinoLinks = 0` | `unclear` | **+30** | Informational mention without monetisation (Wikipedia, news) |

**Decision:** `argmax(combined_score)` where `combined = 0.6*rule + 0.4*llm` (or `rule*1.0` when LLM is disabled). If max < 40 → `unclear`. Details in [[../concepts/classifier-scoring]].

---

## 6 real patterns — how the classifier handles each

### Pattern 1: Proper affiliate (review-style)

**What it is:** authentic StarCasino review with a CTA button → starcasino.nl carrying a btag.

**Mock example:** `casino.nl` — "StarCasino review 2026 — bonus, games, payouts"
- 2 outbound links, both to `starcasino.nl`, both with aff params (`btag=cas-nl-12345`, `aff_id=cas-nl`)
- Primary CTA: "Play at StarCasino" → `starcasino.nl/?btag=cas-nl-12345`
- Disclosure: "Disclosure: this is an affiliate review — we earn commission"

**Firing signals:** R7 (+60), R8 (+50), R9 (+15) → affiliate score = 125 → confidence 1.00.

### Pattern 2: Alternatives listicle (classic thief)

**What it is:** "StarCasino alternatives" — article that mentions the brand only in the title to win the SERP, with all CTAs pointing to competitors with affiliate parameters.

**Mock example:** `bestecasinos.nl` — "StarCasino alternatives — 5 best casinos"
- 3 outbound to JACKS / BetCity / Holland Casino, all with aff params
- Primary CTA: "Play at JACKS" → `jacks.nl?aff_id=bc-jck-002`
- Brand mention only in title

**Signals:** R4 (+70), R5 (+60), R6 (+30) → thief score = 160 → confidence 1.00.

### Pattern 3: Bonus aggregator with competitor focus (thief)

**What it is:** bonus-aggregator site mentioning StarCasino but with the primary CTA going to a competitor with a better bonus.

**Mock example:** `casinoz.nl` — "StarCasino bonus code 2026"
- 4 outbound: 3 with aff params to Unibet/Toto/711, 1 to starcasino.nl without params
- Primary CTA: "Unibet €200" → `unibet.nl?btag=cz-u-01`
- High brand mention frequency

**Signals:** R4 (+70), R5 (+60) → thief score = 130 → confidence 1.00.

### Pattern 4: Cloaking (anchor / href mismatch) ⚠️

**What it is:** the CTA anchor text says "Play at StarCasino" — the user thinks they're going to the brand. But the href resolves to TonyBet. They only notice after the click.

**Mock example:** `shadyreview.nl` — "StarCasino experiences 2026"
- Primary CTA anchor: **"Play now at StarCasino →"**
- Primary CTA href: `go.shadyreview.nl/r?id=star` → redirect chain → `tonybet.nl?aff_id=shady-555`
- 4 brand mentions in body

**Signals:** R3 (+60), R5 (+60), R6 (+30) → thief score = 150 → confidence 1.00.

> **This is the most important edge case** — catches deceptive UX that a naïve classifier would miss (anchor → brand, all link-ratio signals point affiliate). Decisive: **the chain's final destination**, not the anchor text.

### Pattern 5: Direct competitor's own site (domain theft)

**What it is:** a competitor's site (e.g. `tonybet.nl`) ranks on the `starcasino` query directly. No outbound links, no redirects — just SEO-stuffing on the brand to win the SERP slot.

**Mock example:** `tonybet.nl` ranking on "starcasino"
- pageDomain = tonybet.nl ∈ COMPETITOR_CASINOS
- All outbound links internal
- No redirect, no aff params

**Signals:** R2 (+90) → thief score = 90 → confidence 0.90.

> Other classifiers fail here — outbound link analysis sees nothing suspicious. But **the domain itself is the threat**.

### Pattern 6: Informational (unclear)

**What it is:** Wikipedia, news article, regulator page — brand mention without monetisation.

**Mock example:** `nl.wikipedia.org/wiki/StarCasino`
- 2 outbound: kansspelautoriteit.nl, starcasino.nl — no aff params
- No primary CTA
- Encyclopedic mention only

**Signals:** R11 (+30) — below threshold 40 → `unclear` confidence 0.00.

---

## What we miss (false-negative risks)

| Scenario | Why we miss | Mitigation |
|---|---|---|
| Affiliate without aff params (server-side cookie attribution) | R7/R8 require aff params | LLM (Layer 4) can catch via intent. In production — sync with brand's affiliate platform |
| Multi-brand affiliate (StarCasino + 5 others, all with aff) | Dual-promote → thief by default | ADR-008: thief leans win intentionally — even partial diversion is brand harm |
| Blocked scraper / 404 / parked domain | Scrape failure → unclear | Log + retry; LLM on SERP snippet only |
| Brand spelling variants ("st@rcasino", typos) | Regex `/star\s*casino/gi` misses | LLM (Layer 4) catches semantic match |

---

## Anti-cloaking defences (deeper dive)

Cloaking = serving different content to different user-agents. Defences:

1. **Realistic User-Agent + locale.** Playwright impersonates `KrakenLeads-Monitor/0.1` with NL locale. If the site serves different HTML — red flag.
2. **JavaScript-rendered redirects.** Playwright executes JS, so `window.location = …` redirects are caught.
3. **Anchor/href mismatch** (R3) — when the anchor text says "StarCasino" but the href resolves to a competitor, that's a cloaking pattern even without JS.
4. **Redirect chain capture** — record hops + intermediate domains. Chains > 2 hops through an unknown shortener (e.g. `go.shadyreview.nl`) → suspicious.
5. **LLM as sanity check** — structured prompt with few-shot examples (Layer 4 backup).

---

## End-to-end pipeline

```
SERP fetch (SerpAPI) → top-10 URLs

  For each URL:
    Playwright scrape page (JS-rendered HTML)
    Extract outbound links + primary CTA + main text
    Resolve redirect chain on CTA (HEAD-follow up to 5 hops, 10s budget)
    Detect: anchor text, affiliate disclosure, brand mentions

  For each scraped page:
    Run rules.ts:extractSignals → 15 signals
    Run scoring.ts:scoreSignals → 4 category scores (R1-R11)
    Run classifier/llm.ts:classifyWithLlm → LLM verdict (6-shot examples, JSON output)
    combineWithLlm → argmax(combined_score), threshold 40

  Persist snapshot → SQLite
  Update domain_history.category_changes (for drift detection)
```

---

## Related

- [[../concepts/classifier-scoring]] — full decision matrix + threshold rationale
- [[../concepts/affiliate-detection]] — affiliate signal detail
- [[../concepts/competitor-thief-detection]] — thief signal detail
- [[../concepts/adr-008-dual-promote-tiebreak]] (forward ref) — why thief leans win
- [[../entities/nl-competitor-casinos]] (forward ref) — current competitor list
- [[../synthesis/task-2-answer]] — primary deliverable view

## Sources

- [[../sources/kraken-leads-test-task]] — PDF Task 2 ("signals to determine site category")
- Implementation: [`prototype/src/classifier/`](../../prototype/src/classifier/)
- Mock fixture with all 6 patterns: [`prototype/data/mock-serp.json`](../../prototype/data/mock-serp.json)
