import type { CalculationStep } from "../../../financial-engine/src/types";
import type { EconomicObservation, EconomicSignal, FredSeriesConfig } from "./types";
import { SEVERITY_THRESHOLDS } from "./config";

/**
 * Calculate economic signal from current and previous observations
 * Pure, deterministic calculation - no network, model, or random inputs
 */
export function calculateSignal(
  current: EconomicObservation,
  previous: EconomicObservation,
  config: FredSeriesConfig,
): EconomicSignal {
  if (current.value === null || previous.value === null) {
    throw new Error(
      "Cannot calculate signal with missing observations (null values)",
    );
  }

  if (previous.value === 0) {
    throw new Error("Cannot calculate signal: previous value is zero");
  }

  // Deterministic calculations
  const absoluteChange = current.value - previous.value;
  const percentageChange = (absoluteChange / previous.value) * 100;

  const severity = calculateSeverity(Math.abs(percentageChange));
  const direction = calculateDirection(percentageChange);

  const calculationSteps: CalculationStep[] = [
    {
      formula: `absoluteChange = ${current.value} - ${previous.value}`,
      result: absoluteChange,
      unit: "index points",
    },
    {
      formula: `percentageChange = (${absoluteChange} / ${previous.value}) × 100`,
      result: percentageChange,
      unit: "percent",
    },
    {
      formula: `severity = ${severity} (threshold: ${getSeverityThreshold(severity)}%)`,
      result: getSeverityNumeric(severity),
      unit: "severity level",
    },
  ];

  const description = generateDescription(config.name, percentageChange, direction);

  return {
    id: `${current.seriesId}-${current.date}`,
    seriesId: current.seriesId,
    seriesName: config.name,
    date: current.date,
    currentValue: current.value,
    previousValue: previous.value,
    absoluteChange,
    percentageChange,
    direction,
    severity,
    description,
    units: config.units,
    affectedComponents: config.componentMapping
      ? [config.componentMapping.componentId]
      : undefined,
    calculationSteps,
    source: "FRED",
    sourceUrl: `https://fred.stlouisfed.org/series/${current.seriesId}`,
  };
}

/**
 * Calculate severity based on absolute percentage change
 */
function calculateSeverity(
  absPercentageChange: number,
): "low" | "medium" | "high" | "critical" {
  if (absPercentageChange >= SEVERITY_THRESHOLDS.critical) {
    return "critical";
  }
  if (absPercentageChange >= SEVERITY_THRESHOLDS.high) {
    return "high";
  }
  if (absPercentageChange >= SEVERITY_THRESHOLDS.medium) {
    return "medium";
  }
  return "low";
}

/**
 * Calculate direction based on percentage change
 */
function calculateDirection(
  percentageChange: number,
): "increasing" | "decreasing" | "stable" {
  // Consider changes < 0.1% as stable
  if (Math.abs(percentageChange) < 0.1) {
    return "stable";
  }
  return percentageChange > 0 ? "increasing" : "decreasing";
}

/**
 * Get severity threshold value for display
 */
function getSeverityThreshold(severity: string): number {
  switch (severity) {
    case "critical":
      return SEVERITY_THRESHOLDS.critical;
    case "high":
      return SEVERITY_THRESHOLDS.high;
    case "medium":
      return SEVERITY_THRESHOLDS.medium;
    default:
      return SEVERITY_THRESHOLDS.low;
  }
}

/**
 * Get numeric severity for calculation steps
 */
function getSeverityNumeric(severity: string): number {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

/**
 * Generate human-readable description
 */
function generateDescription(
  seriesName: string,
  percentageChange: number,
  direction: string,
): string {
  const absChange = Math.abs(percentageChange).toFixed(2);
  const verb = direction === "increasing" ? "increased" : direction === "decreasing" ? "decreased" : "remained stable";

  return `${seriesName} ${verb} ${absChange}% month-over-month`;
}

/**
 * Get latest signal for each configured series
 */
export async function getLatestSignals(
  observations: Map<string, EconomicObservation[]>,
  configs: FredSeriesConfig[],
): Promise<EconomicSignal[]> {
  const signals: EconomicSignal[] = [];

  for (const config of configs) {
    const seriesObs = observations.get(config.id);
    if (!seriesObs || seriesObs.length < 2) {
      continue;
    }

    // Filter out missing values and sort by date descending
    const validObs = seriesObs
      .filter((obs) => obs.value !== null)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (validObs.length < 2) {
      continue;
    }

    const current = validObs[0];
    const previous = validObs[1];

    try {
      const signal = calculateSignal(current, previous, config);
      signals.push(signal);
    } catch (error) {
      console.error(
        `Error calculating signal for ${config.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return signals;
}
