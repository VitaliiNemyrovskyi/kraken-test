// Per-domain token-bucket rate limiter. Ensures we don't hammer a single host.
// Defaults to 1 request per second per domain via SCRAPER_RATE_PER_DOMAIN_MS.
const lastHit = new Map<string, number>();

export async function waitForDomain(domain: string, minIntervalMs: number): Promise<void> {
  if (minIntervalMs <= 0) return;
  const now = Date.now();
  const last = lastHit.get(domain) ?? 0;
  const delta = now - last;
  if (delta < minIntervalMs) {
    await new Promise((r) => setTimeout(r, minIntervalMs - delta));
  }
  lastHit.set(domain, Date.now());
}
