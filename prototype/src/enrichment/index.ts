import { config } from "../config.js";
import { getEnrichment, upsertEnrichment } from "../storage/db.js";
import { loadFixture } from "../serp/mock-provider.js";
import { lookupWhois } from "./whois.js";
import { estimateTraffic } from "./traffic.js";
import type { DomainEnrichment } from "../types.js";

const CACHE_TTL_DAYS = 7;

function isFresh(updatedAt: string): boolean {
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  return ageMs < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
}

interface FixtureEnrichment {
  registrar?: string | null;
  registrantOrg?: string | null;
  registrantCountry?: string | null;
  domainCreated?: string | null;
  domainExpires?: string | null;
  nameservers?: string[];
  monthlyVisitorsEst?: number;
  trafficRank?: number;
}

function enrichFromFixture(domain: string): DomainEnrichment | null {
  const fixture = loadFixture() as {
    _enrichment?: Record<string, FixtureEnrichment>;
  };
  const stub = fixture._enrichment?.[domain];
  if (!stub) return null;
  const fallback = estimateTraffic(domain);
  return {
    domain,
    registrar: stub.registrar ?? null,
    registrantOrg: stub.registrantOrg ?? null,
    registrantCountry: stub.registrantCountry ?? null,
    domainCreated: stub.domainCreated ?? null,
    domainExpires: stub.domainExpires ?? null,
    nameservers: stub.nameservers ?? [],
    monthlyVisitorsEst: stub.monthlyVisitorsEst ?? fallback.monthlyVisitorsEst,
    trafficRank: stub.trafficRank ?? fallback.trafficRank,
    source: "fixture",
    updatedAt: new Date().toISOString(),
    fetchError: null,
  };
}

export async function enrichDomain(domain: string): Promise<DomainEnrichment> {
  const cached = getEnrichment(domain);
  if (cached && isFresh(cached.updatedAt)) return cached;

  // Mock-mode shortcut: serve from fixture (consistent demo, no network).
  if (config.SERP_SOURCE === "mock") {
    const fromFixture = enrichFromFixture(domain);
    if (fromFixture) {
      upsertEnrichment(fromFixture);
      return fromFixture;
    }
  }

  // Real WHOIS lookup. Falls back to heuristic if WHOIS fails (some TLDs
  // / registries reject queries, especially for international domains).
  let whoisRec: Awaited<ReturnType<typeof lookupWhois>> | null = null;
  let fetchError: string | null = null;
  try {
    whoisRec = await lookupWhois(domain);
  } catch (e) {
    fetchError = (e as Error).message;
  }

  const traffic = estimateTraffic(domain);
  const record: DomainEnrichment = {
    domain,
    registrar: whoisRec?.registrar ?? null,
    registrantOrg: whoisRec?.registrantOrg ?? null,
    registrantCountry: whoisRec?.registrantCountry ?? null,
    domainCreated: whoisRec?.domainCreated ?? null,
    domainExpires: whoisRec?.domainExpires ?? null,
    nameservers: whoisRec?.nameservers ?? [],
    monthlyVisitorsEst: traffic.monthlyVisitorsEst,
    trafficRank: traffic.trafficRank,
    source: whoisRec ? "whois" : "heuristic",
    updatedAt: new Date().toISOString(),
    fetchError,
  };
  upsertEnrichment(record);
  return record;
}

// Best-effort, bounded-concurrency enrichment. Logs but doesn't throw —
// snapshots succeed even when WHOIS fails.
export async function enrichDomains(domains: string[]): Promise<DomainEnrichment[]> {
  const unique = Array.from(new Set(domains));
  const out: DomainEnrichment[] = [];
  const CONCURRENCY = 4;
  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const batch = unique.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (d) => {
        try {
          return await enrichDomain(d);
        } catch (e) {
          console.warn(`[enrichment] ${d}: ${(e as Error).message}`);
          return null;
        }
      }),
    );
    for (const r of results) if (r) out.push(r);
  }
  return out;
}
