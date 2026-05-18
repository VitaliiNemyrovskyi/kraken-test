import { config } from "../config.js";
import { sheetConfigRepo, taskRepo } from "../storage/db.js";
import { isAuthorized } from "./oauth.js";
import { readSheetRows } from "./client.js";

export interface PollResult {
  ok: boolean;
  reason?: string;
  rowsSeen?: number;
  ingested?: number;
  skippedExisting?: number;
}

export async function pollOnce(): Promise<PollResult> {
  if (!isAuthorized()) {
    return { ok: false, reason: "not_authorized" };
  }
  const cfg = sheetConfigRepo.get();
  const sheetId = cfg?.sheetId || config.SHEET_ID;
  const sheetRange = cfg?.sheetRange || config.SHEET_RANGE;
  if (!sheetId) {
    return { ok: false, reason: "no_sheet_id" };
  }
  const rows = await readSheetRows(sheetId, sheetRange);
  let ingested = 0;
  let skippedExisting = 0;
  for (const row of rows) {
    const existing = taskRepo.findBySheetRowId(row.rowId);
    if (existing) {
      skippedExisting++;
      continue;
    }
    taskRepo.insert({
      source: "sheet",
      sheetRowId: row.rowId,
      keyword: row.keyword,
      geo: row.geo,
      language: row.language,
      brand: row.brand,
      contentType: row.contentType,
    });
    ingested++;
  }
  return { ok: true, rowsSeen: rows.length, ingested, skippedExisting };
}

let timer: NodeJS.Timeout | null = null;
let running = false;

export function startPoller(intervalSeconds = config.POLL_INTERVAL_SECONDS): void {
  if (timer) return;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await pollOnce();
      if (result.ok && (result.ingested ?? 0) > 0) {
        console.log(
          `[poller] ingested ${result.ingested} new task(s) (${result.skippedExisting} already known)`,
        );
      } else if (!result.ok && result.reason !== "not_authorized" && result.reason !== "no_sheet_id") {
        console.warn(`[poller] poll failed: ${result.reason}`);
      }
    } catch (err) {
      console.error("[poller] error:", (err as Error).message);
    } finally {
      running = false;
    }
  };
  timer = setInterval(tick, intervalSeconds * 1000);
  void tick();
}

export function stopPoller(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
