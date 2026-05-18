import OpenAI from "openai";
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

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: config.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/kraken-leads/test-task",
        "X-Title": "Kraken Leads — StarCasino Monitor",
      },
    });
  }
  return client;
}

export async function classifyWithLlm(
  page: ScrapedPage,
): Promise<LlmVerdict | null> {
  if (!llmEnabled) return null;
  try {
    const completion = await getClient().chat.completions.create({
      model: config.OPENROUTER_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(page) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 400,
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw);
    const validated = llmSchema.parse(parsed);
    return validated;
  } catch (err) {
    console.warn(`[llm] classify failed: ${(err as Error).message}`);
    return null;
  }
}
