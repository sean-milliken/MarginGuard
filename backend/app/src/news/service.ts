import { searchNews } from "./client";
import type { NewsArticle, NewsService } from "./types";

// Broad query relevant to Steel City Beverages supply chain risks
const SUPPLY_CHAIN_QUERY = "supply chain disruption";

interface CacheEntry {
  articles: NewsArticle[];
  fetchedAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5-minute cache

export function createNewsService(): NewsService {
  let cache: CacheEntry | null = null;

  return {
    async getSupplyChainNews() {
      if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
        return cache.articles;
      }

      let articles: NewsArticle[] = [];
      try {
        articles = await searchNews(SUPPLY_CHAIN_QUERY, 15);
      } catch (err) {
        console.error(
          "News fetch failed:",
          err instanceof Error ? err.message : err,
        );
      }

      // Deduplicate by URL, keep newest first
      const seen = new Set<string>();
      const deduped = articles.filter((a) => {
        if (seen.has(a.url)) return false;
        seen.add(a.url);
        return true;
      });

      cache = { articles: deduped.slice(0, 10), fetchedAt: Date.now() };
      return cache.articles;
    },
  };
}
