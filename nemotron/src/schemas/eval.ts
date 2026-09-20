import { z } from 'zod';
import {
  EventCategorySchema,
  NemotronAnalysisResultSchema,
  EntitySchema,
  GeographySchema,
} from './analysis';

export const BusinessContextSchema = z.object({
  industry: z.string().min(1),
  primaryCommodities: z.array(z.string().min(1)),
  supplierRegions: z.array(z.string().min(1)),
  description: z.string().optional(),
});

export const GroundTruthSchema = z.object({
  eventCategory: EventCategorySchema,
  isRelevant: z.boolean(),
  entities: z.array(EntitySchema),
  geographies: z.array(GeographySchema),
});

export const EvalDatasetItemSchema = z.object({
  id: z.string().min(1),
  articleText: z.string().min(1),
  groundTruth: GroundTruthSchema,
  businessContext: BusinessContextSchema.optional(),
});

export const PerCategoryStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  accuracy: z.number().min(0).max(1),
});

export const EvalMetricsSchema = z.object({
  classificationAccuracy: z.number().min(0).max(1),
  relevanceAccuracy: z.number().min(0).max(1),
  relevancePrecision: z.number().min(0).max(1).optional(),
  relevanceRecall: z.number().min(0).max(1).optional(),
  relevanceF1: z.number().min(0).max(1).optional(),
  relevanceExamples: z.number().int().nonnegative().optional(),
  entityPrecision: z.number().min(0).max(1),
  entityRecall: z.number().min(0).max(1),
  entityF1: z.number().min(0).max(1),
  structuredOutputValidityRate: z.number().min(0).max(1),
  totalExamples: z.number().int().nonnegative(),
  successfulInferences: z.number().int().nonnegative(),
  retriedCount: z.number().int().nonnegative(),
  classificationByCategory: z.record(EventCategorySchema, PerCategoryStatsSchema),
});

export const EvalResultItemSchema = z.object({
  id: z.string(),
  success: z.boolean(),
  firstAttemptSchemaValid: z.boolean(),
  retried: z.boolean(),
  classificationCorrect: z.boolean().optional(),
  relevanceCorrect: z.boolean().optional(),
  predicted: NemotronAnalysisResultSchema.optional(),
  error: z.string().optional(),
  validationErrors: z.array(z.string()).optional(),
  latencyMs: z.number().nonnegative(),
  expected: GroundTruthSchema.optional(),
  sourceExcerpt: z.string().optional(),
});

export const EvalResultsSchema = z.object({
  runTimestamp: z.string().datetime(),
  modelId: z.string(),
  metrics: EvalMetricsSchema,
  results: z.array(EvalResultItemSchema),
});

export type BusinessContext = z.infer<typeof BusinessContextSchema>;
export type GroundTruth = z.infer<typeof GroundTruthSchema>;
export type EvalDatasetItem = z.infer<typeof EvalDatasetItemSchema>;
export type EvalMetrics = z.infer<typeof EvalMetricsSchema>;
export type PerCategoryStats = z.infer<typeof PerCategoryStatsSchema>;
export type EvalResultItem = z.infer<typeof EvalResultItemSchema>;
export type EvalResults = z.infer<typeof EvalResultsSchema>;
