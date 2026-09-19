import type { EvaluationMetrics } from '../types/mock';

export const evaluationMetrics: EvaluationMetrics = {
  eventClassification: {
    accuracy: 0.93, // 93%
    baseline: 0.63, // 63% keyword-based baseline
    testCases: 150
  },

  entityExtraction: {
    precision: 0.91, // 91%
    recall: 0.89, // 89%
    f1Score: 0.9 // 90%
  },

  structuredOutput: {
    validJsonPercentage: 1.0, // 100%
    totalSamples: 150
  },

  categoryBreakdown: [
    {
      category: 'Logistics Disruptions',
      accuracy: 0.95, // 95%
      samples: 45
    },
    {
      category: 'Supplier Disruptions',
      accuracy: 0.88, // 88%
      samples: 38
    },
    {
      category: 'Input Cost Increases',
      accuracy: 0.91, // 91%
      samples: 42
    },
    {
      category: 'Irrelevant Events',
      accuracy: 0.97, // 97%
      samples: 25
    }
  ]
};

// Helper to get overall performance summary
export const getPerformanceSummary = () => {
  const avgCategoryAccuracy =
    evaluationMetrics.categoryBreakdown.reduce((sum, cat) => sum + cat.accuracy, 0) /
    evaluationMetrics.categoryBreakdown.length;

  return {
    overallClassificationAccuracy: evaluationMetrics.eventClassification.accuracy,
    baselineImprovement:
      evaluationMetrics.eventClassification.accuracy -
      evaluationMetrics.eventClassification.baseline,
    avgEntityExtractionScore:
      (evaluationMetrics.entityExtraction.precision +
        evaluationMetrics.entityExtraction.recall) /
      2,
    structuredOutputReliability: evaluationMetrics.structuredOutput.validJsonPercentage,
    avgCategoryAccuracy
  };
};
