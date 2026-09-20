import { userPool } from "../config/cognito";
const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
async function token(): Promise<string | undefined> {
  if (import.meta.env.VITE_MOCK_MODE === "true") return undefined;
  const user = userPool.getCurrentUser();
  if (!user) return undefined;
  return new Promise((resolve, reject) =>
    user.getSession(
      (
        error: Error | null,
        session: { getIdToken(): { getJwtToken(): string } } | null,
      ) =>
        error ? reject(error) : resolve(session?.getIdToken().getJwtToken()),
    ),
  );
}
export async function request<T>(path: string, body?: unknown): Promise<T> {
  const jwt = await token();
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : (data.error?.message ?? `Request failed (${response.status})`),
    );
  return data as T;
}

// FRED Economic Data Types
export interface EconomicSignal {
  id: string;
  seriesId: string;
  seriesName: string;
  date: string;
  currentValue: number;
  previousValue: number;
  absoluteChange: number;
  percentageChange: number;
  direction: "increasing" | "decreasing" | "stable";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  units: string;
  affectedComponents?: string[];
  source: "FRED";
  sourceUrl: string;
}

export interface EconomicImpact {
  signalId: string;
  componentId: string;
  componentName: string;
  currentCostCents: number;
  projectedCostCents: number;
  costIncreaseCents: number;
  monthlyVolumeAffected: number;
  monthlyImpactCents: number;
  affectedProducts: {
    productId: string;
    productName: string;
    monthlyVolume: number;
    contributionMarginImpactCents: number;
  }[];
}

// News Types
export interface NewsArticle {
  url: string;
  title: string;
  seendate: string; // "20260919T120000Z"
  domain: string;
  language: string;
  sourcecountry: string;
}

// News API
export async function getNews(): Promise<NewsArticle[]> {
  return request<NewsArticle[]>("/news");
}

// FRED API Functions
export async function getEconomicSignals(): Promise<EconomicSignal[]> {
  return request<EconomicSignal[]>("/fred/signals");
}

export async function getEconomicImpact(
  signalId: string,
): Promise<EconomicImpact[]> {
  return request<EconomicImpact[]>(`/fred/impact/${encodeURIComponent(signalId)}`);
}
