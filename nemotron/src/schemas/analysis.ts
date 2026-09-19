import { z } from 'zod';

export const EventCategorySchema = z.enum([
  'LOGISTICS_DISRUPTION',
  'SUPPLIER_DISRUPTION',
  'INPUT_COST_INCREASE',
  'IRRELEVANT',
]);

export const EntityTypeSchema = z.enum([
  'COMPANY',
  'SUPPLIER',
  'PORT',
  'COMMODITY',
  'PRODUCT',
  'ORGANIZATION',
]);

export const GeographyTypeSchema = z.enum([
  'COUNTRY',
  'REGION',
  'PORT',
  'CITY',
]);

export const DurationUnitSchema = z.enum(['DAYS', 'WEEKS', 'MONTHS', 'UNKNOWN']);

export const SupplyChainSegmentSchema = z.enum([
  'RAW_MATERIALS',
  'INBOUND_LOGISTICS',
  'MANUFACTURING',
  'OUTBOUND_LOGISTICS',
  'DISTRIBUTION',
  'RETAIL',
]);

export const EntitySchema = z.object({
  name: z.string().min(1, 'Entity name cannot be empty'),
  type: EntityTypeSchema,
  role: z.string().min(1).optional(),
});

export const GeographySchema = z.object({
  name: z.string().min(1, 'Geography name cannot be empty'),
  type: GeographyTypeSchema,
});

// Duration is omitted entirely when the article provides no explicit timeframe evidence.
export const DurationSchema = z.object({
  estimate: z.number().positive('Estimate must be a positive number'),
  unit: DurationUnitSchema,
  evidenceBased: z.literal(true, {
    errorMap: () => ({ message: 'evidenceBased must be exactly true' }),
  }),
  evidence: z.string().min(1, 'Evidence quote cannot be empty'),
});

export const EventClassificationSchema = z.object({
  category: EventCategorySchema,
  confidence: z.number().min(0).max(1, 'Confidence must be between 0 and 1'),
  rationale: z.string().min(1, 'Rationale cannot be empty'),
});

export const BusinessRelevanceSchema = z.object({
  isRelevant: z.boolean(),
  relevanceScore: z.number().min(0).max(1),
  affectedSupplyChainSegments: z.array(SupplyChainSegmentSchema),
  reasoning: z.string().min(1),
});

export const ResponseOptionRankingSchema = z.object({
  optionId: z.string().min(1),
  rank: z.number().int().positive('Rank must be a positive integer'),
  explanation: z.string().min(1),
  tradeoffs: z.string().min(1),
});

export const NemotronAnalysisResultSchema = z.object({
  eventClassification: EventClassificationSchema,
  entities: z.array(EntitySchema),
  geographies: z.array(GeographySchema),
  duration: DurationSchema.optional(),
  evidence: z
    .array(z.string().min(1))
    .min(1, 'At least one evidence quote is required')
    .max(5, 'No more than 5 evidence quotes'),
  businessRelevance: BusinessRelevanceSchema,
  responseOptionRanking: z.array(ResponseOptionRankingSchema).optional(),
});

export type EventCategory = z.infer<typeof EventCategorySchema>;
export type EntityType = z.infer<typeof EntityTypeSchema>;
export type GeographyType = z.infer<typeof GeographyTypeSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type Geography = z.infer<typeof GeographySchema>;
export type Duration = z.infer<typeof DurationSchema>;
export type BusinessRelevance = z.infer<typeof BusinessRelevanceSchema>;
export type NemotronAnalysisResult = z.infer<typeof NemotronAnalysisResultSchema>;
