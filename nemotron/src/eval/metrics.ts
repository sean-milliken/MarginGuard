import type { EvalResultItem, EvalMetrics, EvalDatasetItem } from '../schemas/eval';
import type { Entity } from '../schemas/analysis';
import { EventCategorySchema } from '../schemas/analysis';

function normalizeEntityKey(e: Entity): string {
  return `${e.type}:${e.name.toLowerCase().trim()}`;
}

function computeEntityMetrics(
  predicted: Entity[],
  groundTruth: Entity[],
): { precision: number; recall: number } {
  if (groundTruth.length === 0 && predicted.length === 0) {
    return { precision: 1, recall: 1 };
  }
  if (groundTruth.length === 0) {
    return { precision: 0, recall: 1 };
  }
  if (predicted.length === 0) {
    return { precision: 1, recall: 0 };
  }

  const gtKeys = new Set(groundTruth.map(normalizeEntityKey));
  const predKeys = new Set(predicted.map(normalizeEntityKey));
  const truePositives = [...predKeys].filter((k) => gtKeys.has(k)).length;

  return {
    precision: truePositives / predKeys.size,
    recall: truePositives / gtKeys.size,
  };
}

export function calculateMetrics(
  results: EvalResultItem[],
  dataset: EvalDatasetItem[],
): EvalMetrics {
  const total = results.length;
  const datasetById = new Map(dataset.map((d) => [d.id, d]));
  const categories = EventCategorySchema.options;

  let classificationCorrect = 0;
  let relevanceCorrect = 0;
  let relevanceTotal = 0;
  let entityPrecisionSum = 0;
  let entityRecallSum = 0;
  let entityMetricCount = 0;
  let firstAttemptValidCount = 0;

  const categoryStats: Record<string, { total: number; correct: number }> = {};
  for (const cat of categories) {
    categoryStats[cat] = { total: 0, correct: 0 };
  }

  for (const result of results) {
    const item = datasetById.get(result.id);
    if (!item) continue;

    if (result.firstAttemptSchemaValid) firstAttemptValidCount++;

    if (!result.success || !result.predicted) continue;

    const predicted = result.predicted;
    const gt = item.groundTruth;

    const predCategory = predicted.eventClassification.category;
    const gtCategory = gt.eventCategory;
    const catStats = categoryStats[gtCategory];
    if (catStats) {
      catStats.total++;
      if (predCategory === gtCategory) {
        classificationCorrect++;
        catStats.correct++;
      }
    }

    if (item.businessContext !== undefined) {
      relevanceTotal++;
      if (predicted.businessRelevance.isRelevant === gt.isRelevant) {
        relevanceCorrect++;
      }
    }

    if (gt.entities.length > 0 || predicted.entities.length > 0) {
      const em = computeEntityMetrics(predicted.entities, gt.entities);
      entityPrecisionSum += em.precision;
      entityRecallSum += em.recall;
      entityMetricCount++;
    }
  }

  const successfulInferences = results.filter((r) => r.success).length;
  const retriedCount = results.filter((r) => r.retried).length;

  const classificationAccuracy = total > 0 ? classificationCorrect / total : 0;
  const relevanceAccuracy = relevanceTotal > 0 ? relevanceCorrect / relevanceTotal : 0;
  const entityPrecision = entityMetricCount > 0 ? entityPrecisionSum / entityMetricCount : 0;
  const entityRecall = entityMetricCount > 0 ? entityRecallSum / entityMetricCount : 0;
  const entityF1 =
    entityPrecision + entityRecall > 0
      ? (2 * entityPrecision * entityRecall) / (entityPrecision + entityRecall)
      : 0;
  const structuredOutputValidityRate = total > 0 ? firstAttemptValidCount / total : 0;

  const classificationByCategory = Object.fromEntries(
    categories.map((cat) => {
      const stats = categoryStats[cat] ?? { total: 0, correct: 0 };
      return [
        cat,
        {
          total: stats.total,
          correct: stats.correct,
          accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
        },
      ];
    }),
  ) as EvalMetrics['classificationByCategory'];

  return {
    classificationAccuracy,
    relevanceAccuracy,
    entityPrecision,
    entityRecall,
    entityF1,
    structuredOutputValidityRate,
    totalExamples: total,
    successfulInferences,
    retriedCount,
    classificationByCategory,
  };
}
