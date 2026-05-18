import { chromium, type Browser } from "playwright";
import { config } from "../config.js";
import {
  COMPETITOR_CASINO_DOMAINS,
} from "../constants.js";
import type { ScrapedPage, SerpResult } from "../types.js";
import { extractFromHtml, etld1 } from "./extractors.js";
import { waitForDomain } from "./rate-limiter.js";
import { loadFixture } from "../serp/mock-provider.js";

function categoriseCtaTarget(finalDomain: string | null): ScrapedPage["primaryCtaTarget"] {
  if (!finalDomain) return null;
  if (finalDomain === config.BRAND_DOMAIN) return "star";
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

async function resolveRedirectChain(
  startUrl: string,
): Promise<{ finalUrl: string; finalDomain: string }> {
  // HEAD-follow up to MAX_REDIRECT_HOPS. Some affiliate networks serve only GET — fall back.
  try {
    const res = await fetch(startUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 KrakenLeads-Monitor/0.1",
      },
      signal: AbortSignal.timeout(10000),
    });
    return { finalUrl: res.url, finalDomain: etld1(res.url) };
  } catch {
    return { finalUrl: startUrl, finalDomain: etld1(startUrl) };
  }
}

export interface ScrapeOptions {
  useMockFixture?: boolean;
}

export async function scrapePage(
  serpResult: SerpResult,
  opts: ScrapeOptions = {},
): Promise<ScrapedPage> {
  if (opts.useMockFixture) {
    return scrapeFromFixture(serpResult);
  }
  return scrapeViaPlaywright(serpResult);
}

function scrapeFromFixture(serpResult: SerpResult): ScrapedPage {
  const fixture = loadFixture();
  const stub = (fixture._scraped as Record<string, Partial<ScrapedPage>>)[
    serpResult.domain
  ];
  if (!stub) {
    return {
      url: serpResult.url,
      pageDomain: serpResult.domain,
      fetchedAt: new Date().toISOString(),
      title: serpResult.title,
      metaDescription: "",
      mainText: "",
      outboundLinks: [],
      primaryCtaHref: null,
      primaryCtaTarget: null,
      redirectFinalUrl: null,
      redirectFinalDomain: null,
      scrapeError: "no fixture entry",
    };
  }
  return {
    url: serpResult.url,
    pageDomain: stub.pageDomain ?? serpResult.domain,
    fetchedAt: new Date().toISOString(),
    title: stub.title ?? serpResult.title,
    metaDescription: stub.metaDescription ?? "",
    mainText: stub.mainText ?? "",
    outboundLinks: stub.outboundLinks ?? [],
    primaryCtaHref: stub.primaryCtaHref ?? null,
    primaryCtaTarget: stub.primaryCtaTarget ?? null,
    redirectFinalUrl: stub.redirectFinalUrl ?? null,
    redirectFinalDomain: stub.redirectFinalDomain ?? null,
  };
}

async function scrapeViaPlaywright(
  serpResult: SerpResult,
): Promise<ScrapedPage> {
  const fetchedAt = new Date().toISOString();
  await waitForDomain(serpResult.domain, config.SCRAPER_RATE_PER_DOMAIN_MS);

  try {
    const browser = await getBrowser();
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 KrakenLeads-Monitor/0.1",
    });
    const page = await context.newPage();
    await page.goto(serpResult.url, {
      waitUntil: "domcontentloaded",
      timeout: config.SCRAPER_TIMEOUT_MS,
    });
    const html = await page.content();
    await context.close();

    const ext = extractFromHtml(html, serpResult.url);

    let redirectFinalUrl: string | null = null;
    let redirectFinalDomain: string | null = null;
    if (ext.primaryCtaHref) {
      const resolved = await resolveRedirectChain(ext.primaryCtaHref);
      redirectFinalUrl = resolved.finalUrl;
      redirectFinalDomain = resolved.finalDomain;
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
      primaryCtaTarget: categoriseCtaTarget(redirectFinalDomain),
      redirectFinalUrl,
      redirectFinalDomain,
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
      primaryCtaTarget: null,
      redirectFinalUrl: null,
      redirectFinalDomain: null,
      scrapeError: (e as Error).message,
    };
  }
}
