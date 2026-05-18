import { chromium, type Browser } from "playwright";
import { config } from "../config.js";
import {
  AFFILIATE_DISCLOSURE_RE,
  COMPETITOR_CASINO_DOMAINS,
  MAX_REDIRECT_HOPS,
} from "../constants.js";
import type { RedirectChain, ScrapedPage, SerpResult } from "../types.js";
import { extractFromHtml, etld1 } from "./extractors.js";
import { waitForDomain } from "./rate-limiter.js";
import { loadFixture } from "../serp/mock-provider.js";

function categoriseCtaTarget(
  finalDomain: string | null,
  brandDomain: string,
): ScrapedPage["primaryCtaTarget"] {
  if (!finalDomain) return null;
  if (finalDomain === brandDomain) return "star";
  if (COMPETITOR_CASINO_DOMAINS.has(finalDomain)) return "competitor";
  return "other";
}

let browserPromise: Promise<Browser> | null = null;
function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

// Realistic Chrome UA — the "Monitor/0.1" suffix the prototype used originally
// got us flagged as a bot by every Cloudflare/DataDome-protected casino site.
const REAL_BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function resolveRedirectChain(
  startUrl: string,
): Promise<{
  finalUrl: string;
  finalDomain: string;
  chain: RedirectChain;
}> {
  // Manual hop-by-hop follow so we can record intermediate domains and detect
  // long/suspicious chains. Stops at MAX_REDIRECT_HOPS or when the response
  // is not a redirect.
  const intermediateDomains: string[] = [];
  let currentUrl = startUrl;
  let hops = 0;
  const startDomain = etld1(startUrl);
  if (startDomain) intermediateDomains.push(startDomain);
  for (let i = 0; i < MAX_REDIRECT_HOPS; i++) {
    try {
      const res = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        headers: {
          "User-Agent": REAL_BROWSER_UA,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "nl,en-US;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) break;
        currentUrl = new URL(loc, currentUrl).href;
        hops++;
        const d = etld1(currentUrl);
        if (d && intermediateDomains[intermediateDomains.length - 1] !== d) {
          intermediateDomains.push(d);
        }
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return {
    finalUrl: currentUrl,
    finalDomain: etld1(currentUrl),
    chain: { hops, intermediateDomains },
  };
}

export interface ScrapeOptions {
  useMockFixture?: boolean;
  brandDomain: string;
}

export async function scrapePage(
  serpResult: SerpResult,
  opts: ScrapeOptions,
): Promise<ScrapedPage> {
  if (opts.useMockFixture) {
    return scrapeFromFixture(serpResult);
  }
  return scrapeViaPlaywright(serpResult, opts.brandDomain);
}

function scrapeFromFixture(serpResult: SerpResult): ScrapedPage {
  const fixture = loadFixture();
  const stub = (fixture._scraped as Record<string, Partial<ScrapedPage>>)[
    serpResult.domain
  ];
  const fetchedAt = new Date().toISOString();
  if (!stub) {
    return {
      url: serpResult.url,
      pageDomain: serpResult.domain,
      fetchedAt,
      title: serpResult.title,
      metaDescription: "",
      mainText: "",
      outboundLinks: [],
      primaryCtaHref: null,
      primaryCtaAnchor: null,
      primaryCtaTarget: null,
      redirectFinalUrl: null,
      redirectFinalDomain: null,
      redirectChain: null,
      hasAffiliateDisclosure: false,
      scrapeError: "no fixture entry",
    };
  }
  const mainText = stub.mainText ?? "";
  return {
    url: serpResult.url,
    pageDomain: stub.pageDomain ?? serpResult.domain,
    fetchedAt,
    title: stub.title ?? serpResult.title,
    metaDescription: stub.metaDescription ?? "",
    mainText,
    outboundLinks: stub.outboundLinks ?? [],
    primaryCtaHref: stub.primaryCtaHref ?? null,
    primaryCtaAnchor: stub.primaryCtaAnchor ?? null,
    primaryCtaTarget: stub.primaryCtaTarget ?? null,
    redirectFinalUrl: stub.redirectFinalUrl ?? null,
    redirectFinalDomain: stub.redirectFinalDomain ?? null,
    redirectChain: stub.redirectChain ?? null,
    hasAffiliateDisclosure:
      stub.hasAffiliateDisclosure ?? AFFILIATE_DISCLOSURE_RE.test(mainText),
  };
}

async function scrapeViaPlaywright(
  serpResult: SerpResult,
  brandDomain: string,
): Promise<ScrapedPage> {
  const fetchedAt = new Date().toISOString();
  await waitForDomain(serpResult.domain, config.SCRAPER_RATE_PER_DOMAIN_MS);

  try {
    const browser = await getBrowser();
    const context = await browser.newContext({
      userAgent: REAL_BROWSER_UA,
      locale: "nl-NL",
      viewport: { width: 1366, height: 768 },
      extraHTTPHeaders: {
        "Accept-Language": "nl,en-US;q=0.9,en;q=0.8",
      },
    });
    const page = await context.newPage();
    let response;
    try {
      response = await page.goto(serpResult.url, {
        waitUntil: "load",
        timeout: config.SCRAPER_TIMEOUT_MS,
      });
    } catch (e) {
      // load timeout — try whatever HTML is on the page so far rather than
      // bailing with no data.
      console.warn(
        `[scraper] ${serpResult.domain} goto timed out (${(e as Error).message}) — using partial DOM`,
      );
    }
    // Casino landing pages lazy-load CTAs after first paint. A short post-load
    // settle gives those scripts time to inject the affiliate links.
    await page.waitForTimeout(1500);
    const html = await page.content();
    const status = response?.status();
    await context.close();

    if (status && status >= 400) {
      console.warn(`[scraper] ${serpResult.domain} returned HTTP ${status}`);
    }

    const ext = extractFromHtml(html, serpResult.url);
    if (!ext.mainText) {
      console.warn(
        `[scraper] ${serpResult.domain} produced empty mainText (html len=${html.length}, status=${status})`,
      );
    }

    let redirectFinalUrl: string | null = null;
    let redirectFinalDomain: string | null = null;
    let redirectChain: RedirectChain | null = null;
    if (ext.primaryCtaHref) {
      const resolved = await resolveRedirectChain(ext.primaryCtaHref);
      redirectFinalUrl = resolved.finalUrl;
      redirectFinalDomain = resolved.finalDomain;
      redirectChain = resolved.chain;
    }

    return {
      url: serpResult.url,
      pageDomain: ext.pageDomain,
      fetchedAt,
      title: ext.title,
      metaDescription: ext.metaDescription,
      mainText: ext.mainText,
      outboundLinks: ext.outboundLinks,
      primaryCtaHref: ext.primaryCtaHref,
      primaryCtaAnchor: ext.primaryCtaAnchor,
      primaryCtaTarget: categoriseCtaTarget(redirectFinalDomain, brandDomain),
      redirectFinalUrl,
      redirectFinalDomain,
      redirectChain,
      hasAffiliateDisclosure: AFFILIATE_DISCLOSURE_RE.test(ext.mainText),
    };
  } catch (e) {
    return {
      url: serpResult.url,
      pageDomain: serpResult.domain,
      fetchedAt,
      title: serpResult.title,
      metaDescription: "",
      mainText: "",
      outboundLinks: [],
      primaryCtaHref: null,
      primaryCtaAnchor: null,
      primaryCtaTarget: null,
      redirectFinalUrl: null,
      redirectFinalDomain: null,
      redirectChain: null,
      hasAffiliateDisclosure: false,
      scrapeError: (e as Error).message,
    };
  }
}
