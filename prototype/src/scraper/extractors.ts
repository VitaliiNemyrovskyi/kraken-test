import * as cheerio from "cheerio";
import { CTA_SELECTORS } from "../constants.js";
import type { OutboundLink } from "../types.js";

export function etld1(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    return parts.slice(-2).join(".");
  } catch {
    return "";
  }
}

export function extractFromHtml(html: string, pageUrl: string) {
  const $ = cheerio.load(html);
  const pageDomain = etld1(pageUrl);
  const title = $("title").first().text().trim() || $("h1").first().text().trim();
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ?? "";

  // Strip script/style/nav/footer for cleaner main text
  $("script, style, noscript, svg, nav, header, footer").remove();
  const mainText = ($("article").first().text() || $("main").first().text() || $("body").text())
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  const outboundLinks: OutboundLink[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href) return;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return;
    }
    let resolved: string;
    try {
      resolved = new URL(href, pageUrl).href;
    } catch {
      return;
    }
    const domain = etld1(resolved);
    if (!domain) return;
    outboundLinks.push({
      href: resolved,
      anchor: $(el).text().trim().slice(0, 100),
      isExternal: domain !== pageDomain,
      domain,
    });
  });

  // Primary CTA — first matching selector, else fall back to first external link in main content
  let primaryCtaHref: string | null = null;
  let primaryCtaAnchor: string | null = null;
  for (const sel of CTA_SELECTORS) {
    const el = $(sel).first();
    if (el.length) {
      const href = el.attr("href")?.trim();
      if (href) {
        try {
          primaryCtaHref = new URL(href, pageUrl).href;
          primaryCtaAnchor = el.text().trim().slice(0, 200);
          break;
        } catch {
          // fallthrough
        }
      }
    }
  }
  if (!primaryCtaHref) {
    const firstExternal = outboundLinks.find((l) => l.isExternal);
    if (firstExternal) {
      primaryCtaHref = firstExternal.href;
      primaryCtaAnchor = firstExternal.anchor;
    }
  }

  return {
    pageDomain,
    title,
    metaDescription,
    mainText,
    outboundLinks,
    primaryCtaHref,
    primaryCtaAnchor,
  };
}
