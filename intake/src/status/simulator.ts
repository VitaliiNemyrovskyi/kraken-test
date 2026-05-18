import { TASK_STATUS_FLOW, type Task, type TaskStatus } from "../types.js";
import { sheetConfigRepo, taskRepo } from "../storage/db.js";
import { config } from "../config.js";
import { isAuthorized } from "../sheets/oauth.js";
import { readSheetRows, writeStatusBack } from "../sheets/client.js";

export function nextStatus(current: TaskStatus): TaskStatus | null {
  if (current === "failed" || current === "published") return null;
  const i = TASK_STATUS_FLOW.indexOf(current);
  if (i === -1 || i === TASK_STATUS_FLOW.length - 1) return null;
  return TASK_STATUS_FLOW[i + 1] ?? null;
}

function fakeOutputUrl(t: Task): string {
  const slug = t.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `https://example-${t.brand.toLowerCase() || "site"}.pages.dev/${t.geo}/${slug}`;
}

export async function advanceTask(id: string): Promise<Task | null> {
  const task = taskRepo.getById(id);
  if (!task) return null;
  const next = nextStatus(task.status);
  if (!next) return task;
  const outputUrl = next === "published" ? fakeOutputUrl(task) : null;
  const updated = taskRepo.updateStatus(id, next, outputUrl);
  if (updated && updated.source === "sheet" && updated.sheetRowId) {
    await syncBackToSheet(updated);
  }
  return updated;
}

export async function failTask(id: string): Promise<Task | null> {
  const task = taskRepo.updateStatus(id, "failed");
  if (task && task.source === "sheet" && task.sheetRowId) {
    await syncBackToSheet(task);
  }
  return task;
}

async function syncBackToSheet(task: Task): Promise<void> {
  if (!isAuthorized()) return;
  const cfg = sheetConfigRepo.get();
  const sheetId = cfg?.sheetId || config.SHEET_ID;
  const sheetRange = cfg?.sheetRange || config.SHEET_RANGE;
  if (!sheetId || !task.sheetRowId) return;
  try {
    const rows = await readSheetRows(sheetId, sheetRange);
    const match = rows.find((r) => r.rowId === task.sheetRowId);
    if (!match) return;
    await writeStatusBack(sheetId, sheetRange, match.rowNumber, task.status, task.outputUrl);
  } catch (err) {
    console.warn(`[status] writeback failed for task ${task.id}: ${(err as Error).message}`);
  }
}
