PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tasks (
  id                 TEXT PRIMARY KEY,
  source             TEXT NOT NULL CHECK(source IN ('web','sheet')),
  sheet_row_id       TEXT,
  keyword            TEXT NOT NULL,
  geo                TEXT NOT NULL,
  language           TEXT NOT NULL,
  brand              TEXT NOT NULL,
  content_type       TEXT NOT NULL,
  status             TEXT NOT NULL CHECK(status IN
                       ('queued','scraping','generating','reviewing','publishing','published','failed')),
  output_url         TEXT,
  created_at         TEXT NOT NULL,
  status_updated_at  TEXT NOT NULL,
  UNIQUE(source, sheet_row_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  access_token    TEXT NOT NULL,
  refresh_token   TEXT NOT NULL,
  expiry_date     INTEGER NOT NULL,
  scope           TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sheet_config (
  id           INTEGER PRIMARY KEY CHECK (id = 1),
  sheet_id     TEXT NOT NULL,
  sheet_range  TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
