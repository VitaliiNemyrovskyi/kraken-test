// Web container entry point.
// Pure Fastify — serves static UI + JSON API. No scheduler, no scraper,
// no Playwright. All control-plane commands write to the
// `scheduler_control` table, which the worker container polls.

import { createApp } from "./dashboard/server.js";
import { config } from "./config.js";

const app = await createApp();
await app.listen({ port: config.PORT, host: config.HOST });
console.log(
  `\n  Web at http://${config.HOST}:${config.PORT}\n  Default query: "${config.QUERY}" / geo: ${config.GEO}\n`,
);
