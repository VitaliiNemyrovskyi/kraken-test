import cron, { type ScheduledTask } from "node-cron";
import { runAnalyzeAllKeywords } from "./analyze/run.js";
import {
  clearSchedulerTrigger,
  readSchedulerControl,
  type SchedulerStatus,
  writeSchedulerStatus,
} from "./storage/db.js";

// In-process scheduler state, owned by the worker container.
// Synchronised to SQLite (scheduler_control table) so the web container
// can read status + push control commands without HTTP calls.

class Scheduler {
  private task: ScheduledTask | null = null;
  private currentCron: string | null = null;
  private lastRunAt: string | null = null;
  private lastRunDurationMs: number | null = null;
  private lastRunError: string | null = null;
  private busy = false;

  private snapshotStatus(): SchedulerStatus {
    return {
      active: this.task !== null,
      cron: this.currentCron,
      lastRunAt: this.lastRunAt,
      lastRunDurationMs: this.lastRunDurationMs,
      lastRunError: this.lastRunError,
      busy: this.busy,
    };
  }

  private start(expr: string): boolean {
    if (!cron.validate(expr)) return false;
    this.stop();
    this.task = cron.schedule(expr, () => void this.tick("cron"));
    this.currentCron = expr;
    console.log(`[scheduler] cron started: "${expr}"`);
    return true;
  }

  private stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.currentCron = null;
      console.log("[scheduler] cron stopped");
    }
  }

  async tick(reason: "cron" | "manual" | "on-start"): Promise<void> {
    if (this.busy) {
      console.log(`[scheduler] skipping ${reason} — previous tick still running`);
      return;
    }
    this.busy = true;
    writeSchedulerStatus(this.snapshotStatus());
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
      writeSchedulerStatus(this.snapshotStatus());
    }
  }

  // The worker's main loop: every POLL_INTERVAL_MS, read control row from
  // SQLite, reconcile cron-task state, run pending manual tick, persist
  // status. Exits on SIGINT/SIGTERM.
  async runSupervisor(opts: { pollIntervalMs?: number; initialCron?: string | null; runOnStart?: boolean } = {}): Promise<void> {
    const POLL = opts.pollIntervalMs ?? 2000;
    let lastTriggerProcessed: string | null = null;

    // Bootstrap: if DB has no cron set yet but env provides one, write it.
    const ctrl = readSchedulerControl();
    if (ctrl.desiredCron === null && opts.initialCron) {
      const { writeDesiredCron } = await import("./storage/db.js");
      writeDesiredCron(opts.initialCron);
    }

    writeSchedulerStatus(this.snapshotStatus());

    if (opts.runOnStart) {
      setTimeout(() => void this.tick("on-start"), 500);
    }

    let stopping = false;
    const stop = () => {
      stopping = true;
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);

    while (!stopping) {
      try {
        const control = readSchedulerControl();

        // Reconcile cron-task state with desired_cron.
        if (control.desiredCron !== this.currentCron) {
          if (control.desiredCron === null) {
            this.stop();
          } else {
            const ok = this.start(control.desiredCron);
            if (!ok) {
              console.error(`[scheduler] invalid desired_cron in DB: "${control.desiredCron}"`);
            }
          }
          writeSchedulerStatus(this.snapshotStatus());
        }

        // Honour manual trigger.
        if (
          control.triggerRequestedAt &&
          control.triggerRequestedAt !== lastTriggerProcessed
        ) {
          lastTriggerProcessed = control.triggerRequestedAt;
          clearSchedulerTrigger(control.triggerRequestedAt);
          void this.tick("manual");
        }
      } catch (err) {
        console.error(`[scheduler] supervisor loop error:`, (err as Error).message);
      }

      await new Promise((r) => setTimeout(r, POLL));
    }

    console.log("[scheduler] supervisor exiting…");
    this.stop();
  }
}

export const scheduler = new Scheduler();
