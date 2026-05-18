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

export interface RedirectChain {
  hops: number;
  intermediateDomains: string[];
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
  primaryCtaAnchor: string | null;
  primaryCtaTarget: "star" | "competitor" | "other" | null;
  redirectFinalUrl: string | null;
  redirectFinalDomain: string | null;
  redirectChain: RedirectChain | null;
  hasAffiliateDisclosure: boolean;
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
  pageDomainIsCompetitor: boolean;
  starLinkRatio: number;
  compLinkRatio: number;
  hasAffParamsToStar: boolean;
  hasAffParamsToComp: boolean;
  redirectsToStar: boolean;
  redirectsToComp: boolean;
  brandMentionsInText: number;
  primaryCtaTarget: ScrapedPage["primaryCtaTarget"];
  outboundCasinoLinks: number;
  ctaAnchorMentionsBrand: boolean;
  ctaAnchorHrefMismatch: boolean;
  hasAffiliateDisclosure: boolean;
  redirectHops: number;
  // SERP-level signals that survive even when the page scrape produces no
  // CTA / outbound data (Cloudflare bot challenges, JS-injected affiliate links).
  domainContainsBrandStem: boolean;
  titleSuggestsReviewPortal: boolean;
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
