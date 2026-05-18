import { scheduler } from "./scheduler.js";
import { startServer } from "./dashboard/server.js";
import { closeBrowser } from "./scraper/page-scraper.js";

const SCHEDULE = process.env.MONITOR_CRON ?? "0 */6 * * *";
const RUN_ON_START = process.env.RUN_ON_START !== "false";

await startServer();

const { ok, error } = scheduler.start(SCHEDULE);
if (!ok) {
  console.error(`[monitor] invalid MONITOR_CRON: "${SCHEDULE}" (${error})`);
  process.exit(1);
}

if (RUN_ON_START) {
  setTimeout(() => void scheduler.tick("on-start"), 500);
}

const shutdown = async () => {
  console.log("\n[monitor] shutting down…");
  scheduler.stop();
  await closeBrowser();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
