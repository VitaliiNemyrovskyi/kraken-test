import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { config } from "../config.js";
import { scheduler } from "../scheduler.js";
import {
  getCategorySummary,
  getDomainsByCategory,
  getHistory,
  getLatestSnapshot,
} from "../storage/db.js";
import type { Category } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: "info" } });

  await app.register(fastifyStatic, {
    root: resolve(__dirname, "./public"),
    prefix: "/",
  });

  app.get("/api/summary", async (req) => {
    const { query = config.QUERY, geo = config.GEO } = req.query as {
      query?: string;
      geo?: string;
    };
    const counts = getCategorySummary(query, geo);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const percentages: Record<Category, number> = {
      official: 0,
      affiliate: 0,
      competitor_brand_thief: 0,
      unclear: 0,
    };
    if (total > 0) {
      for (const cat of Object.keys(counts) as Category[]) {
        percentages[cat] = Math.round((counts[cat] / total) * 1000) / 10;
      }
    }
    return { query, geo, total, counts, percentages };
  });

  app.get("/api/latest", async (req) => {
    const { query = config.QUERY, geo = config.GEO } = req.query as {
      query?: string;
      geo?: string;
    };
    const snapshot = getLatestSnapshot(query, geo);
    return { snapshot };
  });

  app.get("/api/domains/:category", async (req) => {
    const category = (req.params as { category: Category }).category;
    const { query = config.QUERY, geo = config.GEO } = req.query as {
      query?: string;
      geo?: string;
    };
    return { domains: getDomainsByCategory(query, geo, category) };
  });

  app.get("/api/history", async (req) => {
    const {
      query = config.QUERY,
      geo = config.GEO,
      limit = "30",
    } = req.query as { query?: string; geo?: string; limit?: string };
    const points = getHistory(query, geo, Number.parseInt(limit, 10) || 30);
    return { points };
  });

  // ───── Scheduler control ─────
  app.get("/api/monitor/status", async () => scheduler.status());

  app.post("/api/monitor/start", async (req, reply) => {
    const body = (req.body ?? {}) as { cron?: string };
    if (!body.cron) {
      return reply.code(400).send({ ok: false, error: "missing_cron" });
    }
    const result = scheduler.start(body.cron);
    if (!result.ok) return reply.code(400).send({ ok: false, error: result.error });
    return { ok: true, status: scheduler.status() };
  });

  app.post("/api/monitor/stop", async () => {
    scheduler.stop();
    return { ok: true, status: scheduler.status() };
  });

  app.post("/api/monitor/trigger", async () => {
    // Run async — return immediately so UI doesn't time out on a slow analyze.
    void scheduler.tick("manual");
    return { ok: true, status: scheduler.status() };
  });

  return app;
}

export async function startServer(): Promise<FastifyInstance> {
  const app = await createApp();
  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(
    `\n  Dashboard at http://${config.HOST}:${config.PORT}\n  Query: "${config.QUERY}" / geo: ${config.GEO}\n`,
  );

  // Auto-start the scheduler with the configured cron unless MONITOR_CRON="off".
  // This makes `npm run dashboard` a single-command experience: monitor runs
  // automatically at the production-sensible default (every 6 hours).
  if (config.MONITOR_CRON.toLowerCase() !== "off") {
    const result = scheduler.start(config.MONITOR_CRON);
    if (!result.ok) {
      console.error(
        `[server] invalid MONITOR_CRON: "${config.MONITOR_CRON}" (${result.error}) — scheduler not started`,
      );
    } else if (config.RUN_ON_START) {
      setTimeout(() => void scheduler.tick("on-start"), 500);
    }
  } else {
    console.log("[server] MONITOR_CRON=off — scheduler disabled (use UI to start)");
  }

  return app;
}

// Run as standalone script
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  startServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
