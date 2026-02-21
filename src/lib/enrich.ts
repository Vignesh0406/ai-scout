import * as cheerio from "cheerio";

function normalizeUrl(url: string) {
  try {
    const u = new URL(url);
    return u.toString();
  } catch {
    if (url.startsWith("//")) return `https:${url}`;
    return `https://${url}`;
  }
}

function extractVisibleText(html: string) {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const text = $("body").text();
  return text.replace(/\s+/g, " ").trim();
}

function extractSummary(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, 2).join("").trim().slice(0, 200);
}

function extractBullets(text: string): string[] {
  const lines = text.split("\n");
  const bullets: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if ((trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.startsWith("*")) && trimmed.length > 5) {
      bullets.push(trimmed.replace(/^[-•*]\s*/, "").slice(0, 80));
    }
    if (bullets.length >= 6) break;
  }
  return bullets.length > 0 ? bullets : ["Service or product offering not clearly listed"];
}

function extractKeywords(text: string): string[] {
  const lc = text.toLowerCase();
  const commonKeywords = [
    "ai", "automation", "saas", "platform", "analytics", "security", "cloud", "api",
    "machine learning", "data", "infrastructure", "devops", "payments", "fintech",
    "healthcare", "enterprise", "b2b", "b2c", "mobile", "web", "blockchain", "crypto"
  ];
  const found = commonKeywords.filter(k => lc.includes(k));
  const unique = [...new Set(found)];
  return unique.slice(0, 10).length > 0 ? unique.slice(0, 10) : ["software", "services"];
}

function extractSignals(text: string, pages: Array<{ url: string; title: string }>): Array<{ name: string; present: boolean; evidence: string }> {
  const lc = text.toLowerCase();
  const pageUrls = pages.map(p => p.url.toLowerCase());

  return [
    {
      name: "Pricing Page",
      present: lc.includes("pricing") || pageUrls.some(u => u.includes("/pricing")),
      evidence: "Company discloses pricing publicly"
    },
    {
      name: "Active Hiring",
      present: lc.includes("careers") || lc.includes("open roles") || lc.includes("we're hiring") || pageUrls.some(u => u.includes("/careers") || u.includes("/jobs")),
      evidence: "Careers or jobs page detected"
    },
    {
      name: "Security Certifications",
      present: lc.includes("security") || lc.includes("soc 2") || lc.includes("iso 27001") || lc.includes("gdpr"),
      evidence: "Security/compliance certifications mentioned"
    },
    {
      name: "Blog or Content",
      present: lc.includes("blog") || lc.includes("article") || lc.includes("post") || pageUrls.some(u => u.includes("/blog")),
      evidence: "Active content marketing detected"
    }
  ];
}

export async function fetchAndExtract(params: {
  url: string;
  maxPages?: number;
}): Promise<{
  sourceUrl: string;
  pages: Array<{ url: string; title: string; text: string }>;
  combinedText: string;
  summary: string;
  whatTheyDo: string[];
  keywords: string[];
  signals: Array<{ name: string; present: boolean; evidence: string }>;
  extracted: {
    title?: string;
    hasPricing: boolean;
    hasCareers: boolean;
    hasSecurity: boolean;
  };
  fetchedAt: string;
}> {
  const sourceUrl = normalizeUrl(params.url);
  const maxPages = params.maxPages ?? 4;

  const toFetch = new Set<string>([sourceUrl]);
  const pages: Array<{ url: string; title: string; text: string }> = [];

  const res = await fetch(sourceUrl, {
    redirect: "follow",
    headers: {
      "user-agent": "precision-ai-scout/0.1"
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = ($("title").first().text() || "").trim();
  const rootText = extractVisibleText(html);
  pages.push({ url: sourceUrl, title, text: rootText.slice(0, 20000) });

  const base = new URL(sourceUrl);
  const links: string[] = [];
  $("a[href]").each((_i: number, el: any) => {
    const href = String($(el).attr("href") || "");
    if (!href) return;
    try {
      const u = new URL(href, base);
      if (u.hostname !== base.hostname) return;
      const p = u.pathname.toLowerCase();
      if (["/pricing", "/careers", "/jobs", "/security", "/trust", "/about", "/product"].some((x) => p.startsWith(x))) {
        links.push(u.toString());
      }
    } catch {
      return;
    }
  });

  for (const l of links.slice(0, Math.max(0, maxPages - 1))) {
    if (toFetch.has(l)) continue;
    toFetch.add(l);
    try {
      const r = await fetch(l, { redirect: "follow", headers: { "user-agent": "precision-ai-scout/0.1" } });
      const h = await r.text();
      const $$ = cheerio.load(h);
      const t = ($$("title").first().text() || "").trim();
      const txt = extractVisibleText(h);
      pages.push({ url: l, title: t, text: txt.slice(0, 20000) });
    } catch {
      // ignore
    }
  }

  const combinedText = pages.map((p) => `${p.title}\n${p.text}`).join("\n\n");
  const lc = combinedText.toLowerCase();

  const extracted = {
    title: title || undefined,
    hasPricing: lc.includes("pricing") || lc.includes("request a demo") || lc.includes("contact sales"),
    hasCareers: lc.includes("careers") || lc.includes("open roles") || lc.includes("we're hiring"),
    hasSecurity: lc.includes("security") || lc.includes("soc 2") || lc.includes("iso 27001") || lc.includes("trust")
  };

  const summary = extractSummary(combinedText);
  const whatTheyDo = extractBullets(combinedText);
  const keywords = extractKeywords(combinedText);
  const signals = extractSignals(combinedText, pages);
  const fetchedAt = new Date().toISOString();

  return { 
    sourceUrl, 
    pages, 
    combinedText, 
    summary,
    whatTheyDo,
    keywords,
    signals,
    extracted,
    fetchedAt
  };
}
