// Worker container entry point.
// Owns the scheduler (cron), analyze pipeline, scraper, classifier, and
// enrichment. Communicates with the web container only via SQLite.

import { closeBrowser } from "./scraper/page-scraper.js";
import { scheduler } from "./scheduler.js";

const INITIAL_CRON = process.env.MONITOR_CRON ?? "0 */6 * * *";
const RUN_ON_START = process.env.RUN_ON_START !== "false";
const POLL_MS = Number.parseInt(process.env.WORKER_POLL_MS ?? "2000", 10);

console.log(`[worker] starting supervisor (poll=${POLL_MS}ms, initial_cron="${INITIAL_CRON}", run_on_start=${RUN_ON_START})`);

const shutdown = async () => {
  console.log("[worker] shutting down…");
  await closeBrowser();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await scheduler.runSupervisor({
  pollIntervalMs: POLL_MS,
  initialCron: INITIAL_CRON === "off" ? null : INITIAL_CRON,
  runOnStart: RUN_ON_START,
});
