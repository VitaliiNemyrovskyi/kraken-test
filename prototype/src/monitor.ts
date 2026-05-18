import cron from "node-cron";
import { runAnalyze } from "./analyze/run.js";
import { startServer } from "./dashboard/server.js";
import { closeBrowser } from "./scraper/page-scraper.js";

// Cron expression (5- or 6-field). Default = every 6 hours.
// For demo: `MONITOR_CRON="*/2 * * * *"` (every 2 minutes).
const SCHEDULE = process.env.MONITOR_CRON ?? "0 */6 * * *";
const RUN_ON_START = process.env.RUN_ON_START !== "false";

let busy = false;
async function tick(reason: string) {
  if (busy) {
    console.log(`[monitor] skipping ${reason} — previous run still in flight`);
    return;
  }
  busy = true;
  const t0 = Date.now();
  try {
    console.log(`[monitor] tick (${reason}) at ${new Date().toISOString()}`);
    const result = await runAnalyze();
    console.log(
      `[monitor] done — snapshot #${result.snapshotId} (${result.total} results, ${Date.now() - t0}ms)`,
    );
  } catch (err) {
    console.error(`[monitor] tick failed:`, (err as Error).message);
  } finally {
    busy = false;
  }
}

if (!cron.validate(SCHEDULE)) {
  console.error(`[monitor] invalid cron: "${SCHEDULE}"`);
  process.exit(1);
}

await startServer();
cron.schedule(SCHEDULE, () => void tick("cron"));
console.log(`[monitor] scheduled with cron: "${SCHEDULE}"`);

if (RUN_ON_START) {
  setTimeout(() => void tick("on-start"), 500);
}

// Graceful shutdown
const shutdown = async () => {
  console.log("\n[monitor] shutting down…");
  await closeBrowser();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
