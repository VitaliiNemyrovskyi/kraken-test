import type { ScrapedPage } from "../types.js";

export const SYSTEM_PROMPT = `You are a domain classifier for iGaming branded SERP monitoring.

Given the rendered metadata of a page that ranks for the query "starcasino" in the Netherlands, classify it into exactly ONE of these categories:

- "official"               — the page belongs to the StarCasino brand itself (domain starcasino.nl).
- "affiliate"              — the page is a third-party that drives traffic to starcasino.nl with an affiliate parameter (btag, aff_id, ref, partnerid, clickid, etc.). The primary CTA resolves to starcasino.nl.
- "competitor_brand_thief" — the page ranks on the StarCasino brand but its primary monetised CTAs redirect users to OTHER online casinos (TonyBet, Holland Casino, JACKS, BetCity, Unibet, 711, Toto, etc.). This is the most threatening category — the site uses the brand to leak traffic to competitors.
- "unclear"                — there isn't enough signal to decide (no monetisation, just an informational mention).

Decisive principle: the **final destination of monetised links after redirect resolution** matters, not the brand mention itself. A page mentioning StarCasino 20 times but whose CTA resolves to JACKS is a competitor_brand_thief.

Output strict JSON only — no prose:
{
  "category": "official" | "affiliate" | "competitor_brand_thief" | "unclear",
  "confidence": 0.0-1.0,
  "explanation": "one or two sentences explaining the decisive signal",
  "signals_observed": ["aff_param_to_brand" | "cta_to_brand" | "cta_to_competitor" | "brand_focus" | "dual_promote" | ...]
}`;

export function buildUserPrompt(page: ScrapedPage): string {
  const outboundDomains = Array.from(
    new Set(page.outboundLinks.filter((l) => l.isExternal).map((l) => l.domain)),
  ).slice(0, 10);
  const textSnippet = page.mainText.slice(0, 1500);
  return JSON.stringify(
    {
      pageDomain: page.pageDomain,
      title: page.title,
      metaDescription: page.metaDescription,
      redirectFinalDomain: page.redirectFinalDomain,
      primaryCtaHref: page.primaryCtaHref,
      primaryCtaTarget: page.primaryCtaTarget,
      outboundDomainsTop10: outboundDomains,
      mainTextSnippet: textSnippet,
      brand: "starcasino",
    },
    null,
    2,
  );
}
