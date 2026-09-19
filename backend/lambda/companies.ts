import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type { Company } from '../../shared/src/types';

const DEMO_COMPANY: Company = {
  companyId: 'demo',
  name: 'Acme Capital Management',
  ticker: 'ACME',
  sector: 'Asset Management',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const companyId = event.pathParameters?.companyId;
  if (companyId !== 'demo') {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Company not found' }),
    };
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(DEMO_COMPANY),
  };
};
