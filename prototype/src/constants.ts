// NL-licensed competitor casinos (KSA licence-holders).
// Used by classifier to detect when a page on the brand SERP routes
// monetisation traffic to other operators.
// Update as new KSA licences are issued.
export const COMPETITOR_CASINO_DOMAINS = new Set<string>([
  "tonybet.nl",
  "hollandcasino.nl",
  "jacks.nl",
  "betcity.nl",
  "unibet.nl",
  "711.nl",
  "toto.nl",
  "circusonline.nl",
  "hommerson.nl",
  "jvh.nl",
  "leovegas.nl",
  "kansino.nl",
  "bingoal.nl",
]);

// Affiliate-parameter regex. Matches the common iGaming tracking params.
export const AFFILIATE_PARAM_RE =
  /[?&](btag|aff_id|ref|partnerid|clickid|sub_id|trackid|partner|p)=/i;

// "utm_source=affiliate|partner|aff" variant
export const AFFILIATE_UTM_RE = /utm_source=(affiliate|partner|aff)\b/i;

// Common affiliate networks that act as redirect intermediaries.
// When the scraper sees these, it follows the redirect chain to find the
// final destination domain.
export const AFFILIATE_NETWORK_RE =
  /(income-access\.com|netrefer|affise|tonic|hasoffers|cake|partner\.|^aff\.|track\.|^go\.)/i;

// CTA selectors — common "Play Now" / "Spel nu" / "Visit" button shapes.
// Heuristic; falls back to first prominent <a> in the article body.
export const CTA_SELECTORS = [
  'a[class*="cta" i]',
  'a[class*="play" i]',
  'a[class*="visit" i]',
  'a[class*="button" i][href*="http"]',
  'a[role="button"][href*="http"]',
];

// Maximum redirect hops to follow when resolving primary CTA / affiliate links.
export const MAX_REDIRECT_HOPS = 5;

// Visible affiliate disclosure patterns (EN + NL).
// Presence of any → positive signal for "proper affiliate" category.
// Per EU consumer directive + FTC, affiliates must disclose paid relationships.
export const AFFILIATE_DISCLOSURE_RE =
  /\b(affiliate[\s-]*(disclosure|link|programme?|partner)|partnerlink|in\s+samenwerking\s+met|advertorial|we\s+(earn|may\s+earn|receive)\s+(a\s+)?commission|compensated|ondersteund\s+door|affiliate\s+gemarkeerd|gesponsorde?\s+(link|content))/i;

// Brand-name detection in CTA anchor text — used to detect cloaking
// (anchor mentions brand but href resolves to a competitor).
export const BRAND_IN_ANCHOR_RE = /star\s*casino/i;

// Review-portal / listicle SERP-title patterns (EN + NL). A non-brand domain
// whose page title fits this shape is a strong affiliate prior even when we
// have no scraped CTA — affiliates ARE the dominant economic model for casino
// review sites.
export const REVIEW_PORTAL_TITLE_RE =
  /\b(reviews?|recensies?|ervaringen|alternatief|alternatieven|beste|vergelijk|top\s*\d+|vs\.?\s)\b/i;

