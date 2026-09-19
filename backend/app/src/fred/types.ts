import type { CalculationStep } from "../../../financial-engine/src/types";

/**
 * Raw FRED API observation from /series/observations endpoint
 */
export interface FredObservation {
  date: string; // "YYYY-MM-DD"
  value: string; // "123.45" or "." for missing data
}

/**
 * Raw FRED API response
 */
export interface FredObservationsResponse {
  observations: FredObservation[];
}

/**
 * Normalized economic observation in domain model
 */
export interface EconomicObservation {
  seriesId: string;
  date: string; // ISO date "YYYY-MM-DD"
  value: number | null; // null if FRED returns "." (missing observation)
  cachedAt: string; // ISO timestamp
}

/**
 * Economic series metadata with observations
 */
export interface EconomicSeries {
  id: string;
  title: string;
  units: string;
  frequency: string;
  lastUpdated: string;
  observations: EconomicObservation[];
  source: "FRED";
  sourceUrl: string;
}

/**
 * Calculated economic signal with severity and change metrics
 */
export interface EconomicSignal {
  id: string; // `${seriesId}-${date}`
  seriesId: string;
  seriesName: string;
  date: string;
  currentValue: number;
  previousValue: number;
  absoluteChange: number; // current - previous
  percentageChange: number; // (change / previous) * 100
  direction: "increasing" | "decreasing" | "stable";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  units: string;
  affectedComponents?: string[]; // Component IDs from config mapping
  calculationSteps: CalculationStep[];
  source: "FRED";
  sourceUrl: string;
}

/**
 * Financial impact from economic signal mapped to company component
 */
export interface EconomicImpact {
  signalId: string;
  componentId: string;
  componentName: string;
  currentCostCents: number;
  projectedCostCents: number; // Deterministic: current * (1 + percentageChange/100)
  costIncreaseCents: number;
  monthlyVolumeAffected: number; // Sum across all products using component
  monthlyImpactCents: number; // volume * costIncrease
  affectedProducts: {
    productId: string;
    productName: string;
    monthlyVolume: number;
    contributionMarginImpactCents: number;
  }[];
  calculationSteps: CalculationStep[];
}

/**
 * FRED series configuration with component mapping
 */
export interface FredSeriesConfig {
  id: string; // FRED series ID
  name: string; // Display name
  category: "commodity" | "energy" | "producer-price";
  units: string; // Expected units
  frequency: "daily" | "monthly";
  description: string;
  componentMapping?: {
    componentId: string; // Maps to Steel City Beverages component
    impactType: "direct-cost"; // How series affects component
  };
}

/**
 * FRED client configuration
 */
export interface FredClientConfig {
  apiKey: string;
  baseUrl?: string; // Default: "https://api.stlouisfed.org/fred"
  timeout?: number; // Default: 10000ms
  maxRetries?: number; // Default: 3
}

/**
 * Options for fetching FRED observations
 */
export interface FredObservationsOptions {
  startDate?: string; // ISO date "YYYY-MM-DD"
  endDate?: string; // ISO date "YYYY-MM-DD"
  limit?: number; // Max observations to fetch
  sortOrder?: "asc" | "desc";
}
