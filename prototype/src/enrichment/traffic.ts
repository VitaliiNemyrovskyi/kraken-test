import { createHash } from "node:crypto";

export interface TrafficEstimate {
  monthlyVisitorsEst: number;
  trafficRank: number;
}

// Demo-grade deterministic heuristic. Production would call
// SimilarWeb / Ahrefs / Cloudflare Radar / Tranco for real data.
// We hash the domain so the same domain always yields the same numbers
// (consistent UX across runs) but values vary plausibly between domains.
//
// Distribution targets:
//   monthlyVisitorsEst: 1k – 5M (log-normal-ish)
//   trafficRank:         1 – 10M
export function estimateTraffic(domain: string): TrafficEstimate {
  const hash = createHash("sha256").update(domain).digest();
  const a = hash.readUInt32BE(0);
  const b = hash.readUInt32BE(4);

  // Bias by TLD popularity — quick heuristic that .nl/.com sites tend to
  // appear more often in SERPs and have higher visitor counts.
  const tld = domain.split(".").pop() ?? "";
  const tldBias = ["com", "nl", "org", "net"].includes(tld) ? 1.5 : 1.0;

  // monthlyVisitorsEst: roughly 10^(3 + 4×r) ⇒ 1k – 10M
  const r1 = (a % 100000) / 100000;
  const monthlyVisitorsEst = Math.round(10 ** (3 + 4 * r1) * tldBias);

  // trafficRank: roughly 1 – 10M, inverse relationship with visitors
  const r2 = (b % 100000) / 100000;
  const trafficRank = Math.max(1, Math.round(10 ** (1 + 6 * (1 - r1)) * (1 + r2)));

  return { monthlyVisitorsEst, trafficRank };
}
