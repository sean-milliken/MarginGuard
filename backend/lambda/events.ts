import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type { Event } from '../../shared/src/types';
import { DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamo = new DynamoDBClient({});
const TABLE = process.env.EVENTS_TABLE!;

const SEED_EVENTS: Event[] = [
  {
    eventId: 'evt-001',
    companyId: 'demo',
    type: 'MARGIN_CALL',
    severity: 'HIGH',
    title: 'Margin Call Triggered — Q4 Positions',
    description: 'Portfolio margin requirements exceeded threshold due to equity drawdown.',
    occurredAt: '2024-11-15T14:30:00.000Z',
    createdAt: '2024-11-15T14:30:00.000Z',
  },
  {
    eventId: 'evt-002',
    companyId: 'demo',
    type: 'EARNINGS',
    severity: 'MEDIUM',
    title: 'Q3 Earnings Beat Estimates',
    description: 'EPS of $2.45 vs $2.10 consensus.',
    occurredAt: '2024-10-25T20:00:00.000Z',
    createdAt: '2024-10-25T20:00:00.000Z',
  },
];

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const eventId = event.pathParameters?.id;

  if (eventId) {
    const result = await dynamo.send(
      new GetItemCommand({ TableName: TABLE, Key: { eventId: { S: eventId } } }),
    );
    if (!result.Item) {
      const seed = SEED_EVENTS.find((e) => e.eventId === eventId);
      if (!seed) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Event not found' }),
        };
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seed),
      };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unmarshall(result.Item)),
    };
  }

  const companyId = event.queryStringParameters?.companyId;
  if (companyId) {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: 'companyId-index',
        KeyConditionExpression: 'companyId = :cid',
        ExpressionAttributeValues: { ':cid': { S: companyId } },
      }),
    );
    const items = (result.Items ?? []).map(unmarshall);
    if (items.length === 0 && companyId === 'demo') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SEED_EVENTS),
      };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    };
  }

  const result = await dynamo.send(new ScanCommand({ TableName: TABLE, Limit: 100 }));
  const items = (result.Items ?? []).map(unmarshall);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items.length > 0 ? items : SEED_EVENTS),
  };
};
