import { z } from "zod";
import { analyzeDisruption } from "../../financial-engine/src/index";
import {
  steelCityBeverages,
  logisticsDisruption,
} from "../../financial-engine/src/steel-city-beverages";
import {
  analyzeArticle,
  type AnalysisInput,
  type AnalysisOutcome,
} from "../../../nemotron/src/analyze";
import type {
  ApplicationSnapshot,
  ScenarioDefinition,
} from "../../../shared/src/application";

const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const id = z.string().trim().min(1).max(120);
export const eventSchema = z
  .object({
    id,
    type: z.literal("logistics-disruption"),
    supplierIds: z.array(id).max(100),
    disruptionDays: integer.max(31),
    unavailableBps: integer.max(10000),
    description: z.string().max(5000),
  })
  .strict();
export const companySchema = z
  .object({
    id,
    name: z.string().min(1).max(200),
    currency: z.literal("USD"),
    daysInMonth: integer.min(1).max(31),
    suppliers: z
      .array(z.object({ id, name: z.string().min(1).max(200) }).strict())
      .min(1)
      .max(100),
    components: z
      .array(
        z
          .object({
            id,
            name: z.string().min(1).max(200),
            unitCostCents: integer,
            sources: z
              .array(
                z
                  .object({ supplierId: id, dependencyBps: integer.max(10000) })
                  .strict(),
              )
              .max(100),
            alternatives: z
              .array(
                z
                  .object({
                    supplierId: id,
                    capacityUnits: integer,
                    premiumBps: integer,
                    expeditedShippingCentsPerUnit: integer,
                    fixedExpeditingCents: integer,
                  })
                  .strict(),
              )
              .max(100),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    products: z
      .array(
        z
          .object({
            id,
            name: z.string().min(1).max(200),
            monthlyVolume: integer,
            sellingPriceCents: integer,
            variableCostCents: integer,
            billOfMaterials: z
              .array(
                z
                  .object({ componentId: id, unitsPerProduct: integer.min(1) })
                  .strict(),
              )
              .min(1)
              .max(100),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();
export const analysisRequestSchema = z
  .object({
    companyId: z.literal(steelCityBeverages.id).optional(),
    scenarioId: id.optional(),
    company: companySchema.optional(),
    event: eventSchema.optional(),
  })
  .strict();
export const scenarios: ScenarioDefinition[] = [
  {
    id: "logistics-15-days",
    name: "Freight closure · 15 days",
    event: logisticsDisruption,
  },
  {
    id: "logistics-7-days",
    name: "Freight closure · 7 days",
    event: {
      ...logisticsDisruption,
      id: "freight-7-days",
      disruptionDays: 7,
      description:
        "Synthetic seven-day closure of Allegheny freight deliveries.",
    },
  },
  {
    id: "logistics-30-days",
    name: "Freight closure · full month",
    event: {
      ...logisticsDisruption,
      id: "freight-30-days",
      disruptionDays: 30,
      description:
        "Synthetic full-month closure of Allegheny freight deliveries.",
    },
  },
];
export class InvalidInputError extends Error {}

export function createSnapshot(raw: unknown = {}): ApplicationSnapshot {
  const input = analysisRequestSchema.parse(raw);
  const scenario = scenarios.find(
    (s) => s.id === (input.scenarioId ?? scenarios[0]!.id),
  );
  if (!scenario) throw new InvalidInputError("Unknown scenario");
  const company = input.company ?? steelCityBeverages;
  const event = input.event ?? scenario.event;
  let report;
  try {
    report = analyzeDisruption(company, event);
  } catch (error) {
    throw new InvalidInputError(
      error instanceof Error ? error.message : "Invalid financial inputs",
    );
  }
  return {
    company,
    event,
    report,
    scenarios,
    selectedScenarioId: input.event ? "custom" : scenario.id,
    source: {
      title: "Synthetic manufacturing disruption brief",
      synthetic: true,
      text: `${event.description}\nConfirmed modeling inputs: ${event.disruptionDays} disrupted days in a ${company.daysInMonth}-day month; ${event.unavailableBps / 100}% of deliveries unavailable for ${event.supplierIds.map((id) => company.suppliers.find((s) => s.id === id)?.name ?? id).join(", ")}.`,
    },
    intelligenceAvailable: Boolean(process.env.NVIDIA_API_KEY),
  };
}
export const intelligenceRequestSchema = z
  .object({
    articleText: z.string().trim().min(20).max(30000),
    analysis: analysisRequestSchema.optional(),
  })
  .strict();
export type Analyzer = (input: AnalysisInput) => Promise<AnalysisOutcome>;
export async function classifyArticle(
  raw: unknown,
  analyzer: Analyzer = (input) =>
    analyzeArticle(input, { timeoutMs: 10000, maxAttempts: 1 }),
): Promise<AnalysisOutcome> {
  const input = intelligenceRequestSchema.parse(raw);
  const snapshot = createSnapshot(input.analysis ?? {});
  // No model-derived fields ever enter createSnapshot or the financial engine.
  const outcome = await analyzer({
    articleText: input.articleText,
    businessContext: {
      industry: "Beverage manufacturing",
      primaryCommodities: ["aluminum", "beverage base", "corrugated packaging"],
      supplierRegions: ["United States"],
      description: snapshot.company.name,
    },
    responseOptions: snapshot.report.responseOptions.map((option) => ({
      id: option.id,
      description: option.description,
    })),
  });
  if (!outcome.success) return outcome;
  const result = outcome.result;
  const quotes = [
    ...result.evidence,
    ...(result.duration ? [result.duration.evidence] : []),
  ];
  const allowedIds = new Set(
    snapshot.report.responseOptions.map((option) => option.id),
  );
  const ranks = result.responseOptionRanking ?? [];
  if (
    quotes.some((quote) => !input.articleText.includes(quote)) ||
    ranks.some((rank) => !allowedIds.has(rank.optionId)) ||
    new Set(ranks.map((r) => r.optionId)).size !== ranks.length ||
    new Set(ranks.map((r) => r.rank)).size !== ranks.length
  ) {
    return {
      success: false,
      retried: outcome.retried,
      firstAttemptSchemaValid: outcome.firstAttemptSchemaValid,
      error: {
        type: "VALIDATION_ERROR",
        message:
          "Model evidence must quote the submitted text and rankings must reference unique supplied response options.",
      },
    };
  }
  return outcome;
}
