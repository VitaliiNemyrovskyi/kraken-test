import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { nanoid } from "nanoid";
import { config } from "../config.js";
import type {
  NewTaskInput,
  OAuthTokens,
  Task,
  TaskStatus,
} from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, "./schema.sql");

mkdirSync(dirname(resolve(config.DATABASE_PATH)), { recursive: true });

const db = new Database(resolve(config.DATABASE_PATH));
db.exec(readFileSync(SCHEMA_PATH, "utf-8"));

type TaskRow = {
  id: string;
  source: "web" | "sheet";
  sheet_row_id: string | null;
  keyword: string;
  geo: string;
  language: string;
  brand: string;
  content_type: string;
  status: TaskStatus;
  output_url: string | null;
  created_at: string;
  status_updated_at: string;
};

const rowToTask = (r: TaskRow): Task => ({
  id: r.id,
  source: r.source,
  sheetRowId: r.sheet_row_id,
  keyword: r.keyword,
  geo: r.geo,
  language: r.language,
  brand: r.brand,
  contentType: r.content_type,
  status: r.status,
  outputUrl: r.output_url,
  createdAt: r.created_at,
  statusUpdatedAt: r.status_updated_at,
});

export const taskRepo = {
  insert(input: NewTaskInput): Task {
    const now = new Date().toISOString();
    const id = nanoid(12);
    const stmt = db.prepare(`
      INSERT INTO tasks
        (id, source, sheet_row_id, keyword, geo, language, brand, content_type,
         status, output_url, created_at, status_updated_at)
      VALUES
        (@id, @source, @sheet_row_id, @keyword, @geo, @language, @brand,
         @content_type, 'queued', NULL, @now, @now)
    `);
    stmt.run({
      id,
      source: input.source,
      sheet_row_id: input.sheetRowId ?? null,
      keyword: input.keyword,
      geo: input.geo,
      language: input.language,
      brand: input.brand,
      content_type: input.contentType,
      now,
    });
    return this.getById(id)!;
  },

  getById(id: string): Task | null {
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as
      | TaskRow
      | undefined;
    return row ? rowToTask(row) : null;
  },

  findBySheetRowId(sheetRowId: string): Task | null {
    const row = db
      .prepare("SELECT * FROM tasks WHERE source = 'sheet' AND sheet_row_id = ?")
      .get(sheetRowId) as TaskRow | undefined;
    return row ? rowToTask(row) : null;
  },

  listAll(): Task[] {
    return (db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all() as TaskRow[])
      .map(rowToTask);
  },

  updateStatus(id: string, status: TaskStatus, outputUrl: string | null = null): Task | null {
    const now = new Date().toISOString();
    db.prepare(
      "UPDATE tasks SET status = ?, output_url = COALESCE(?, output_url), status_updated_at = ? WHERE id = ?"
    ).run(status, outputUrl, now, id);
    return this.getById(id);
  },
};

export const oauthRepo = {
  get(): OAuthTokens | null {
    const row = db.prepare("SELECT * FROM oauth_tokens WHERE id = 1").get() as
      | { access_token: string; refresh_token: string; expiry_date: number; scope: string }
      | undefined;
    if (!row) return null;
    return {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiryDate: row.expiry_date,
      scope: row.scope,
    };
  },

  save(t: OAuthTokens): void {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO oauth_tokens (id, access_token, refresh_token, expiry_date, scope, updated_at)
       VALUES (1, @access, @refresh, @expiry, @scope, @now)
       ON CONFLICT(id) DO UPDATE SET
         access_token = @access,
         refresh_token = excluded.refresh_token,
         expiry_date = @expiry,
         scope = @scope,
         updated_at = @now`
    ).run({
      access: t.accessToken,
      refresh: t.refreshToken,
      expiry: t.expiryDate,
      scope: t.scope,
      now,
    });
  },

  clear(): void {
    db.prepare("DELETE FROM oauth_tokens WHERE id = 1").run();
  },
};

export const sheetConfigRepo = {
  get(): { sheetId: string; sheetRange: string } | null {
    const row = db.prepare("SELECT * FROM sheet_config WHERE id = 1").get() as
      | { sheet_id: string; sheet_range: string }
      | undefined;
    if (!row) return null;
    return { sheetId: row.sheet_id, sheetRange: row.sheet_range };
  },

  save(sheetId: string, sheetRange: string): void {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO sheet_config (id, sheet_id, sheet_range, updated_at)
       VALUES (1, @sheetId, @sheetRange, @now)
       ON CONFLICT(id) DO UPDATE SET
         sheet_id = @sheetId, sheet_range = @sheetRange, updated_at = @now`
    ).run({ sheetId, sheetRange, now });
  },
};
