import {
  AFFILIATE_PARAM_RE,
  AFFILIATE_UTM_RE,
  BRAND_IN_ANCHOR_RE,
  COMPETITOR_CASINO_DOMAINS,
} from "../constants.js";
import type { OutboundLink, RuleSignals, ScrapedPage } from "../types.js";

function hasAffiliateParam(href: string): boolean {
  return AFFILIATE_PARAM_RE.test(href) || AFFILIATE_UTM_RE.test(href);
}

function brandMentionRegex(brandDomain: string): RegExp {
  // "starcasino.nl" → /star\s*casino/gi  (strip TLD, treat boundary between
  // brand-name segments as optional whitespace so "Star Casino" and
  // "StarCasino" both match).
  const stem = brandDomain.split(".")[0] ?? brandDomain;
  // Split CamelCase / alphanumeric runs heuristically: most casino brands are
  // run-together strings, so we just escape and allow whitespace inside.
  const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}`.replace(/([a-z])([a-z])/i, "$1\\s*$2"), "gi");
}

export function extractSignals(
  page: ScrapedPage,
  brandDomain: string,
): RuleSignals {
  const links = page.outboundLinks;
  const externalLinks = links.filter((l) => l.isExternal);
  const totalLinks = externalLinks.length || 1;

  const starLinks = externalLinks.filter((l) => l.domain === brandDomain);
  const compLinks = externalLinks.filter((l) =>
    COMPETITOR_CASINO_DOMAINS.has(l.domain),
  );

  const hasAffParamsToStar = starLinks.some((l: OutboundLink) =>
    hasAffiliateParam(l.href),
  );
  const hasAffParamsToComp = compLinks.some((l: OutboundLink) =>
    hasAffiliateParam(l.href),
  );

  const brandMentionsInText = (page.mainText.match(brandMentionRegex(brandDomain)) ?? []).length;

  // Cloaking detection: anchor text references the brand, but the CTA resolves
  // to a competitor casino. Strong thief signal.
  const ctaAnchorMentionsBrand =
    page.primaryCtaAnchor !== null &&
    BRAND_IN_ANCHOR_RE.test(page.primaryCtaAnchor);
  const ctaAnchorHrefMismatch =
    ctaAnchorMentionsBrand &&
    page.redirectFinalDomain !== null &&
    page.redirectFinalDomain !== brandDomain &&
    COMPETITOR_CASINO_DOMAINS.has(page.redirectFinalDomain);

  return {
    isStarOfficial: page.pageDomain === brandDomain,
    pageDomainIsCompetitor: COMPETITOR_CASINO_DOMAINS.has(page.pageDomain),
    starLinkRatio: starLinks.length / totalLinks,
    compLinkRatio: compLinks.length / totalLinks,
    hasAffParamsToStar,
    hasAffParamsToComp,
    redirectsToStar: page.redirectFinalDomain === brandDomain,
    redirectsToComp:
      page.redirectFinalDomain !== null &&
      COMPETITOR_CASINO_DOMAINS.has(page.redirectFinalDomain),
    brandMentionsInText,
    primaryCtaTarget: page.primaryCtaTarget,
    outboundCasinoLinks: starLinks.length + compLinks.length,
    ctaAnchorMentionsBrand,
    ctaAnchorHrefMismatch,
    hasAffiliateDisclosure: page.hasAffiliateDisclosure,
    redirectHops: page.redirectChain?.hops ?? 0,
  };
}
