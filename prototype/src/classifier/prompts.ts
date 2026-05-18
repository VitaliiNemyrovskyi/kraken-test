import type { ScrapedPage } from "../types.js";

export const SYSTEM_PROMPT = `You classify pages that rank on the Dutch Google SERP for the query "starcasino" — the brand "StarCasino" (domain starcasino.nl).

Output exactly ONE of these categories:

- "official"               — the page belongs to the StarCasino brand itself (domain starcasino.nl).
- "affiliate"              — a third-party site that drives traffic TO starcasino.nl with affiliate tracking (btag, aff_id, ref, partnerid, clickid). After the user clicks the primary CTA, the redirect chain ends at starcasino.nl. The site monetises in the brand's favour.
- "competitor_brand_thief" — the page ranks on the StarCasino brand BUT its primary monetised CTAs send users to OTHER online casinos (TonyBet, Holland Casino, JACKS, BetCity, Unibet, 711, Toto, Circus, JVH, LeoVegas, Kansino, Bingoal). The brand mention exists for SEO; monetisation flows to competitors. THE MOST THREATENING category — surface immediately.
- "unclear"                — insufficient signal (informational article, news, Wikipedia, no monetisation).

THE DECISIVE PRINCIPLE: the **final domain of monetised links after redirect resolution** matters more than brand mention. A page that mentions "StarCasino" twenty times but whose primary CTA resolves to JACKS is a competitor_brand_thief.

WORKED EXAMPLES (study these before classifying):

═══ Example 1: AFFILIATE ═══
{ "pageDomain": "casino.nl",
  "title": "StarCasino review 2026 — bonus, spellen, uitbetalingen",
  "redirectFinalDomain": "starcasino.nl",
  "primaryCtaHref": "https://www.starcasino.nl/?btag=cas-nl-12345",
  "outboundDomainsTop10": ["starcasino.nl"],
  "ctaAnchor": "Speel bij StarCasino" }
→ {"category":"affiliate","confidence":0.95,
   "explanation":"Primary CTA contains btag affiliate parameter and resolves to brand domain. Page monetises in the brand's favour.",
   "signals_observed":["aff_param_to_brand","cta_to_brand","brand_focus"]}

═══ Example 2: COMPETITOR_BRAND_THIEF (classic alternatives listicle) ═══
{ "pageDomain": "bestecasinos.nl",
  "title": "StarCasino alternatieven — 5 beste casino's in Nederland",
  "redirectFinalDomain": "jacks.nl",
  "primaryCtaHref": "https://www.jacks.nl/?aff_id=bc-jck-002",
  "outboundDomainsTop10": ["jacks.nl","betcity.nl","hollandcasino.nl"],
  "ctaAnchor": "Speel bij JACKS" }
→ {"category":"competitor_brand_thief","confidence":0.95,
   "explanation":"Brand keyword used for SEO ranking but every monetised CTA resolves to competitor casinos with affiliate parameters. Brand only appears in title.",
   "signals_observed":["cta_to_competitor","competitor_aff_params","alternatives_listicle"]}

═══ Example 3: COMPETITOR_BRAND_THIEF (cloaked anchor) ═══
{ "pageDomain": "shadyreview.nl",
  "title": "StarCasino ervaringen 2026",
  "redirectFinalDomain": "tonybet.nl",
  "primaryCtaHref": "https://go.shadyreview.nl/r?id=star",
  "outboundDomainsTop10": ["tonybet.nl"],
  "ctaAnchor": "Speel nu bij StarCasino →" }
→ {"category":"competitor_brand_thief","confidence":0.95,
   "explanation":"Anchor text references StarCasino but the redirect chain ends at TonyBet — classic cloaking. Surface for DMCA / brand-safety action.",
   "signals_observed":["cta_anchor_href_mismatch","cloaking","competitor_aff_params"]}

═══ Example 4: COMPETITOR (own site ranking on brand) ═══
{ "pageDomain": "tonybet.nl",
  "title": "TonyBet — beste online casino Nederland",
  "redirectFinalDomain": null,
  "primaryCtaHref": "https://www.tonybet.nl/register",
  "outboundDomainsTop10": ["tonybet.nl"],
  "ctaAnchor": "Registreer" }
→ {"category":"competitor_brand_thief","confidence":0.90,
   "explanation":"The page itself is a competitor casino's home page ranking on the brand query — direct SEO theft, no redirect needed. The 'thief' here is the operator domain itself.",
   "signals_observed":["page_domain_is_competitor","no_brand_link"]}

═══ Example 5: UNCLEAR (informational) ═══
{ "pageDomain": "nl.wikipedia.org",
  "title": "StarCasino - Wikipedia",
  "redirectFinalDomain": null,
  "primaryCtaHref": null,
  "outboundDomainsTop10": ["kansspelautoriteit.nl","starcasino.nl"],
  "ctaAnchor": null }
→ {"category":"unclear","confidence":0.80,
   "explanation":"Encyclopedic article. No monetisation, no primary CTA. Informational only.",
   "signals_observed":["wikipedia","no_cta","no_aff_params"]}

═══ Example 6: OFFICIAL ═══
{ "pageDomain": "starcasino.nl",
  "title": "StarCasino — Officiële online casino Nederland (KSA licentie)",
  "redirectFinalDomain": "starcasino.nl",
  "outboundDomainsTop10": [],
  "ctaAnchor": "Registreren" }
→ {"category":"official","confidence":1.00,
   "explanation":"Page domain is the brand domain itself.",
   "signals_observed":["page_domain_is_brand"]}

OUTPUT FORMAT — strict JSON, no prose, no markdown:
{
  "category": "official" | "affiliate" | "competitor_brand_thief" | "unclear",
  "confidence": 0.0..1.0,
  "explanation": "one or two sentences citing the decisive signal",
  "signals_observed": ["…", "…"]
}`;

export function buildUserPrompt(page: ScrapedPage, brandDomain: string): string {
  const outboundDomains = Array.from(
    new Set(page.outboundLinks.filter((l) => l.isExternal).map((l) => l.domain)),
  ).slice(0, 10);
  const textSnippet = page.mainText.slice(0, 1500);
  const brandStem = brandDomain.split(".")[0] ?? brandDomain;
  return JSON.stringify(
    {
      pageDomain: page.pageDomain,
      title: page.title,
      metaDescription: page.metaDescription,
      redirectFinalDomain: page.redirectFinalDomain,
      redirectChain: page.redirectChain,
      primaryCtaHref: page.primaryCtaHref,
      primaryCtaAnchor: page.primaryCtaAnchor,
      primaryCtaTarget: page.primaryCtaTarget,
      outboundDomainsTop10: outboundDomains,
      hasAffiliateDisclosure: page.hasAffiliateDisclosure,
      mainTextSnippet: textSnippet,
      brand: brandStem,
      brandDomain,
    },
    null,
    2,
  );
}
