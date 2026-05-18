import { z } from "zod";
import { config, llmEnabled } from "../config.js";
import type { LlmVerdict, ScrapedPage } from "../types.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts.js";

const llmSchema = z.object({
  category: z.enum(["official", "affiliate", "competitor_brand_thief", "unclear"]),
  confidence: z.number().min(0).max(1),
  explanation: z.string().max(500),
  signals_observed: z.array(z.string()).default([]),
});

// Direct fetch against OpenRouter — we deliberately avoid the openai SDK so
// real HTTP errors (4xx response body, DNS, TLS) surface in logs instead of
// being collapsed into the SDK's generic "Connection error.".
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 45_000;

export async function classifyWithLlm(
  page: ScrapedPage,
  brandDomain: string,
): Promise<LlmVerdict | null> {
  if (!llmEnabled) return null;

  const body = {
    model: config.OPENROUTER_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(page, brandDomain) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 400,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/kraken-leads/test-task",
        "X-Title": "Kraken Leads — StarCasino Monitor",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        `[llm] http ${res.status} ${res.statusText} model="${config.OPENROUTER_MODEL}" body=${text.slice(0, 400)}`,
      );
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? "";
    if (!raw) {
      console.warn(`[llm] empty completion: ${JSON.stringify(data).slice(0, 300)}`);
      return null;
    }
    return llmSchema.parse(JSON.parse(raw));
  } catch (err) {
    const e = err as Error & { cause?: { code?: string; message?: string } };
    const causeDetail = e.cause ? ` cause=${e.cause.code ?? ""}:${e.cause.message ?? ""}` : "";
    console.warn(`[llm] classify failed: ${e.name}: ${e.message}${causeDetail}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
