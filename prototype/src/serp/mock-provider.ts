import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { SerpResult } from "../types.js";
import type { SerpFetchOptions } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(__dirname, "../../data/mock-serp.json");

interface MockFixture {
  query: string;
  geo: string;
  results: SerpResult[];
  _scraped: Record<string, unknown>;
}

let cached: MockFixture | null = null;

export function loadFixture(): MockFixture {
  if (!cached) {
    cached = JSON.parse(readFileSync(FIXTURE_PATH, "utf-8")) as MockFixture;
  }
  return cached;
}

export async function fetchMock(opts: SerpFetchOptions): Promise<SerpResult[]> {
  const fixture = loadFixture();
  return fixture.results.slice(0, opts.limit);
}
