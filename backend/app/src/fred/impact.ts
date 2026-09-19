import type {
  CalculationStep,
  Company,
  Component,
} from "../../../financial-engine/src/types";
import type { EconomicImpact, EconomicSignal } from "./types";

/**
 * BigInt helpers (matching financial engine patterns)
 */
const BPS = 10_000n; // Basis points

function safe(value: bigint): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) {
    throw new Error("Calculation exceeds safe integer range");
  }
  return result;
}

const sum = (values: number[]): number =>
  safe(values.reduce((a, b) => a + BigInt(b), 0n));

const mul = (a: number, b: number): number => safe(BigInt(a) * BigInt(b));

/**
 * Calculate financial impact of economic signal on company component
 * Uses deterministic BigInt calculations matching financial engine patterns
 */
export function calculateComponentImpact(
  signal: EconomicSignal,
  component: Component,
  company: Company,
): EconomicImpact {
  const calculationSteps: CalculationStep[] = [];

  // Current component cost
  const currentCostCents = component.unitCostCents;
  calculationSteps.push({
    formula: `currentCost = ${currentCostCents} cents per unit`,
    result: currentCostCents,
    unit: "cents",
  });

  // Apply percentage change to component cost using BigInt (basis points)
  // costChangeMultiplier is in basis points (e.g., 5.03% = 503 bps)
  const costChangeMultiplier = BigInt(Math.round(signal.percentageChange * 100));
  const projectedCostCents = safe(
    (BigInt(currentCostCents) * (BPS + costChangeMultiplier)) / BPS,
  );
  calculationSteps.push({
    formula: `projectedCost = ${currentCostCents} × (10000 + ${costChangeMultiplier}) / 10000`,
    result: projectedCostCents,
    unit: "cents",
  });

  const costIncreaseCents = projectedCostCents - currentCostCents;
  calculationSteps.push({
    formula: `costIncrease = ${projectedCostCents} - ${currentCostCents}`,
    result: costIncreaseCents,
    unit: "cents",
  });

  // Calculate monthly volume affected: sum across all products using this component
  const monthlyVolume = sum(
    company.products.map((p) =>
      mul(
        p.monthlyVolume,
        p.billOfMaterials.find((b) => b.componentId === component.id)
          ?.unitsPerProduct ?? 0,
      ),
    ),
  );
  calculationSteps.push({
    formula: `monthlyVolume = sum across products using component`,
    result: monthlyVolume,
    unit: "component units",
  });

  // Monthly impact
  const monthlyImpactCents = mul(monthlyVolume, costIncreaseCents);
  calculationSteps.push({
    formula: `monthlyImpact = ${monthlyVolume} × ${costIncreaseCents}`,
    result: monthlyImpactCents,
    unit: "cents",
  });

  // Calculate per-product contribution margin impact
  const affectedProducts = company.products
    .filter((p) => p.billOfMaterials.some((b) => b.componentId === component.id))
    .map((p) => {
      const unitsPerProduct =
        p.billOfMaterials.find((b) => b.componentId === component.id)!
          .unitsPerProduct;
      const productCostIncrease = mul(unitsPerProduct, costIncreaseCents);
      const marginImpact = mul(p.monthlyVolume, productCostIncrease);

      calculationSteps.push({
        formula: `${p.id}: productCostIncrease = ${unitsPerProduct} × ${costIncreaseCents}`,
        result: productCostIncrease,
        unit: "cents per product",
      });
      calculationSteps.push({
        formula: `${p.id}: marginImpact = ${p.monthlyVolume} × ${productCostIncrease}`,
        result: marginImpact,
        unit: "cents",
      });

      return {
        productId: p.id,
        productName: p.name,
        monthlyVolume: p.monthlyVolume,
        contributionMarginImpactCents: marginImpact,
      };
    });

  return {
    signalId: signal.id,
    componentId: component.id,
    componentName: component.name,
    currentCostCents,
    projectedCostCents,
    costIncreaseCents,
    monthlyVolumeAffected: monthlyVolume,
    monthlyImpactCents,
    affectedProducts,
    calculationSteps,
  };
}

/**
 * Calculate all impacts for a signal
 */
export function calculateSignalImpacts(
  signal: EconomicSignal,
  company: Company,
): EconomicImpact[] {
  if (!signal.affectedComponents || signal.affectedComponents.length === 0) {
    return [];
  }

  const impacts: EconomicImpact[] = [];

  for (const componentId of signal.affectedComponents) {
    const component = company.components.find((c) => c.id === componentId);
    if (!component) {
      console.warn(
        `Component ${componentId} not found in company ${company.id}`,
      );
      continue;
    }

    try {
      const impact = calculateComponentImpact(signal, component, company);
      impacts.push(impact);
    } catch (error) {
      console.error(
        `Error calculating impact for ${componentId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return impacts;
}
