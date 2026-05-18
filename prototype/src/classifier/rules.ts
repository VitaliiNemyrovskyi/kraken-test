import {
  AFFILIATE_PARAM_RE,
  AFFILIATE_UTM_RE,
  BRAND_IN_ANCHOR_RE,
  COMPETITOR_CASINO_DOMAINS,
} from "../constants.js";
import { config } from "../config.js";
import type { OutboundLink, RuleSignals, ScrapedPage } from "../types.js";

const BRAND_MENTION_RE = /star\s*casino/gi;

function hasAffiliateParam(href: string): boolean {
  return AFFILIATE_PARAM_RE.test(href) || AFFILIATE_UTM_RE.test(href);
}

export function extractSignals(page: ScrapedPage): RuleSignals {
  const brandDomain = config.BRAND_DOMAIN;
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

  const brandMentionsInText = (page.mainText.match(BRAND_MENTION_RE) ?? []).length;

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
