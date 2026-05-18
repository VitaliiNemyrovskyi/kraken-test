import type {
  Category,
  ClassificationResult,
  LlmVerdict,
  RuleScores,
  RuleSignals,
  RuleVerdict,
} from "../types.js";

// THRESHOLD lowered from 40 → 30 to surface tentative verdicts when only
// SERP-level signals fire (e.g. lookalike domain, review-portal title) and
// the page scrape returned no CTA/outbound data. Anything below threshold
// still falls through to "unclear".
const THRESHOLD = 30;
const RULE_WEIGHT = 0.6;
const LLM_WEIGHT = 0.4;

export function scoreSignals(signals: RuleSignals): RuleVerdict {
  const scores: RuleScores = {
    official: 0,
    affiliate: 0,
    competitor_brand_thief: 0,
    unclear: 0,
  };

  // ───── Official ─────
  // R1: page IS the brand domain → decisive
  if (signals.isStarOfficial) scores.official += 100;

  // ───── Competitor brand thief — high-priority (detect first) ─────
  // R2: page IS itself a known competitor casino → direct SEO theft of brand slot
  if (signals.pageDomainIsCompetitor) scores.competitor_brand_thief += 90;

  // R3: anchor text says brand, href resolves to competitor → cloaking
  if (signals.ctaAnchorHrefMismatch) scores.competitor_brand_thief += 60;

  // R4: outbound link mix dominated by competitor casinos with aff params
  if (signals.compLinkRatio >= 0.4 && signals.hasAffParamsToComp) {
    scores.competitor_brand_thief += 70;
  }

  // R5: CTA target is competitor + brand visible in main text (deliberate SERP-stuffing)
  if (
    signals.primaryCtaTarget === "competitor" &&
    signals.brandMentionsInText >= 3
  ) {
    scores.competitor_brand_thief += 60;
  }

  // R6: redirect chain ends at competitor casino domain
  if (signals.redirectsToComp) scores.competitor_brand_thief += 30;

  // ───── Affiliate ─────
  // R7: most outbound links go to brand and at least one is tagged with aff param
  if (signals.starLinkRatio >= 0.5 && signals.hasAffParamsToStar) {
    scores.affiliate += 60;
  }

  // R8: primary CTA after redirect resolution lands on brand domain
  if (signals.primaryCtaTarget === "star" && signals.redirectsToStar) {
    scores.affiliate += 50;
  }

  // R9: visible affiliate disclosure (per EU consumer directive / FTC)
  // Positive signal for legitimate affiliate — never enough alone, but
  // confidence-builder for affiliate verdict.
  if (signals.hasAffiliateDisclosure && (signals.starLinkRatio > 0 || signals.redirectsToStar)) {
    scores.affiliate += 15;
  }

  // ───── Dual-promote tiebreak (ADR-008) — competitor leans win ─────
  if (signals.hasAffParamsToStar && signals.hasAffParamsToComp) {
    scores.affiliate += 25;
    scores.competitor_brand_thief += 35;
  }

  // ───── SERP-level signals (work without scraped CTA/outbound data) ─────
  // R11: page domain contains brand stem but isn't brand domain →
  // typosquat / brand-cousin pattern. Default to affiliate (the common case
  // economically); also bump thief so LLM can break the tie. Excluded for
  // pages already classified as official or known competitor.
  if (
    signals.domainContainsBrandStem &&
    !signals.isStarOfficial &&
    !signals.pageDomainIsCompetitor
  ) {
    scores.affiliate += 45;
    scores.competitor_brand_thief += 30;
  }

  // R12: title fits review-portal / listicle shape on a non-brand domain →
  // affiliate prior (review portals monetise via affiliate commissions).
  if (
    signals.titleSuggestsReviewPortal &&
    !signals.isStarOfficial &&
    !signals.pageDomainIsCompetitor
  ) {
    scores.affiliate += 30;
  }

  // ───── Unclear ─────
  // R10: brand mention without monetisation (informational: Wikipedia, news)
  if (
    signals.brandMentionsInText >= 1 &&
    signals.outboundCasinoLinks === 0 &&
    !signals.isStarOfficial &&
    !signals.pageDomainIsCompetitor
  ) {
    scores.unclear += 30;
  }

  return { scores, signals };
}

export function combineWithLlm(
  rule: RuleVerdict,
  llm: LlmVerdict | null,
): ClassificationResult {
  // LLM "unclear" is normally treated as abstention, not a vote against
  // other categories — "I don't know" should not suppress a confident rule
  // signal (rule weight then goes to 1.0). EXCEPT when the LLM is very
  // confident in "unclear" (≥0.80) — review aggregators like Trustpilot,
  // Wikipedia, App Store listings score this confidently because they
  // genuinely have no monetisation signal, and the rule-only SERP-pattern
  // heuristic (R12 review-portal) over-fires on them otherwise.
  const llmAbstains =
    !llm || (llm.category === "unclear" && llm.confidence < 0.8);
  const ruleW = llmAbstains ? 1.0 : RULE_WEIGHT;
  const llmW = llmAbstains ? 0 : LLM_WEIGHT;
  const llmCategory = llm?.category ?? null;
  const llmContribution = (cat: Category): number =>
    llmAbstains || llmCategory !== cat ? 0 : (llm as LlmVerdict).confidence * 100;

  const combined: RuleScores = {
    official: ruleW * rule.scores.official + llmW * llmContribution("official"),
    affiliate: ruleW * rule.scores.affiliate + llmW * llmContribution("affiliate"),
    competitor_brand_thief:
      ruleW * rule.scores.competitor_brand_thief +
      llmW * llmContribution("competitor_brand_thief"),
    unclear: ruleW * rule.scores.unclear + llmW * llmContribution("unclear"),
  };

  const sorted = (Object.entries(combined) as [Category, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const top = sorted[0]!;
  const winnerCategory = top[0];
  const winnerScore = top[1];

  let finalCategory: Category;
  let confidence: number;
  if (winnerScore < THRESHOLD) {
    finalCategory = "unclear";
    confidence = 0.0;
  } else {
    finalCategory = winnerCategory;
    confidence = Math.min(1, winnerScore / 100);
  }

  const explanationParts: string[] = [];
  explanationParts.push(
    `Rule scores: official=${rule.scores.official}, affiliate=${rule.scores.affiliate}, thief=${rule.scores.competitor_brand_thief}, unclear=${rule.scores.unclear}.`,
  );
  if (llm) {
    const tag = llmAbstains ? "abstained" : "voted";
    explanationParts.push(
      `LLM ${tag}: ${llm.category} (${llm.confidence.toFixed(2)}) - ${llm.explanation}`,
    );
  } else {
    explanationParts.push("LLM: disabled.");
  }
  explanationParts.push(
    `Final: ${finalCategory} (combined=${winnerScore.toFixed(1)}, threshold=${THRESHOLD}).`,
  );

  return {
    category: finalCategory,
    confidence,
    ruleVerdict: rule,
    llmVerdict: llm,
    explanation: explanationParts.join(" "),
  };
}
