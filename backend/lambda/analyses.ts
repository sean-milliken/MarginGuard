import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type { CreateAnalysisRequest, Analysis, AnalysisResult } from '../../shared/src/types';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'crypto';

const dynamo = new DynamoDBClient({});
const TABLE = process.env.ANALYSES_TABLE!;

const MOCK_RESULT: AnalysisResult = {
  marginImpact: -125_000,
  riskScore: 72,
  recommendations: [
    'Reduce equity exposure in the Technology sector by 15% to lower margin requirements.',
    'Increase cash reserves to $500K to buffer potential margin calls over the next 30 days.',
    'Review positions with delta exposure > 0.8 for potential hedging opportunities.',
  ],
  breakdown: [
    { category: 'Equity Positions', current: 500_000, projected: 425_000, delta: -75_000 },
    { category: 'Fixed Income',     current: 300_000, projected: 250_000, delta: -50_000 },
    { category: 'Derivatives',      current: 150_000, projected: 150_000, delta: 0 },
    { category: 'Cash Reserves',    current: 200_000, projected: 200_000, delta: 0 },
  ],
};

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body required' }),
    };
  }

  const req: CreateAnalysisRequest = JSON.parse(event.body);
  if (!req.companyId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'companyId is required' }),
    };
  }

  const now = new Date().toISOString();
  const analysisId = `analysis-${randomUUID()}`;

  const analysis: Analysis = {
    analysisId,
    companyId: req.companyId,
    sourceIds: req.sourceIds ?? [],
    scenarioId: req.scenarioId,
    status: 'COMPLETE',
    result: MOCK_RESULT,
    createdAt: now,
    updatedAt: now,
  };

  await dynamo.send(
    new PutItemCommand({
      TableName: TABLE,
      Item: marshall(analysis, { removeUndefinedValues: true }),
    }),
  );

  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analysis),
  };
};
