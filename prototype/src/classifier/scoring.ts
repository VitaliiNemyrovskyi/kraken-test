import type {
  Category,
  ClassificationResult,
  LlmVerdict,
  RuleScores,
  RuleSignals,
  RuleVerdict,
} from "../types.js";

const THRESHOLD = 40;
const RULE_WEIGHT = 0.6;
const LLM_WEIGHT = 0.4;

export function scoreSignals(signals: RuleSignals): RuleVerdict {
  const scores: RuleScores = {
    official: 0,
    affiliate: 0,
    competitor_brand_thief: 0,
    unclear: 0,
  };
  const reasons: string[] = [];

  // Official — domain match wins decisively
  if (signals.isStarOfficial) {
    scores.official += 100;
    reasons.push("page_domain_is_brand");
  }

  // Affiliate signals
  if (signals.starLinkRatio >= 0.5 && signals.hasAffParamsToStar) {
    scores.affiliate += 60;
    reasons.push("brand_link_ratio_high_with_aff_params");
  }
  if (signals.primaryCtaTarget === "star" && signals.redirectsToStar) {
    scores.affiliate += 50;
    reasons.push("cta_resolves_to_brand");
  }

  // Competitor brand thief signals
  if (signals.compLinkRatio >= 0.4 && signals.hasAffParamsToComp) {
    scores.competitor_brand_thief += 70;
    reasons.push("competitor_link_ratio_high_with_aff_params");
  }
  if (
    signals.primaryCtaTarget === "competitor" &&
    signals.brandMentionsInText >= 3
  ) {
    scores.competitor_brand_thief += 60;
    reasons.push("cta_to_competitor_with_brand_mentions");
  }
  if (signals.redirectsToComp) {
    scores.competitor_brand_thief += 30;
    reasons.push("redirect_resolves_to_competitor");
  }

  // Dual-promote tiebreak — competitor leans win (ADR-008)
  if (signals.hasAffParamsToStar && signals.hasAffParamsToComp) {
    scores.affiliate += 25;
    scores.competitor_brand_thief += 35;
    reasons.push("dual_promote_thief_leans_win");
  }

  // Unclear — brand mention without monetisation
  if (
    signals.brandMentionsInText >= 1 &&
    signals.outboundCasinoLinks === 0 &&
    !signals.isStarOfficial
  ) {
    scores.unclear += 30;
    reasons.push("brand_mention_no_monetisation");
  }

  return { scores, signals };
}

export function combineWithLlm(
  rule: RuleVerdict,
  llm: LlmVerdict | null,
): ClassificationResult {
  // When LLM is disabled, rule scores act on their own (weight 1.0).
  // When LLM is enabled, fuse 60/40.
  const ruleW = llm ? RULE_WEIGHT : 1.0;
  const llmW = llm ? LLM_WEIGHT : 0;
  const llmCategory = llm?.category ?? null;
  const llmContribution = (cat: Category): number =>
    !llm || llmCategory !== cat ? 0 : llm.confidence * 100;

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
    explanationParts.push(`LLM: ${llm.category} (${llm.confidence.toFixed(2)}) — ${llm.explanation}`);
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
