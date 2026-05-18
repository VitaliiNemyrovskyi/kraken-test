import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config, hasGoogleCreds } from "../config.js";
import { oauthRepo, sheetConfigRepo, taskRepo } from "../storage/db.js";
import {
  exchangeCodeForTokens,
  getAuthUrl,
  isAuthorized,
} from "../sheets/oauth.js";
import { pollOnce } from "../sheets/poller.js";
import { advanceTask, failTask } from "../status/simulator.js";

const newTaskSchema = z.object({
  keyword: z.string().min(1).max(200),
  geo: z.string().min(2).max(8),
  language: z.string().min(2).max(8),
  brand: z.string().min(1).max(100),
  contentType: z.enum(["review", "comparison", "landing", "guide", "news"]),
});

const sheetConfigSchema = z.object({
  sheetId: z.string().min(10),
  sheetRange: z.string().min(3).default("Sheet1!A:H"),
});

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/status", async () => {
    const cfg = sheetConfigRepo.get();
    return {
      googleCredsConfigured: hasGoogleCreds,
      authorized: isAuthorized(),
      sheetConfigured: cfg !== null || config.SHEET_ID.length > 0,
      sheetId: cfg?.sheetId || config.SHEET_ID || null,
      sheetRange: cfg?.sheetRange || config.SHEET_RANGE,
      pollIntervalSeconds: config.POLL_INTERVAL_SECONDS,
    };
  });

  app.get("/auth/google", async (_req, reply) => {
    if (!hasGoogleCreds) {
      return reply.code(400).send({
        error: "GOOGLE_CLIENT_ID/SECRET not set in .env. See README.",
      });
    }
    const url = getAuthUrl();
    return reply.redirect(url);
  });

  app.get("/auth/google/callback", async (req, reply) => {
    const code = (req.query as { code?: string; error?: string }).code;
    const error = (req.query as { error?: string }).error;
    if (error) return reply.code(400).send({ error });
    if (!code) return reply.code(400).send({ error: "missing code" });
    try {
      await exchangeCodeForTokens(code);
      return reply.redirect("/?auth=ok");
    } catch (e) {
      return reply.code(500).send({ error: (e as Error).message });
    }
  });

  app.post("/auth/logout", async (_req, reply) => {
    oauthRepo.clear();
    return reply.send({ ok: true });
  });

  app.post("/api/sheets/config", async (req, reply) => {
    const parsed = sheetConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    sheetConfigRepo.save(parsed.data.sheetId, parsed.data.sheetRange);
    return { ok: true };
  });

  app.post("/api/sheets/sync", async (_req, reply) => {
    try {
      const result = await pollOnce();
      return reply.send(result);
    } catch (e) {
      return reply.code(500).send({ ok: false, reason: (e as Error).message });
    }
  });

  app.get("/api/tasks", async () => {
    return { tasks: taskRepo.listAll() };
  });

  app.post("/api/tasks", async (req, reply) => {
    const parsed = newTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const task = taskRepo.insert({ source: "web", ...parsed.data });
    return reply.code(201).send({ task });
  });

  app.post("/api/tasks/:id/advance", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const task = await advanceTask(id);
    if (!task) return reply.code(404).send({ error: "not found" });
    return { task };
  });

  app.post("/api/tasks/:id/fail", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const task = await failTask(id);
    if (!task) return reply.code(404).send({ error: "not found" });
    return { task };
  });
}
