import type { NewsArticle } from "./types";

const GOOGLE_NEWS_RSS =
  "https://news.google.com/rss/search";

// Minimal RSS item parser — no external dependencies
function parseRssItems(xml: string): NewsArticle[] {
  const items: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]!;
    const title = stripCdata(extractTag(block, "title"));
    const link = extractTag(block, "link") || extractTag(block, "guid");
    const pubDate = extractTag(block, "pubDate");
    const source = extractTag(block, "source");

    if (!title || !link) continue;

    // Google News redirects — extract domain from source tag or fall back
    const domain = source
      ? source.toLowerCase().replace(/^www\./, "")
      : domainFromUrl(link);

    items.push({
      url: link,
      title,
      seendate: pubDate ? rssDateToGdelt(pubDate) : "",
      domain,
      language: "English",
      sourcecountry: "",
    });
  }
  return items;
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1]!.trim() : "";
}

function stripCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// "Thu, 17 Sep 2026 04:43:44 GMT" → "20260917T044344Z"
function rssDateToGdelt(rss: string): string {
  try {
    const d = new Date(rss);
    if (isNaN(d.getTime())) return rss;
    return (
      d.getUTCFullYear().toString() +
      String(d.getUTCMonth() + 1).padStart(2, "0") +
      String(d.getUTCDate()).padStart(2, "0") +
      "T" +
      String(d.getUTCHours()).padStart(2, "0") +
      String(d.getUTCMinutes()).padStart(2, "0") +
      String(d.getUTCSeconds()).padStart(2, "0") +
      "Z"
    );
  } catch {
    return rss;
  }
}

export async function searchNews(
  query: string,
  maxRecords = 10,
): Promise<NewsArticle[]> {
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  });

  const response = await fetch(`${GOOGLE_NEWS_RSS}?${params}`, {
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": "MarginGuard/1.0" },
  });

  if (!response.ok) {
    throw new Error(`News RSS error: ${response.status}`);
  }

  const xml = await response.text();
  return parseRssItems(xml).slice(0, maxRecords);
}
