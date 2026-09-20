import { describe, it } from "node:test";
import { expect } from "expect";
import { calculateSignal } from "../signals";
import type { EconomicObservation, FredSeriesConfig } from "../types";

describe("calculateSignal", () => {
  const mockConfig: FredSeriesConfig = {
    id: "TEST_SERIES",
    name: "Test Commodity Price Index",
    category: "commodity",
    units: "Index 1984=100",
    frequency: "monthly",
    description: "Test series for unit testing",
  };

  const createObservation = (
    value: number | null,
    date: string = "2024-01-01",
  ): EconomicObservation => ({
    seriesId: "TEST_SERIES",
    date,
    value,
    cachedAt: new Date().toISOString(),
  });

  it("calculates percentage change correctly for increasing values", () => {
    const current = createObservation(110, "2024-02-01");
    const previous = createObservation(100, "2024-01-01");

    const signal = calculateSignal(current, previous, mockConfig);

    expect(signal.absoluteChange).toBe(10);
    expect(signal.percentageChange).toBe(10);
    expect(signal.direction).toBe("increasing");
    expect(signal.severity).toBe("critical");
  });

  it("calculates percentage change correctly for decreasing values", () => {
    const current = createObservation(95, "2024-02-01");
    const previous = createObservation(100, "2024-01-01");

    const signal = calculateSignal(current, previous, mockConfig);

    expect(signal.absoluteChange).toBe(-5);
    expect(signal.percentageChange).toBe(-5);
    expect(signal.direction).toBe("decreasing");
    expect(signal.severity).toBe("high");
  });

  it("correctly identifies stable values", () => {
    const current = createObservation(100.05, "2024-02-01");
    const previous = createObservation(100, "2024-01-01");

    const signal = calculateSignal(current, previous, mockConfig);

    expect(signal.direction).toBe("stable");
    expect(signal.severity).toBe("low");
  });

  it("assigns correct severity levels", () => {
    const testCases = [
      { change: 1.5, expectedSeverity: "low" as const },
      { change: 3, expectedSeverity: "medium" as const },
      { change: 7, expectedSeverity: "high" as const },
      { change: 12, expectedSeverity: "critical" as const },
    ];

    for (const { change, expectedSeverity } of testCases) {
      const current = createObservation(100 + change, "2024-02-01");
      const previous = createObservation(100, "2024-01-01");

      const signal = calculateSignal(current, previous, mockConfig);
      expect(signal.severity).toBe(expectedSeverity);
    }
  });

  it("throws error for null current value", () => {
    const current = createObservation(null, "2024-02-01");
    const previous = createObservation(100, "2024-01-01");

    expect(() => calculateSignal(current, previous, mockConfig)).toThrow();
  });

  it("throws error for null previous value", () => {
    const current = createObservation(110, "2024-02-01");
    const previous = createObservation(null, "2024-01-01");

    expect(() => calculateSignal(current, previous, mockConfig)).toThrow();
  });

  it("throws error when previous value is zero", () => {
    const current = createObservation(110, "2024-02-01");
    const previous = createObservation(0, "2024-01-01");

    expect(() => calculateSignal(current, previous, mockConfig)).toThrow(
      "previous value is zero",
    );
  });

  it("includes calculation steps for transparency", () => {
    const current = createObservation(105, "2024-02-01");
    const previous = createObservation(100, "2024-01-01");

    const signal = calculateSignal(current, previous, mockConfig);

    expect(signal.calculationSteps).toBeDefined();
    expect(signal.calculationSteps.length).toBeGreaterThan(0);
    expect(signal.calculationSteps[0].formula).toContain("absoluteChange");
    expect(signal.calculationSteps[1].formula).toContain("percentageChange");
  });

  it("includes source URL and metadata", () => {
    const current = createObservation(105, "2024-02-01");
    const previous = createObservation(100, "2024-01-01");

    const signal = calculateSignal(current, previous, mockConfig);

    expect(signal.source).toBe("FRED");
    expect(signal.sourceUrl).toContain("fred.stlouisfed.org");
    expect(signal.sourceUrl).toContain(mockConfig.id);
    expect(signal.seriesName).toBe(mockConfig.name);
    expect(signal.units).toBe(mockConfig.units);
  });

  it("includes affected components when mapping exists", () => {
    const configWithMapping: FredSeriesConfig = {
      ...mockConfig,
      componentMapping: {
        componentId: "aluminum-can",
        impactType: "direct-cost",
      },
    };

    const current = createObservation(105, "2024-02-01");
    const previous = createObservation(100, "2024-01-01");

    const signal = calculateSignal(current, previous, configWithMapping);

    expect(signal.affectedComponents).toBeDefined();
    expect(signal.affectedComponents).toEqual(["aluminum-can"]);
  });

  it("handles negative to positive transition", () => {
    const current = createObservation(105, "2024-02-01");
    const previous = createObservation(-10, "2024-01-01");

    expect(() => calculateSignal(current, previous, mockConfig)).not.toThrow();
  });
});
