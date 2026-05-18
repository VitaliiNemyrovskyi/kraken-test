import type { ClassificationResult, ScrapedPage } from "../types.js";
import { extractSignals } from "./rules.js";
import { combineWithLlm, scoreSignals } from "./scoring.js";
import { classifyWithLlm } from "./llm.js";

export async function classify(page: ScrapedPage): Promise<ClassificationResult> {
  const signals = extractSignals(page);
  const ruleVerdict = scoreSignals(signals);
  const llmVerdict = await classifyWithLlm(page);
  return combineWithLlm(ruleVerdict, llmVerdict);
}
