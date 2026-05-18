import { chromium } from "playwright";
import { config } from "../config.js";
import type { SerpResult } from "../types.js";
import type { SerpFetchOptions } from "./index.js";

function etld1(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    return parts.slice(-2).join(".");
  } catch {
    return "";
  }
}

// Direct Google scraping as a fallback when SerpAPI is unavailable.
// Google may serve CAPTCHA — this provider best-effort; production must use SerpAPI/DataForSEO.
export async function fetchPlaywright(
  opts: SerpFetchOptions,
): Promise<SerpResult[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      locale: `${config.HL}-${config.GL.toUpperCase()}`,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();
    const url = `https://${config.GOOGLE_DOMAIN}/search?q=${encodeURIComponent(
      opts.query,
    )}&hl=${config.HL}&gl=${config.GL}&num=${opts.limit}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    if ((await page.locator('form#captcha-form').count()) > 0) {
      throw new Error(
        "Google served a CAPTCHA. Use SERP_SOURCE=serpapi with a key, or SERP_SOURCE=mock for offline demo.",
      );
    }

    const results: { url: string; title: string; snippet: string }[] =
      await page.evaluate(() => {
        // Runs in browser context; DOM globals available at runtime.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = (globalThis as any).document;
        const out: { url: string; title: string; snippet: string }[] = [];
        const blocks = doc.querySelectorAll("div.g, div.MjjYud");
        for (const block of Array.from(blocks) as Array<{
          querySelector: (sel: string) => {
            href?: string;
            textContent?: string | null;
          } | null;
        }>) {
          const link = block.querySelector("a[href]");
          const h3 = block.querySelector("h3");
          if (!link || !h3) continue;
          const href = link.href ?? "";
          if (!href.startsWith("http")) continue;
          if (href.includes("google.com/")) continue;
          const snippetEl = block.querySelector('span[class*="VwiC3b"]');
          out.push({
            url: href,
            title: h3.textContent ?? "",
            snippet: snippetEl?.textContent ?? "",
          });
          if (out.length >= 20) break;
        }
        return out;
      });

    return results.slice(0, opts.limit).map((r, i) => ({
      position: i + 1,
      url: r.url,
      domain: etld1(r.url),
      title: r.title,
      snippet: r.snippet,
    }));
  } finally {
    await browser.close();
  }
}
