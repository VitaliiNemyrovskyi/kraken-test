import type { ClassificationResult, ScrapedPage } from "../types.js";
import { extractSignals } from "./rules.js";
import { combineWithLlm, scoreSignals } from "./scoring.js";
import { classifyWithLlm } from "./llm.js";

export interface ClassifyContext {
  brandDomain: string;
}

export async function classify(
  page: ScrapedPage,
  ctx: ClassifyContext,
): Promise<ClassificationResult> {
  const signals = extractSignals(page, ctx.brandDomain);
  const ruleVerdict = scoreSignals(signals);
  const llmVerdict = await classifyWithLlm(page, ctx.brandDomain);
  return combineWithLlm(ruleVerdict, llmVerdict);
}
