import { calculateMetrics } from './metrics';
import type { EvalResultItem, EvalDatasetItem } from '../schemas/eval';

const makeDatasetItem = (
  id: string,
  category: EvalDatasetItem['groundTruth']['eventCategory'],
  isRelevant: boolean,
  entities: EvalDatasetItem['groundTruth']['entities'] = [],
  withContext = false,
): EvalDatasetItem => ({
  id,
  articleText: 'sample article',
  groundTruth: { eventCategory: category, isRelevant, entities, geographies: [] },
  ...(withContext
    ? {
        businessContext: {
          industry: 'Manufacturing',
          primaryCommodities: ['steel'],
          supplierRegions: ['Asia'],
        },
      }
    : {}),
});

const makeSuccessResult = (
  id: string,
  category: EvalDatasetItem['groundTruth']['eventCategory'],
  isRelevant: boolean,
  entities: Array<{ name: string; type: string }> = [],
  firstAttemptSchemaValid = true,
  retried = false,
): EvalResultItem => ({
  id,
  success: true,
  firstAttemptSchemaValid,
  retried,
  latencyMs: 100,
  classificationCorrect: true,
  predicted: {
    eventClassification: { category, confidence: 0.9, rationale: 'test' },
    entities: entities as NonNullable<EvalResultItem['predicted']>['entities'],
    geographies: [],
    evidence: ['test evidence'],
    businessRelevance: {
      isRelevant,
      relevanceScore: 0.8,
      affectedSupplyChainSegments: [],
      reasoning: 'test',
    },
  },
});

const makeFailResult = (id: string): EvalResultItem => ({
  id,
  success: false,
  firstAttemptSchemaValid: false,
  retried: true,
  latencyMs: 500,
  error: 'Validation failed',
});

describe('calculateMetrics', () => {
  it('returns perfect scores when all predictions are correct', () => {
    const dataset = [
      makeDatasetItem('a', 'LOGISTICS_DISRUPTION', true, [{ name: 'Port X', type: 'PORT' }], true),
    ];
    const results = [
      makeSuccessResult('a', 'LOGISTICS_DISRUPTION', true, [{ name: 'Port X', type: 'PORT' }]),
    ];
    const metrics = calculateMetrics(results, dataset);
    expect(metrics.classificationAccuracy).toBe(1);
    expect(metrics.relevanceAccuracy).toBe(1);
    expect(metrics.entityPrecision).toBe(1);
    expect(metrics.entityRecall).toBe(1);
    expect(metrics.entityF1).toBe(1);
    expect(metrics.structuredOutputValidityRate).toBe(1);
  });

  it('returns zero classification accuracy when all wrong', () => {
    const dataset = [makeDatasetItem('a', 'LOGISTICS_DISRUPTION', true)];
    const results: EvalResultItem[] = [
      {
        id: 'a',
        success: true,
        firstAttemptSchemaValid: true,
        retried: false,
        latencyMs: 100,
        predicted: {
          eventClassification: { category: 'IRRELEVANT', confidence: 0.5, rationale: 'test' },
          entities: [],
          geographies: [],
          evidence: ['test'],
          businessRelevance: {
            isRelevant: false,
            relevanceScore: 0.1,
            affectedSupplyChainSegments: [],
            reasoning: 'test',
          },
        },
      },
    ];
    const metrics = calculateMetrics(results, dataset);
    expect(metrics.classificationAccuracy).toBe(0);
  });

  it('correctly computes entity precision < 1 when predicted is a superset', () => {
    const gt = [{ name: 'Port X', type: 'PORT' as const }];
    const predicted = [
      { name: 'Port X', type: 'PORT' as const },
      { name: 'Extra Co', type: 'COMPANY' as const },
    ];
    const dataset = [makeDatasetItem('a', 'LOGISTICS_DISRUPTION', true, gt)];
    const results = [makeSuccessResult('a', 'LOGISTICS_DISRUPTION', true, predicted)];
    const metrics = calculateMetrics(results, dataset);
    expect(metrics.entityPrecision).toBeLessThan(1);
    expect(metrics.entityRecall).toBe(1);
  });

  it('correctly computes entity recall < 1 when predicted is a subset', () => {
    const gt = [
      { name: 'Port X', type: 'PORT' as const },
      { name: 'ILWU', type: 'ORGANIZATION' as const },
    ];
    const predicted = [{ name: 'Port X', type: 'PORT' as const }];
    const dataset = [makeDatasetItem('a', 'LOGISTICS_DISRUPTION', true, gt)];
    const results = [makeSuccessResult('a', 'LOGISTICS_DISRUPTION', true, predicted)];
    const metrics = calculateMetrics(results, dataset);
    expect(metrics.entityPrecision).toBe(1);
    expect(metrics.entityRecall).toBeLessThan(1);
  });

  it('returns precision=recall=0 when no entity metric is computed (both empty)', () => {
    const dataset = [makeDatasetItem('a', 'IRRELEVANT', false, [])];
    const results = [makeSuccessResult('a', 'IRRELEVANT', false, [])];
    const metrics = calculateMetrics(results, dataset);
    // Both sides empty: computeEntityMetrics returns {precision:1, recall:1} but
    // the outer code only enters the entity branch when gt OR predicted is non-empty.
    // With both empty, entityMetricCount stays 0 → precision/recall = 0.
    expect(metrics.entityPrecision).toBe(0);
    expect(metrics.entityRecall).toBe(0);
  });

  it('returns entityF1=0 when precision+recall=0', () => {
    const dataset = [
      makeDatasetItem('a', 'IRRELEVANT', false, [{ name: 'X', type: 'COMPANY' as const }]),
    ];
    const results = [makeSuccessResult('a', 'IRRELEVANT', false, [])];
    const metrics = calculateMetrics(results, dataset);
    expect(metrics.entityF1).toBe(0);
  });

  it('uses firstAttemptSchemaValid for structuredOutputValidityRate, not success', () => {
    const dataset = [makeDatasetItem('a', 'IRRELEVANT', false)];
    const results = [makeSuccessResult('a', 'IRRELEVANT', false, [], false, true)];
    const metrics = calculateMetrics(results, dataset);
    expect(metrics.structuredOutputValidityRate).toBe(0);
    expect(metrics.successfulInferences).toBe(1);
  });

  it('counts retried results correctly', () => {
    const dataset = [
      makeDatasetItem('a', 'IRRELEVANT', false),
      makeDatasetItem('b', 'IRRELEVANT', false),
    ];
    const results = [
      makeSuccessResult('a', 'IRRELEVANT', false, [], false, true),
      makeSuccessResult('b', 'IRRELEVANT', false, [], true, false),
    ];
    const metrics = calculateMetrics(results, dataset);
    expect(metrics.retriedCount).toBe(1);
  });

  it('handles failed inferences gracefully', () => {
    const dataset = [makeDatasetItem('a', 'LOGISTICS_DISRUPTION', true)];
    const results = [makeFailResult('a')];
    const metrics = calculateMetrics(results, dataset);
    expect(metrics.successfulInferences).toBe(0);
    expect(metrics.structuredOutputValidityRate).toBe(0);
    expect(metrics.classificationAccuracy).toBe(0);
  });
});
