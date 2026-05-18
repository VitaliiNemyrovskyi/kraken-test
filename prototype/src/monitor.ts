// Legacy alias — same as `npm run dashboard` since v0.3.
// Kept for backwards compatibility with documentation; the dashboard
// server now auto-starts the scheduler from MONITOR_CRON env.
import { startServer } from "./dashboard/server.js";
import { closeBrowser } from "./scraper/page-scraper.js";
import { scheduler } from "./scheduler.js";

await startServer();

const shutdown = async () => {
  console.log("\n[monitor] shutting down…");
  scheduler.stop();
  await closeBrowser();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
