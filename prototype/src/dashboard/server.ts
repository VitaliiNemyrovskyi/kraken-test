import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import {
  getCategorySummary,
  getDomainsByCategory,
  getLatestSnapshot,
} from "../storage/db.js";
import type { Category } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

try {
  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(
    `\n  Dashboard at http://${config.HOST}:${config.PORT}\n  Query: "${config.QUERY}" / geo: ${config.GEO}\n`,
  );
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
