import { getJson } from "serpapi";
import { config, hasSerpApiKey } from "../config.js";
import type { SerpResult } from "../types.js";
import type { SerpFetchOptions } from "./index.js";

interface OrganicResult {
  position?: number;
  link?: string;
  displayed_link?: string;
  title?: string;
  snippet?: string;
}

function etld1(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    return parts.slice(-2).join(".");
  } catch {
    return "";
  }
}

export async function fetchSerpApi(
  opts: SerpFetchOptions,
): Promise<SerpResult[]> {
  if (!hasSerpApiKey) {
    throw new Error(
      "SERPAPI_KEY not configured. Set it in .env or switch SERP_SOURCE=mock for offline demo.",
    );
  }
  const response = (await getJson({
    engine: "google",
    q: opts.query,
    location: opts.geo,
    google_domain: config.GOOGLE_DOMAIN,
    hl: config.HL,
    gl: config.GL,
    num: opts.limit,
    api_key: config.SERPAPI_KEY,
  })) as { organic_results?: OrganicResult[] };

  const organic = response.organic_results ?? [];
  return organic.slice(0, opts.limit).map((r, i) => ({
    position: r.position ?? i + 1,
    url: r.link ?? "",
    domain: etld1(r.link ?? ""),
    title: r.title ?? "",
    snippet: r.snippet ?? "",
  }));
}
