PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS keywords (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  query     TEXT NOT NULL,
  geo       TEXT NOT NULL,
  brand     TEXT NOT NULL,
  UNIQUE(query, geo)
);

CREATE TABLE IF NOT EXISTS snapshots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword_id  INTEGER NOT NULL,
  taken_at    TEXT NOT NULL,
  source      TEXT NOT NULL CHECK(source IN ('serpapi','playwright','mock')),
  FOREIGN KEY(keyword_id) REFERENCES keywords(id)
);
CREATE INDEX IF NOT EXISTS idx_snapshots_taken_at ON snapshots(taken_at);

CREATE TABLE IF NOT EXISTS serp_results (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id  INTEGER NOT NULL,
  position     INTEGER NOT NULL,
  url          TEXT NOT NULL,
  domain       TEXT NOT NULL,
  title        TEXT,
  snippet      TEXT,
  FOREIGN KEY(snapshot_id) REFERENCES snapshots(id)
);

CREATE TABLE IF NOT EXISTS classifications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id       INTEGER NOT NULL,
  category        TEXT NOT NULL CHECK(category IN
                    ('official','affiliate','competitor_brand_thief','unclear')),
  confidence      REAL NOT NULL,
  rule_score_json TEXT NOT NULL,
  llm_verdict_json TEXT,
  signals_json    TEXT NOT NULL,
  explanation     TEXT,
  redirect_final_domain TEXT,
  classified_at   TEXT NOT NULL,
  FOREIGN KEY(result_id) REFERENCES serp_results(id)
);
CREATE INDEX IF NOT EXISTS idx_classifications_category ON classifications(category);

CREATE TABLE IF NOT EXISTS domain_history (
  domain            TEXT NOT NULL,
  keyword_id        INTEGER NOT NULL,
  first_seen        TEXT NOT NULL,
  last_seen         TEXT NOT NULL,
  last_category     TEXT NOT NULL,
  category_changes  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(domain, keyword_id),
  FOREIGN KEY(keyword_id) REFERENCES keywords(id)
);

-- Singleton row driving the worker container. Web container WRITES the
-- desired state (desired_cron, trigger_requested_at); worker container
-- POLLS this row, applies changes, and writes the current status back.
-- Decouples the two containers — no inter-container HTTP needed.
CREATE TABLE IF NOT EXISTS scheduler_control (
  id                     INTEGER PRIMARY KEY CHECK(id = 1),
  desired_cron           TEXT,                -- NULL = stopped
  trigger_requested_at   TEXT,                -- web sets, worker clears
  last_status_json       TEXT NOT NULL,       -- worker writes
  updated_at             TEXT NOT NULL
);

INSERT OR IGNORE INTO scheduler_control (id, desired_cron, last_status_json, updated_at)
  VALUES (1, NULL, '{"active":false,"cron":null,"lastRunAt":null,"lastRunDurationMs":null,"lastRunError":null,"busy":false}', '1970-01-01T00:00:00.000Z');

CREATE TABLE IF NOT EXISTS domain_enrichment (
  domain                TEXT PRIMARY KEY,
  registrar             TEXT,
  registrant_org        TEXT,
  registrant_country    TEXT,
  domain_created        TEXT,
  domain_expires        TEXT,
  nameservers_json      TEXT,
  monthly_visitors_est  INTEGER,
  traffic_rank          INTEGER,
  source                TEXT NOT NULL CHECK(source IN ('whois','fixture','heuristic')),
  updated_at            TEXT NOT NULL,
  fetch_error           TEXT
);
