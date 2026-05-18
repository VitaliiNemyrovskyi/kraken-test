import { config } from "../config.js";
import { fetchSerp } from "../serp/index.js";
import { scrapePage, closeBrowser } from "../scraper/page-scraper.js";
import { classify } from "../classifier/index.js";
import { saveSnapshot } from "../storage/db.js";
import type { AnalyzedResult } from "../types.js";

async function main() {
  const useMockFixture = config.SERP_SOURCE === "mock";
  console.log(
    `[analyze] query="${config.QUERY}" geo="${config.GEO}" source=${config.SERP_SOURCE} limit=${config.SERP_LIMIT}`,
  );

  const serpResults = await fetchSerp({
    query: config.QUERY,
    geo: config.GEO,
    limit: config.SERP_LIMIT,
  });
  console.log(`[analyze] fetched ${serpResults.length} SERP results`);

  const analyzed: AnalyzedResult[] = [];
  for (const serp of serpResults) {
    process.stdout.write(`  [${serp.position}] ${serp.domain.padEnd(30)} ...`);
    const scraped = await scrapePage(serp, { useMockFixture });
    const classification = await classify(scraped);
    process.stdout.write(
      ` ${classification.category} (${classification.confidence.toFixed(2)})\n`,
    );
    analyzed.push({ serp, scraped, classification });
  }

  const snapshotId = saveSnapshot(
    config.QUERY,
    config.GEO,
    config.BRAND_DOMAIN,
    config.SERP_SOURCE,
    analyzed,
  );
  console.log(`[analyze] saved snapshot #${snapshotId}`);

  // Distribution summary
  const counts: Record<string, number> = {};
  for (const r of analyzed) {
    counts[r.classification.category] = (counts[r.classification.category] ?? 0) + 1;
  }
  console.log("\n[analyze] distribution:");
  for (const [cat, n] of Object.entries(counts)) {
    const pct = ((n / analyzed.length) * 100).toFixed(0);
    console.log(`  ${cat.padEnd(25)} ${n}/${analyzed.length}  (${pct}%)`);
  }

  await closeBrowser();
}

main().catch((err) => {
  console.error("[analyze] fatal:", err);
  process.exit(1);
});
