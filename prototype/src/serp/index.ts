import { config } from "../config.js";
import type { SerpResult, SerpSource } from "../types.js";
import { fetchSerpApi } from "./serpapi-provider.js";
import { fetchPlaywright } from "./playwright-provider.js";
import { fetchMock } from "./mock-provider.js";

export interface SerpFetchOptions {
  query: string;
  geo: string;
  limit: number;
}

export async function fetchSerp(opts: SerpFetchOptions): Promise<SerpResult[]> {
  const source: SerpSource = config.SERP_SOURCE;
  switch (source) {
    case "serpapi":
      return fetchSerpApi(opts);
    case "playwright":
      return fetchPlaywright(opts);
    case "mock":
      return fetchMock(opts);
  }
}

export { fetchSerpApi, fetchPlaywright, fetchMock };
