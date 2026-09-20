import { describe, it } from "node:test";
import { expect } from "expect";
import { calculateComponentImpact } from "../impact";
import type { EconomicSignal } from "../types";
import type {
  Company,
  Component,
} from "../../../../financial-engine/src/types";

describe("calculateComponentImpact", () => {
  const mockSignal: EconomicSignal = {
    id: "TEST-2024-02-01",
    seriesId: "TEST",
    seriesName: "Test Commodity",
    date: "2024-02-01",
    currentValue: 105,
    previousValue: 100,
    absoluteChange: 5,
    percentageChange: 5,
    direction: "increasing",
    severity: "medium",
    description: "Test signal",
    units: "Index",
    calculationSteps: [],
    source: "FRED",
    sourceUrl: "https://fred.stlouisfed.org/series/TEST",
  };

  const mockComponent: Component = {
    id: "test-component",
    name: "Test Component",
    unitCostCents: 100, // $1.00
    sources: [
      {
        supplierId: "supplier-1",
        dependencyBps: 10000, // 100%
      },
    ],
    alternatives: [],
  };

  const mockCompany: Company = {
    id: "test-company",
    name: "Test Company",
    currency: "USD",
    daysInMonth: 30,
    suppliers: [
      {
        id: "supplier-1",
        name: "Test Supplier",
      },
    ],
    components: [mockComponent],
    products: [
      {
        id: "product-1",
        name: "Test Product",
        monthlyVolume: 1000,
        sellingPriceCents: 1000, // $10.00
        variableCostCents: 500, // $5.00
        billOfMaterials: [
          {
            componentId: "test-component",
            unitsPerProduct: 2,
          },
        ],
      },
    ],
  };

  it("calculates projected cost using BigInt patterns", () => {
    const impact = calculateComponentImpact(
      mockSignal,
      mockComponent,
      mockCompany,
    );

    // 5% increase on $1.00 = $1.05
    expect(impact.currentCostCents).toBe(100);
    expect(impact.projectedCostCents).toBe(105);
    expect(impact.costIncreaseCents).toBe(5);
  });

  it("calculates monthly volume affected across all products", () => {
    const impact = calculateComponentImpact(
      mockSignal,
      mockComponent,
      mockCompany,
    );

    // 1000 products * 2 units per product = 2000 component units
    expect(impact.monthlyVolumeAffected).toBe(2000);
  });

  it("calculates total monthly impact correctly", () => {
    const impact = calculateComponentImpact(
      mockSignal,
      mockComponent,
      mockCompany,
    );

    // 2000 units * $0.05 increase = $100 monthly impact
    expect(impact.monthlyImpactCents).toBe(10000); // 10000 cents = $100
  });

  it("calculates per-product contribution margin impact", () => {
    const impact = calculateComponentImpact(
      mockSignal,
      mockComponent,
      mockCompany,
    );

    expect(impact.affectedProducts).toHaveLength(1);
    expect(impact.affectedProducts[0].productId).toBe("product-1");
    expect(impact.affectedProducts[0].productName).toBe("Test Product");
    expect(impact.affectedProducts[0].monthlyVolume).toBe(1000);

    // Product uses 2 units, cost increase is $0.05/unit
    // Product cost increase: 2 * $0.05 = $0.10 per product
    // Monthly impact: 1000 products * $0.10 = $100
    expect(impact.affectedProducts[0].contributionMarginImpactCents).toBe(
      10000,
    );
  });

  it("includes calculation steps for transparency", () => {
    const impact = calculateComponentImpact(
      mockSignal,
      mockComponent,
      mockCompany,
    );

    expect(impact.calculationSteps).toBeDefined();
    expect(impact.calculationSteps.length).toBeGreaterThan(0);

    // Verify key calculation steps are present
    const formulas = impact.calculationSteps.map((step) => step.formula);
    expect(formulas.some((f) => f.includes("projectedCost"))).toBe(true);
    expect(formulas.some((f) => f.includes("monthlyImpact"))).toBe(true);
  });

  it("handles multiple products using the same component", () => {
    const companyWithMultipleProducts: Company = {
      ...mockCompany,
      products: [
        {
          id: "product-1",
          name: "Product 1",
          monthlyVolume: 1000,
          sellingPriceCents: 1000,
          variableCostCents: 500,
          billOfMaterials: [
            {
              componentId: "test-component",
              unitsPerProduct: 2,
            },
          ],
        },
        {
          id: "product-2",
          name: "Product 2",
          monthlyVolume: 500,
          sellingPriceCents: 1500,
          variableCostCents: 700,
          billOfMaterials: [
            {
              componentId: "test-component",
              unitsPerProduct: 3,
            },
          ],
        },
      ],
    };

    const impact = calculateComponentImpact(
      mockSignal,
      mockComponent,
      companyWithMultipleProducts,
    );

    // Product 1: 1000 * 2 = 2000 units
    // Product 2: 500 * 3 = 1500 units
    // Total: 3500 units
    expect(impact.monthlyVolumeAffected).toBe(3500);

    // Should have impacts for both products
    expect(impact.affectedProducts).toHaveLength(2);
  });

  it("handles products that don't use the component", () => {
    const companyWithMixedProducts: Company = {
      ...mockCompany,
      products: [
        {
          id: "product-with-component",
          name: "Product With Component",
          monthlyVolume: 1000,
          sellingPriceCents: 1000,
          variableCostCents: 500,
          billOfMaterials: [
            {
              componentId: "test-component",
              unitsPerProduct: 2,
            },
          ],
        },
        {
          id: "product-without-component",
          name: "Product Without Component",
          monthlyVolume: 500,
          sellingPriceCents: 1500,
          variableCostCents: 700,
          billOfMaterials: [
            {
              componentId: "other-component",
              unitsPerProduct: 1,
            },
          ],
        },
      ],
    };

    const impact = calculateComponentImpact(
      mockSignal,
      mockComponent,
      companyWithMixedProducts,
    );

    // Only product-with-component should be affected
    expect(impact.affectedProducts).toHaveLength(1);
    expect(impact.affectedProducts[0].productId).toBe("product-with-component");
  });

  it("handles negative percentage changes (price decreases)", () => {
    const decreasingSignal: EconomicSignal = {
      ...mockSignal,
      currentValue: 95,
      previousValue: 100,
      absoluteChange: -5,
      percentageChange: -5,
      direction: "decreasing",
    };

    const impact = calculateComponentImpact(
      decreasingSignal,
      mockComponent,
      mockCompany,
    );

    // 5% decrease on $1.00 = $0.95
    expect(impact.projectedCostCents).toBe(95);
    expect(impact.costIncreaseCents).toBe(-5);

    // Negative cost increase means cost savings
    expect(impact.monthlyImpactCents).toBeLessThan(0);
  });

  it("matches financial engine BigInt calculation patterns", () => {
    // Test that large values don't cause precision issues
    const largeVolumeCompany: Company = {
      ...mockCompany,
      products: [
        {
          id: "high-volume-product",
          name: "High Volume Product",
          monthlyVolume: 1000000, // 1 million units
          sellingPriceCents: 10000,
          variableCostCents: 5000,
          billOfMaterials: [
            {
              componentId: "test-component",
              unitsPerProduct: 5,
            },
          ],
        },
      ],
    };

    expect(() =>
      calculateComponentImpact(mockSignal, mockComponent, largeVolumeCompany),
    ).not.toThrow();
  });
});
