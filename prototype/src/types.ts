export type Category =
  | "official"
  | "affiliate"
  | "competitor_brand_thief"
  | "unclear";

export const CATEGORIES: Category[] = [
  "official",
  "affiliate",
  "competitor_brand_thief",
  "unclear",
];

export type SerpSource = "serpapi" | "playwright" | "mock";

export interface SerpResult {
  position: number;
  url: string;
  domain: string;
  title: string;
  snippet: string;
}

export interface OutboundLink {
  href: string;
  anchor: string;
  isExternal: boolean;
  domain: string;
}

export interface ScrapedPage {
  url: string;
  pageDomain: string;
  fetchedAt: string;
  title: string;
  metaDescription: string;
  mainText: string;
  outboundLinks: OutboundLink[];
  primaryCtaHref: string | null;
  primaryCtaTarget: "star" | "competitor" | "other" | null;
  redirectFinalUrl: string | null;
  redirectFinalDomain: string | null;
  scrapeError?: string;
}

export interface RuleScores {
  official: number;
  affiliate: number;
  competitor_brand_thief: number;
  unclear: number;
}

export interface RuleSignals {
  isStarOfficial: boolean;
  starLinkRatio: number;
  compLinkRatio: number;
  hasAffParamsToStar: boolean;
  hasAffParamsToComp: boolean;
  redirectsToStar: boolean;
  redirectsToComp: boolean;
  brandMentionsInText: number;
  primaryCtaTarget: ScrapedPage["primaryCtaTarget"];
  outboundCasinoLinks: number;
}

export interface RuleVerdict {
  scores: RuleScores;
  signals: RuleSignals;
}

export interface LlmVerdict {
  category: Category;
  confidence: number;
  explanation: string;
  signals_observed: string[];
}

export interface ClassificationResult {
  category: Category;
  confidence: number;
  ruleVerdict: RuleVerdict;
  llmVerdict: LlmVerdict | null;
  explanation: string;
}

export interface AnalyzedResult {
  serp: SerpResult;
  scraped: ScrapedPage;
  classification: ClassificationResult;
}

export interface Snapshot {
  id: number;
  query: string;
  geo: string;
  takenAt: string;
  source: SerpSource;
  results: AnalyzedResult[];
}
