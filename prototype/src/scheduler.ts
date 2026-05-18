import cron, { type ScheduledTask } from "node-cron";
import { runAnalyzeAllKeywords } from "./analyze/run.js";

export interface SchedulerStatus {
  active: boolean;
  cron: string | null;
  lastRunAt: string | null;
  lastRunDurationMs: number | null;
  lastRunError: string | null;
  busy: boolean;
}

class Scheduler {
  private task: ScheduledTask | null = null;
  private currentCron: string | null = null;
  private lastRunAt: string | null = null;
  private lastRunDurationMs: number | null = null;
  private lastRunError: string | null = null;
  private busy = false;

  status(): SchedulerStatus {
    return {
      active: this.task !== null,
      cron: this.currentCron,
      lastRunAt: this.lastRunAt,
      lastRunDurationMs: this.lastRunDurationMs,
      lastRunError: this.lastRunError,
      busy: this.busy,
    };
  }

  // Start (or replace) the scheduled task with a new cron expression.
  start(expr: string): { ok: boolean; error?: string } {
    if (!cron.validate(expr)) return { ok: false, error: "invalid_cron" };
    this.stop();
    this.task = cron.schedule(expr, () => void this.tick("cron"));
    this.currentCron = expr;
    console.log(`[scheduler] started with cron: "${expr}"`);
    return { ok: true };
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.currentCron = null;
      console.log("[scheduler] stopped");
    }
  }

  async tick(reason: "cron" | "manual" | "on-start"): Promise<void> {
    if (this.busy) {
      console.log(`[scheduler] skipping ${reason} — previous tick still running`);
      return;
    }
    this.busy = true;
    const t0 = Date.now();
    try {
      console.log(`[scheduler] tick (${reason}) at ${new Date().toISOString()}`);
      const results = await runAnalyzeAllKeywords();
      this.lastRunAt = new Date().toISOString();
      this.lastRunDurationMs = Date.now() - t0;
      this.lastRunError = null;
      console.log(
        `[scheduler] done — ${results.length} keyword(s) analyzed (${this.lastRunDurationMs}ms)`,
      );
    } catch (err) {
      this.lastRunError = (err as Error).message;
      console.error(`[scheduler] tick failed:`, this.lastRunError);
    } finally {
      this.busy = false;
    }
  }
}

export const scheduler = new Scheduler();
