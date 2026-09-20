import { analyzeDisruption } from "./index.ts";
import type { Analysis, Company, IntelligenceEvent } from "./types.ts";

export interface StressInputs {
  disruptionDays: number;
  supplierId: string;
  dependencyBps: number;
  premiumBps: number;
  /** Additional fixed charge on every recovery option; cents. */
  responseCostCents: number;
}
export const recommendedResponse = (report: Analysis) =>
  report.responseOptions.reduce((best, option) =>
    option.netFinancialBenefitCents > best.netFinancialBenefitCents
      ? option
      : best,
  );

/** Explicit scenario assumptions only. Never accepts model-generated financial fields. */
export function stressTest(
  company: Company,
  event: IntelligenceEvent,
  inputs: StressInputs,
): Analysis {
  for (const [key, value, max] of [
    ["disruptionDays", inputs.disruptionDays, company.daysInMonth],
    ["dependencyBps", inputs.dependencyBps, 10000],
    ["premiumBps", inputs.premiumBps, 5000],
    ["responseCostCents", inputs.responseCostCents, Number.MAX_SAFE_INTEGER],
  ] as const) {
    if (!Number.isSafeInteger(value) || value < 0 || value > max)
      throw new Error(`Invalid ${key}`);
  }
  if (!company.suppliers.some((s) => s.id === inputs.supplierId))
    throw new Error("Unknown stress supplier");
  const modeled = structuredClone(company);
  for (const component of modeled.components) {
    const target = component.sources.find(
      (s) => s.supplierId === inputs.supplierId,
    );
    if (target) {
      const others = component.sources.filter((s) => s !== target);
      // A sole source cannot be diluted without inventing a supply relationship.
      if (!others.length && inputs.dependencyBps !== 10000)
        throw new Error("A sole source requires 100% dependency");
      const remaining = 10000 - inputs.dependencyBps;
      const total = others.reduce((sum, s) => sum + s.dependencyBps, 0);
      let assigned = 0;
      others.forEach((source, index) => {
        const share =
          index === others.length - 1
            ? remaining - assigned
            : total === 0
              ? Math.floor(remaining / others.length)
              : Math.floor((remaining * source.dependencyBps) / total);
        source.dependencyBps = share;
        assigned += share;
      });
      target.dependencyBps = inputs.dependencyBps;
    }
    for (const alternative of component.alternatives) {
      alternative.premiumBps = inputs.premiumBps;
      alternative.fixedExpeditingCents += inputs.responseCostCents;
    }
  }
  return analyzeDisruption(modeled, {
    ...event,
    disruptionDays: inputs.disruptionDays,
  });
}

export interface DecisionBoundary {
  parameter: "disruptionDays" | "premiumBps" | "responseCostCents";
  minimum: number;
  maximum: number;
  step: number;
  lower: number | null;
  upper: number | null;
  alternativeId: string | null;
  alternativeDescription: string | null;
  netBenefitCents: number | null;
}
/** Nearest sampled change on either side; one variable changes, all others stay fixed.
 * Results are brackets at the stated resolution, not claims of exact continuous roots.
 */
export function decisionBoundaries(
  company: Company,
  event: IntelligenceEvent,
  inputs: StressInputs,
): DecisionBoundary[] {
  const report = stressTest(company, event, inputs);
  const current = recommendedResponse(report).id;
  const costMaximum = Math.max(
    10000,
    Math.ceil(report.contributionMarginAtRiskCents / 10000) * 10000 + 10000,
  );
  return (
    [
      ["disruptionDays", 1, company.daysInMonth, 1],
      ["premiumBps", 0, 5000, 50],
      [
        "responseCostCents",
        0,
        costMaximum,
        Math.max(10000, Math.ceil(costMaximum / 100 / 10000) * 10000),
      ],
    ] as const
  ).map(([parameter, minimum, maximum, step]) => {
    let found: DecisionBoundary = {
      parameter,
      minimum,
      maximum,
      step,
      lower: null,
      upper: null,
      alternativeId: null,
      alternativeDescription: null,
      netBenefitCents: null,
    };
    let distance = Infinity;
    for (const direction of [-1, 1]) {
      let previous = inputs[parameter];
      for (
        let value = previous + step * direction;
        value >= minimum && value <= maximum;
        value += step * direction
      ) {
        const best = recommendedResponse(
          stressTest(company, event, { ...inputs, [parameter]: value }),
        );
        if (best.id !== current) {
          if (Math.abs(value - inputs[parameter]) < distance) {
            distance = Math.abs(value - inputs[parameter]);
            found = {
              ...found,
              lower: Math.min(previous, value),
              upper: Math.max(previous, value),
              alternativeId: best.id,
              alternativeDescription: best.description,
              netBenefitCents: best.netFinancialBenefitCents,
            };
          }
          break;
        }
        previous = value;
      }
    }
    return found;
  });
}
