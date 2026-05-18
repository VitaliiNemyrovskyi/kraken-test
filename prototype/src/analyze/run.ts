import { pathToFileURL } from "node:url";
import { config } from "../config.js";
import { fetchSerp } from "../serp/index.js";
import { scrapePage, closeBrowser } from "../scraper/page-scraper.js";
import { classify } from "../classifier/index.js";
import { listKeywords, saveSnapshot } from "../storage/db.js";
import { enrichDomains } from "../enrichment/index.js";
import type { AnalyzedResult } from "../types.js";

export interface AnalyzeOptions {
  query: string;
  geo: string;
  brand: string;
}

export interface AnalyzeResult {
  snapshotId: number;
  query: string;
  geo: string;
  brand: string;
  counts: Record<string, number>;
  total: number;
}

export async function runAnalyze(opts?: Partial<AnalyzeOptions>): Promise<AnalyzeResult> {
  const query = opts?.query ?? config.QUERY;
  const geo = opts?.geo ?? config.GEO;
  const brand = opts?.brand ?? config.BRAND_DOMAIN;
  const useMockFixture = config.SERP_SOURCE === "mock";
  console.log(
    `[analyze] query="${query}" geo="${geo}" brand="${brand}" source=${config.SERP_SOURCE} limit=${config.SERP_LIMIT}`,
  );

  const serpResults = await fetchSerp({ query, geo, limit: config.SERP_LIMIT });
  console.log(`[analyze] fetched ${serpResults.length} SERP results`);

  const analyzed: AnalyzedResult[] = [];
  for (const serp of serpResults) {
    process.stdout.write(`  [${serp.position}] ${serp.domain.padEnd(30)} ...`);
    const scraped = await scrapePage(serp, { useMockFixture, brandDomain: brand });
    const classification = await classify(scraped, { brandDomain: brand });
    process.stdout.write(
      ` ${classification.category} (${classification.confidence.toFixed(2)})\n`,
    );
    analyzed.push({ serp, scraped, classification });
  }

  const snapshotId = saveSnapshot(query, geo, brand, config.SERP_SOURCE, analyzed);
  console.log(`[analyze] saved snapshot #${snapshotId}`);

  // Enrichment: WHOIS + traffic estimate, parallel, cached 7 days. Best-effort.
  const domains = analyzed.map((r) => r.serp.domain);
  process.stdout.write("[analyze] enriching domains …");
  const enrichments = await enrichDomains(domains);
  process.stdout.write(` ok (${enrichments.length}/${domains.length})\n`);

  const counts: Record<string, number> = {};
  for (const r of analyzed) {
    counts[r.classification.category] = (counts[r.classification.category] ?? 0) + 1;
  }
  console.log("[analyze] distribution:");
  for (const [cat, n] of Object.entries(counts)) {
    const pct = ((n / analyzed.length) * 100).toFixed(0);
    console.log(`  ${cat.padEnd(25)} ${n}/${analyzed.length}  (${pct}%)`);
  }

  return { snapshotId, query, geo, brand, counts, total: analyzed.length };
}

// Runs analyze for every keyword tracked in the DB.
// Called by the scheduler on each tick. Returns aggregated results.
export async function runAnalyzeAllKeywords(): Promise<AnalyzeResult[]> {
  const keywords = listKeywords();
  // If no keywords yet, fall back to env defaults (bootstrap case).
  if (keywords.length === 0) {
    return [await runAnalyze()];
  }
  const results: AnalyzeResult[] = [];
  for (const kw of keywords) {
    try {
      results.push(await runAnalyze({ query: kw.query, geo: kw.geo, brand: kw.brand }));
    } catch (err) {
      console.error(
        `[analyze] failed for "${kw.query}" / ${kw.geo}: ${(err as Error).message}`,
      );
    }
  }
  return results;
}

// Run as standalone script — uses env defaults (single-keyword behaviour)
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runAnalyze()
    .then(() => closeBrowser())
    .catch((err) => {
      console.error("[analyze] fatal:", err);
      process.exit(1);
    });
}
