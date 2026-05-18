import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import cron from "node-cron";
import { config } from "../config.js";
import {
  addKeyword,
  deleteKeyword,
  getCategorySummary,
  getDomainsByCategory,
  getEnrichments,
  getHistory,
  getLatestSnapshot,
  listKeywords,
  readSchedulerControl,
  requestSchedulerTrigger,
  writeDesiredCron,
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
    const enrichment = snapshot
      ? getEnrichments(snapshot.results.map((r) => r.serp.domain))
      : {};
    return { snapshot, enrichment };
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

  // ───── Scheduler control (DB-driven; worker container reconciles) ─────
  // Web does NOT own the scheduler. It writes desired state to
  // `scheduler_control` and reads back the worker-published status.

  app.get("/api/monitor/status", async () => readSchedulerControl().status);

  app.post("/api/monitor/start", async (req, reply) => {
    const body = (req.body ?? {}) as { cron?: string };
    if (!body.cron) {
      return reply.code(400).send({ ok: false, error: "missing_cron" });
    }
    if (!cron.validate(body.cron)) {
      return reply.code(400).send({ ok: false, error: "invalid_cron" });
    }
    writeDesiredCron(body.cron);
    return { ok: true, status: readSchedulerControl().status };
  });

  app.post("/api/monitor/stop", async () => {
    writeDesiredCron(null);
    return { ok: true, status: readSchedulerControl().status };
  });

  app.post("/api/monitor/trigger", async () => {
    requestSchedulerTrigger();
    return { ok: true, status: readSchedulerControl().status };
  });

  // ───── Keyword management ─────
  app.get("/api/keywords", async () => {
    const items = listKeywords();
    // Seed default if empty so the UI always has at least one selection.
    if (items.length === 0) {
      const def = addKeyword(config.QUERY, config.GEO, config.BRAND_DOMAIN);
      return { keywords: [def] };
    }
    return { keywords: items };
  });

  const newKeywordSchema = z.object({
    query: z.string().min(1).max(200),
    geo: z.string().min(2).max(100),
    brand: z.string().min(3).max(200),
  });

  app.post("/api/keywords", async (req, reply) => {
    const parsed = newKeywordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: parsed.error.flatten() });
    }
    const kw = addKeyword(parsed.data.query, parsed.data.geo, parsed.data.brand);
    return { ok: true, keyword: kw };
  });

  app.delete("/api/keywords/:id", async (req, reply) => {
    const id = Number.parseInt((req.params as { id: string }).id, 10);
    if (!Number.isFinite(id)) {
      return reply.code(400).send({ ok: false, error: "invalid_id" });
    }
    const removed = deleteKeyword(id);
    return reply.code(removed ? 200 : 404).send({ ok: removed });
  });

  return app;
}

// Standalone entry kept for `npm run dashboard` (dev convenience).
// In production we use the two-process split: src/web.ts + src/worker.ts.
export async function startServer(): Promise<FastifyInstance> {
  const app = await createApp();
  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(
    `\n  Dashboard at http://${config.HOST}:${config.PORT}\n  Query: "${config.QUERY}" / geo: ${config.GEO}\n`,
  );
  return app;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  startServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
