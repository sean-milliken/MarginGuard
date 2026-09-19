import type { FredSeriesConfig } from "./types";

/**
 * Severity thresholds for economic signal classification
 * These are demo thresholds, not financial advice
 */
export const SEVERITY_THRESHOLDS = {
  low: 2, // < 2% change
  medium: 5, // 2-5% change
  high: 10, // 5-10% change
  critical: 10, // > 10% change
} as const;

/**
 * FRED series configuration with component mappings to Steel City Beverages
 * This allowlist provides security boundary - no arbitrary FRED API proxy
 */
export const FRED_SERIES_CONFIG: FredSeriesConfig[] = [
  {
    id: "PCU331315331315",
    name: "Aluminum Sheet, Plate & Foil PPI",
    category: "commodity",
    units: "Index Dec 1984=100",
    frequency: "monthly",
    description:
      "Producer price index for aluminum sheet, plate, and foil manufacturing",
    componentMapping: {
      componentId: "can",
      impactType: "direct-cost",
    },
  },
  {
    id: "PPIACO",
    name: "Producer Price Index: All Commodities",
    category: "producer-price",
    units: "Index 1982=100",
    frequency: "monthly",
    description: "General commodity price pressure indicator",
  },
  {
    id: "PCU322121322121",
    name: "Corrugated & Solid Fiber Boxes PPI",
    category: "commodity",
    units: "Index Dec 2003=100",
    frequency: "monthly",
    description:
      "Producer price index for corrugated and solid fiber box manufacturing",
    componentMapping: {
      componentId: "carton",
      impactType: "direct-cost",
    },
  },
  {
    id: "WPU01170301",
    name: "Industrial Electric Power PPI",
    category: "energy",
    units: "Index 1982=100",
    frequency: "monthly",
    description: "Producer price index for industrial electric power",
  },
];

/**
 * Get series configuration by ID
 */
export function getSeriesConfig(seriesId: string): FredSeriesConfig | undefined {
  return FRED_SERIES_CONFIG.find((c) => c.id === seriesId);
}

/**
 * Check if series ID is in allowlist
 */
export function isAllowedSeriesId(seriesId: string): boolean {
  return FRED_SERIES_CONFIG.some((c) => c.id === seriesId);
}

/**
 * Get all series with component mappings
 */
export function getSeriesWithMappings(): FredSeriesConfig[] {
  return FRED_SERIES_CONFIG.filter((c) => c.componentMapping !== undefined);
}

/**
 * Default date range for FRED observations (last 24 months)
 */
export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 24);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}
