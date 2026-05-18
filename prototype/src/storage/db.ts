import Database from "better-sqlite3";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import type { AnalyzedResult, Category, DomainEnrichment, Snapshot } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, "./schema.sql");

mkdirSync(dirname(resolve(config.DATABASE_PATH)), { recursive: true });

const db = new Database(resolve(config.DATABASE_PATH));
db.exec(readFileSync(SCHEMA_PATH, "utf-8"));

function getOrCreateKeyword(query: string, geo: string, brand: string): number {
  const existing = db
    .prepare("SELECT id FROM keywords WHERE query = ? AND geo = ?")
    .get(query, geo) as { id: number } | undefined;
  if (existing) return existing.id;
  const info = db
    .prepare("INSERT INTO keywords (query, geo, brand) VALUES (?, ?, ?)")
    .run(query, geo, brand);
  return Number(info.lastInsertRowid);
}

export interface Keyword {
  id: number;
  query: string;
  geo: string;
  brand: string;
}

export function listKeywords(): Keyword[] {
  return db.prepare("SELECT id, query, geo, brand FROM keywords ORDER BY id ASC").all() as Keyword[];
}

export function addKeyword(query: string, geo: string, brand: string): Keyword {
  const id = getOrCreateKeyword(query, geo, brand);
  return { id, query, geo, brand };
}

interface EnrichmentRow {
  domain: string;
  registrar: string | null;
  registrant_org: string | null;
  registrant_country: string | null;
  domain_created: string | null;
  domain_expires: string | null;
  nameservers_json: string | null;
  monthly_visitors_est: number | null;
  traffic_rank: number | null;
  source: "whois" | "fixture" | "heuristic";
  updated_at: string;
  fetch_error: string | null;
}

function rowToEnrichment(r: EnrichmentRow): DomainEnrichment {
  return {
    domain: r.domain,
    registrar: r.registrar,
    registrantOrg: r.registrant_org,
    registrantCountry: r.registrant_country,
    domainCreated: r.domain_created,
    domainExpires: r.domain_expires,
    nameservers: r.nameservers_json ? (JSON.parse(r.nameservers_json) as string[]) : [],
    monthlyVisitorsEst: r.monthly_visitors_est ?? 0,
    trafficRank: r.traffic_rank ?? 0,
    source: r.source,
    updatedAt: r.updated_at,
    fetchError: r.fetch_error,
  };
}

export function getEnrichment(domain: string): DomainEnrichment | null {
  const row = db
    .prepare("SELECT * FROM domain_enrichment WHERE domain = ?")
    .get(domain) as EnrichmentRow | undefined;
  return row ? rowToEnrichment(row) : null;
}

export function getEnrichments(domains: string[]): Record<string, DomainEnrichment> {
  if (domains.length === 0) return {};
  const placeholders = domains.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT * FROM domain_enrichment WHERE domain IN (${placeholders})`)
    .all(...domains) as EnrichmentRow[];
  const out: Record<string, DomainEnrichment> = {};
  for (const r of rows) out[r.domain] = rowToEnrichment(r);
  return out;
}

export function upsertEnrichment(e: DomainEnrichment): void {
  db.prepare(
    `INSERT INTO domain_enrichment
     (domain, registrar, registrant_org, registrant_country, domain_created,
      domain_expires, nameservers_json, monthly_visitors_est, traffic_rank,
      source, updated_at, fetch_error)
     VALUES (@domain, @registrar, @registrantOrg, @registrantCountry, @domainCreated,
             @domainExpires, @nameserversJson, @monthlyVisitorsEst, @trafficRank,
             @source, @updatedAt, @fetchError)
     ON CONFLICT(domain) DO UPDATE SET
       registrar = excluded.registrar,
       registrant_org = excluded.registrant_org,
       registrant_country = excluded.registrant_country,
       domain_created = excluded.domain_created,
       domain_expires = excluded.domain_expires,
       nameservers_json = excluded.nameservers_json,
       monthly_visitors_est = excluded.monthly_visitors_est,
       traffic_rank = excluded.traffic_rank,
       source = excluded.source,
       updated_at = excluded.updated_at,
       fetch_error = excluded.fetch_error`,
  ).run({
    domain: e.domain,
    registrar: e.registrar,
    registrantOrg: e.registrantOrg,
    registrantCountry: e.registrantCountry,
    domainCreated: e.domainCreated,
    domainExpires: e.domainExpires,
    nameserversJson: JSON.stringify(e.nameservers),
    monthlyVisitorsEst: e.monthlyVisitorsEst,
    trafficRank: e.trafficRank,
    source: e.source,
    updatedAt: e.updatedAt,
    fetchError: e.fetchError,
  });
}

export function deleteKeyword(id: number): boolean {
  // Cascade: drop associated history + snapshots + results + classifications.
  const tx = db.transaction(() => {
    const snapshotIds = db
      .prepare("SELECT id FROM snapshots WHERE keyword_id = ?")
      .all(id) as { id: number }[];
    for (const s of snapshotIds) {
      const resultIds = db
        .prepare("SELECT id FROM serp_results WHERE snapshot_id = ?")
        .all(s.id) as { id: number }[];
      for (const r of resultIds) {
        db.prepare("DELETE FROM classifications WHERE result_id = ?").run(r.id);
      }
      db.prepare("DELETE FROM serp_results WHERE snapshot_id = ?").run(s.id);
    }
    db.prepare("DELETE FROM snapshots WHERE keyword_id = ?").run(id);
    db.prepare("DELETE FROM domain_history WHERE keyword_id = ?").run(id);
    const info = db.prepare("DELETE FROM keywords WHERE id = ?").run(id);
    return info.changes > 0;
  });
  return tx();
}

export function saveSnapshot(
  query: string,
  geo: string,
  brand: string,
  source: "serpapi" | "playwright" | "mock",
  results: AnalyzedResult[],
): number {
  const takenAt = new Date().toISOString();
  const insertAll = db.transaction(() => {
    const keywordId = getOrCreateKeyword(query, geo, brand);
    const snapshotInfo = db
      .prepare(
        "INSERT INTO snapshots (keyword_id, taken_at, source) VALUES (?, ?, ?)",
      )
      .run(keywordId, takenAt, source);
    const snapshotId = Number(snapshotInfo.lastInsertRowid);

    const insertResult = db.prepare(
      `INSERT INTO serp_results
       (snapshot_id, position, url, domain, title, snippet)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const insertClassification = db.prepare(
      `INSERT INTO classifications
       (result_id, category, confidence, rule_score_json, llm_verdict_json,
        signals_json, explanation, redirect_final_domain, classified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (const r of results) {
      const rInfo = insertResult.run(
        snapshotId,
        r.serp.position,
        r.serp.url,
        r.serp.domain,
        r.serp.title,
        r.serp.snippet,
      );
      const resultId = Number(rInfo.lastInsertRowid);
      insertClassification.run(
        resultId,
        r.classification.category,
        r.classification.confidence,
        JSON.stringify(r.classification.ruleVerdict.scores),
        r.classification.llmVerdict
          ? JSON.stringify(r.classification.llmVerdict)
          : null,
        JSON.stringify(r.classification.ruleVerdict.signals),
        r.classification.explanation,
        r.scraped.redirectFinalDomain,
        takenAt,
      );

      updateDomainHistory(
        r.serp.domain,
        keywordId,
        takenAt,
        r.classification.category,
      );
    }

    return snapshotId;
  });
  return insertAll();
}

function updateDomainHistory(
  domain: string,
  keywordId: number,
  now: string,
  category: Category,
): void {
  const existing = db
    .prepare(
      "SELECT last_category, category_changes FROM domain_history WHERE domain = ? AND keyword_id = ?",
    )
    .get(domain, keywordId) as
    | { last_category: Category; category_changes: number }
    | undefined;
  if (!existing) {
    db.prepare(
      `INSERT INTO domain_history
       (domain, keyword_id, first_seen, last_seen, last_category, category_changes)
       VALUES (?, ?, ?, ?, ?, 0)`,
    ).run(domain, keywordId, now, now, category);
  } else {
    const bumped =
      existing.last_category === category
        ? existing.category_changes
        : existing.category_changes + 1;
    db.prepare(
      `UPDATE domain_history
       SET last_seen = ?, last_category = ?, category_changes = ?
       WHERE domain = ? AND keyword_id = ?`,
    ).run(now, category, bumped, domain, keywordId);
  }
}

interface SnapshotRow {
  id: number;
  keyword_id: number;
  taken_at: string;
  source: "serpapi" | "playwright" | "mock";
  query: string;
  geo: string;
}

interface ResultClassRow {
  position: number;
  url: string;
  domain: string;
  title: string | null;
  snippet: string | null;
  category: Category;
  confidence: number;
  explanation: string | null;
  rule_score_json: string;
  llm_verdict_json: string | null;
  signals_json: string;
  redirect_final_domain: string | null;
}

export function getLatestSnapshot(query: string, geo: string): Snapshot | null {
  const row = db
    .prepare(
      `SELECT s.id, s.keyword_id, s.taken_at, s.source, k.query, k.geo
       FROM snapshots s
       JOIN keywords k ON k.id = s.keyword_id
       WHERE k.query = ? AND k.geo = ?
       ORDER BY s.taken_at DESC LIMIT 1`,
    )
    .get(query, geo) as SnapshotRow | undefined;
  if (!row) return null;
  const rows = db
    .prepare(
      `SELECT r.position, r.url, r.domain, r.title, r.snippet,
              c.category, c.confidence, c.explanation,
              c.rule_score_json, c.llm_verdict_json, c.signals_json,
              c.redirect_final_domain
       FROM serp_results r
       JOIN classifications c ON c.result_id = r.id
       WHERE r.snapshot_id = ?
       ORDER BY r.position ASC`,
    )
    .all(row.id) as ResultClassRow[];

  return {
    id: row.id,
    query: row.query,
    geo: row.geo,
    takenAt: row.taken_at,
    source: row.source,
    results: rows.map((r) => ({
      serp: {
        position: r.position,
        url: r.url,
        domain: r.domain,
        title: r.title ?? "",
        snippet: r.snippet ?? "",
      },
      scraped: {
        url: r.url,
        pageDomain: r.domain,
        fetchedAt: row.taken_at,
        title: r.title ?? "",
        metaDescription: "",
        mainText: "",
        outboundLinks: [],
        primaryCtaHref: null,
        primaryCtaAnchor: null,
        primaryCtaTarget: null,
        redirectFinalUrl: null,
        redirectFinalDomain: r.redirect_final_domain,
        redirectChain: null,
        hasAffiliateDisclosure: false,
      },
      classification: {
        category: r.category,
        confidence: r.confidence,
        ruleVerdict: {
          scores: JSON.parse(r.rule_score_json),
          signals: JSON.parse(r.signals_json),
        },
        llmVerdict: r.llm_verdict_json ? JSON.parse(r.llm_verdict_json) : null,
        explanation: r.explanation ?? "",
      },
    })),
  };
}

export function getCategorySummary(
  query: string,
  geo: string,
): Record<Category, number> {
  const snapshot = getLatestSnapshot(query, geo);
  const counts: Record<Category, number> = {
    official: 0,
    affiliate: 0,
    competitor_brand_thief: 0,
    unclear: 0,
  };
  if (!snapshot) return counts;
  for (const r of snapshot.results) {
    counts[r.classification.category]++;
  }
  return counts;
}

export function getDomainsByCategory(
  query: string,
  geo: string,
  category: Category,
) {
  const snapshot = getLatestSnapshot(query, geo);
  if (!snapshot) return [];
  return snapshot.results.filter((r) => r.classification.category === category);
}

// ───── Scheduler control plane (DB-driven, replaces in-process scheduler) ─────

export interface SchedulerStatus {
  active: boolean;
  cron: string | null;
  lastRunAt: string | null;
  lastRunDurationMs: number | null;
  lastRunError: string | null;
  busy: boolean;
}

export interface SchedulerControl {
  desiredCron: string | null;
  triggerRequestedAt: string | null;
  status: SchedulerStatus;
  updatedAt: string;
}

interface ControlRow {
  desired_cron: string | null;
  trigger_requested_at: string | null;
  last_status_json: string;
  updated_at: string;
}

export function readSchedulerControl(): SchedulerControl {
  const row = db
    .prepare("SELECT desired_cron, trigger_requested_at, last_status_json, updated_at FROM scheduler_control WHERE id = 1")
    .get() as ControlRow;
  return {
    desiredCron: row.desired_cron,
    triggerRequestedAt: row.trigger_requested_at,
    status: JSON.parse(row.last_status_json) as SchedulerStatus,
    updatedAt: row.updated_at,
  };
}

export function writeDesiredCron(cron: string | null): void {
  db.prepare(
    "UPDATE scheduler_control SET desired_cron = ?, updated_at = ? WHERE id = 1",
  ).run(cron, new Date().toISOString());
}

export function requestSchedulerTrigger(): void {
  db.prepare(
    "UPDATE scheduler_control SET trigger_requested_at = ?, updated_at = ? WHERE id = 1",
  ).run(new Date().toISOString(), new Date().toISOString());
}

export function clearSchedulerTrigger(at: string): void {
  db.prepare(
    "UPDATE scheduler_control SET trigger_requested_at = NULL, updated_at = ? WHERE id = 1 AND trigger_requested_at = ?",
  ).run(new Date().toISOString(), at);
}

export function writeSchedulerStatus(status: SchedulerStatus): void {
  db.prepare(
    "UPDATE scheduler_control SET last_status_json = ?, updated_at = ? WHERE id = 1",
  ).run(JSON.stringify(status), new Date().toISOString());
}

export interface HistoryPoint {
  snapshotId: number;
  takenAt: string;
  counts: Record<Category, number>;
}

interface HistoryAggRow {
  snapshot_id: number;
  taken_at: string;
  category: Category;
  cnt: number;
}

export function getHistory(query: string, geo: string, limit = 30): HistoryPoint[] {
  // Aggregates the last N snapshots into per-category counts for time-series
  // charts. Uses a single SQL query for efficiency.
  const rows = db
    .prepare(
      `WITH recent AS (
         SELECT s.id, s.taken_at
         FROM snapshots s
         JOIN keywords k ON k.id = s.keyword_id
         WHERE k.query = ? AND k.geo = ?
         ORDER BY s.taken_at DESC
         LIMIT ?
       )
       SELECT s.id AS snapshot_id, s.taken_at, c.category, COUNT(*) AS cnt
       FROM recent s
       JOIN serp_results r ON r.snapshot_id = s.id
       JOIN classifications c ON c.result_id = r.id
       GROUP BY s.id, c.category
       ORDER BY s.taken_at ASC, c.category ASC`,
    )
    .all(query, geo, limit) as HistoryAggRow[];

  const bySnapshot = new Map<number, HistoryPoint>();
  for (const r of rows) {
    let p = bySnapshot.get(r.snapshot_id);
    if (!p) {
      p = {
        snapshotId: r.snapshot_id,
        takenAt: r.taken_at,
        counts: {
          official: 0,
          affiliate: 0,
          competitor_brand_thief: 0,
          unclear: 0,
        },
      };
      bySnapshot.set(r.snapshot_id, p);
    }
    p.counts[r.category] = r.cnt;
  }
  return Array.from(bySnapshot.values());
}

export function getDomainHistory(domain: string, query: string, geo: string) {
  const kw = db
    .prepare("SELECT id FROM keywords WHERE query = ? AND geo = ?")
    .get(query, geo) as { id: number } | undefined;
  if (!kw) return null;
  return db
    .prepare(
      "SELECT * FROM domain_history WHERE domain = ? AND keyword_id = ?",
    )
    .get(domain, kw.id);
}
