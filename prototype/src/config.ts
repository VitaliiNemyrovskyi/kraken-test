import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  SERP_SOURCE: z.enum(["serpapi", "playwright", "mock"]).default("mock"),
  SERPAPI_KEY: z.string().default(""),
  BRAND_DOMAIN: z.string().default("starcasino.nl"),
  QUERY: z.string().default("starcasino"),
  GEO: z.string().default("Netherlands"),
  GOOGLE_DOMAIN: z.string().default("google.nl"),
  HL: z.string().default("nl"),
  GL: z.string().default("nl"),
  SERP_LIMIT: z.coerce.number().int().min(1).max(50).default(10),
  CLASSIFIER_LLM_ENABLED: z.coerce.boolean().default(true),
  OPENROUTER_API_KEY: z.string().default(""),
  OPENROUTER_MODEL: z.string().default("anthropic/claude-opus-4-7"),
  SCRAPER_TIMEOUT_MS: z.coerce.number().int().min(1000).default(15000),
  SCRAPER_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(3),
  SCRAPER_RATE_PER_DOMAIN_MS: z.coerce.number().int().min(0).default(1000),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default("127.0.0.1"),
  DATABASE_PATH: z.string().default("./data/starcasino.db"),
});

export const config = schema.parse(process.env);

export const hasSerpApiKey = config.SERPAPI_KEY.length > 0;
export const hasOpenRouterKey = config.OPENROUTER_API_KEY.length > 0;
export const llmEnabled = config.CLASSIFIER_LLM_ENABLED && hasOpenRouterKey;
