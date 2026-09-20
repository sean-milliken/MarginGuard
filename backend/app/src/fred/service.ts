import type { Company } from "../../../financial-engine/src/types";
import { FredClient } from "./client";
import type { EconomicDataCache } from "./cache";
import {
  FRED_SERIES_CONFIG,
  getDefaultDateRange,
  getSeriesConfig,
  getSeriesWithMappings,
  isAllowedSeriesId,
} from "./config";
import { calculateSignalImpacts } from "./impact";
import { calculateSignal, getLatestSignals } from "./signals";
import type {
  EconomicImpact,
  EconomicObservation,
  EconomicSeries,
  EconomicSignal,
} from "./types";

/**
 * FRED service for fetching, caching, and analyzing economic data
 */
export interface FredService {
  /**
   * Get all configured FRED series with latest observations
   */
  getConfiguredSeries(): Promise<EconomicSeries[]>;

  /**
   * Get specific series with observations
   */
  getSeries(
    seriesId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    },
  ): Promise<EconomicSeries | null>;

  /**
   * Get current economic signals
   */
  getSignals(): Promise<EconomicSignal[]>;

  /**
   * Get signal by ID
   */
  getSignal(signalId: string): Promise<EconomicSignal | null>;

  /**
   * Calculate financial impact for signal
   */
  calculateImpact(
    signalId: string,
    company: Company,
  ): Promise<EconomicImpact[]>;
}

/**
 * Create FRED service
 */
export function createFredService(
  client: FredClient | null,
  cache: EconomicDataCache,
): FredService {
  return {
    async getConfiguredSeries() {
      const series: EconomicSeries[] = [];

      for (const config of FRED_SERIES_CONFIG) {
        try {
          const seriesData = await this.getSeries(config.id);
          if (seriesData) {
            series.push(seriesData);
          }
        } catch (error) {
          console.error(
            `Error fetching series ${config.id}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      return series;
    },

    async getSeries(seriesId, options = {}) {
      if (!isAllowedSeriesId(seriesId)) {
        return null;
      }

      const config = getSeriesConfig(seriesId);
      if (!config) {
        return null;
      }

      const { startDate, endDate } =
        options.startDate && options.endDate
          ? { startDate: options.startDate, endDate: options.endDate }
          : getDefaultDateRange();

      // Try cache first
      let observations = await cache.getObservations(
        seriesId,
        startDate,
        endDate,
      );

      // If cache miss or insufficient data, fetch from FRED
      if (observations.length === 0 && client) {
        try {
          observations = await client.getObservations(seriesId, {
            startDate,
            endDate,
            limit: options.limit,
            sortOrder: "desc",
          });

          // Cache the observations
          if (observations.length > 0) {
            await cache.putObservations(observations);
          }
        } catch (error) {
          console.error(
            `Error fetching from FRED API:`,
            error instanceof Error ? error.message : error,
          );
          // Continue with cached data (may be empty)
        }
      }

      const latest = observations
        .filter((obs) => obs.value !== null)
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      return {
        id: config.id,
        title: config.name,
        units: config.units,
        frequency: config.frequency,
        lastUpdated: latest?.cachedAt ?? new Date().toISOString(),
        observations: observations.sort((a, b) => a.date.localeCompare(b.date)),
        source: "FRED",
        sourceUrl: `https://fred.stlouisfed.org/series/${config.id}`,
      };
    },

    async getSignals() {
      // Fetch observations for all configured series
      const observationsMap = new Map<string, EconomicObservation[]>();

      for (const config of FRED_SERIES_CONFIG) {
        try {
          const series = await this.getSeries(config.id);
          if (series) {
            observationsMap.set(config.id, series.observations);
          }
        } catch (error) {
          console.error(
            `Error fetching series ${config.id}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      // Calculate signals
      const signals = await getLatestSignals(
        observationsMap,
        FRED_SERIES_CONFIG,
      );

      return signals;
    },

    async getSignal(signalId) {
      // Signal ID format: seriesId-date
      const [, seriesId, date] =
        signalId.match(/^(.+)-(\d{4}-\d{2}-\d{2})$/) ?? [];
      if (!seriesId || !date) {
        return null;
      }

      const config = getSeriesConfig(seriesId);
      if (!config) {
        return null;
      }

      const series = await this.getSeries(seriesId);
      if (!series) {
        return null;
      }

      // Find the observations around the signal date
      const observations = series.observations
        .filter((obs) => obs.value !== null)
        .sort((a, b) => b.date.localeCompare(a.date));

      const currentIndex = observations.findIndex((obs) => obs.date === date);
      if (currentIndex === -1 || currentIndex >= observations.length - 1) {
        return null;
      }

      const current = observations[currentIndex];
      const previous = observations[currentIndex + 1];

      try {
        return calculateSignal(current, previous, config);
      } catch (error) {
        console.error(
          `Error calculating signal ${signalId}:`,
          error instanceof Error ? error.message : error,
        );
        return null;
      }
    },

    async calculateImpact(signalId, company) {
      const signal = await this.getSignal(signalId);
      if (!signal) {
        return [];
      }

      return calculateSignalImpacts(signal, company);
    },
  };
}

/**
 * Check if FRED integration is available
 */
export function isFredAvailable(client: FredClient | null): boolean {
  return client !== null;
}
