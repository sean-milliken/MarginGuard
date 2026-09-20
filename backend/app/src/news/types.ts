export interface NewsArticle {
  url: string;
  title: string;
  seendate: string; // "20260919T120000Z" format from GDELT
  domain: string;
  language: string;
  sourcecountry: string;
}

export interface NewsService {
  getSupplyChainNews(): Promise<NewsArticle[]>;
}
