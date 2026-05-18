export type Category =
  | "official"
  | "affiliate"
  | "competitor_brand_thief"
  | "unclear";

export interface CategoryCounts {
  official: number;
  affiliate: number;
  competitor_brand_thief: number;
  unclear: number;
}

export interface Summary {
  query: string;
  geo: string;
  total: number;
  counts: CategoryCounts;
  percentages: CategoryCounts;
}

export interface ResultRow {
  serp: { position: number; url: string; domain: string; title: string; snippet: string };
  scraped: { redirectFinalDomain: string | null };
  classification: {
    category: Category;
    confidence: number;
    explanation: string;
  };
}

export interface DomainEnrichment {
  domain: string;
  registrar: string | null;
  registrantOrg: string | null;
  registrantCountry: string | null;
  domainCreated: string | null;
  domainExpires: string | null;
  nameservers: string[];
  monthlyVisitorsEst: number;
  trafficRank: number;
  source: "whois" | "fixture" | "heuristic";
  updatedAt: string;
  fetchError: string | null;
}

export interface SnapshotResponse {
  snapshot: {
    id: number;
    query: string;
    geo: string;
    takenAt: string;
    source: "serpapi" | "playwright" | "mock";
    results: ResultRow[];
  } | null;
  enrichment: Record<string, DomainEnrichment>;
}

export interface HistoryPoint {
  snapshotId: number;
  takenAt: string;
  counts: CategoryCounts;
}

export interface HistoryResponse {
  points: HistoryPoint[];
}
