import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type { RunScenarioRequest, AnalysisResult } from '../../shared/src/types';
import { randomUUID } from 'crypto';

const BASE_RESULT: AnalysisResult = {
  marginImpact: -98_500,
  riskScore: 65,
  recommendations: [
    'Scenario stress test indicates moderate margin pressure under proposed parameters.',
    'Consider diversifying collateral pool with AAA-rated fixed income instruments.',
  ],
  breakdown: [
    { category: 'Equity Positions', current: 500_000, projected: 440_000, delta: -60_000 },
    { category: 'Fixed Income',     current: 300_000, projected: 261_500, delta: -38_500 },
    { category: 'Cash Reserves',    current: 200_000, projected: 200_000, delta: 0 },
  ],
};

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const scenarioId = event.pathParameters?.id ?? 'unknown';
  const body: Partial<RunScenarioRequest> = event.body ? JSON.parse(event.body) : {};

  const stressLevel = body.parameters?.stressLevel ?? 0.5;
  const adjustedRisk = Math.min(100, Math.round(BASE_RESULT.riskScore * (1 + stressLevel * 0.3)));

  const result: AnalysisResult = { ...BASE_RESULT, riskScore: adjustedRisk };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      runId: `run-${randomUUID()}`,
      scenarioId,
      companyId: body.companyId ?? 'unknown',
      executedAt: new Date().toISOString(),
      result,
    }),
  };
};
