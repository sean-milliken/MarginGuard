import type { EconomicObservation } from "./types";

/**
 * Cache interface for economic observations
 */
export interface EconomicDataCache {
  /**
   * Get observations for a series within date range
   */
  getObservations(
    seriesId: string,
    startDate: string,
    endDate: string,
  ): Promise<EconomicObservation[]>;

  /**
   * Put observations into cache
   */
  putObservations(observations: EconomicObservation[]): Promise<void>;

  /**
   * Get latest observation for a series
   */
  getLatest(seriesId: string): Promise<EconomicObservation | undefined>;
}

/**
 * DynamoDB cache item
 */
interface CacheItem {
  seriesId: string;
  date: string;
  value: number | null;
  cachedAt: string;
  expiresAt: number; // TTL in seconds since epoch
}

/**
 * In-memory cache implementation for testing
 */
export function memoryCache(): EconomicDataCache {
  const observations = new Map<string, EconomicObservation>();

  const makeKey = (seriesId: string, date: string) => `${seriesId}:${date}`;

  return {
    async getObservations(seriesId, startDate, endDate) {
      const results: EconomicObservation[] = [];
      for (const [key, obs] of observations.entries()) {
        if (
          obs.seriesId === seriesId &&
          obs.date >= startDate &&
          obs.date <= endDate
        ) {
          results.push(obs);
        }
      }
      return results.sort((a, b) => a.date.localeCompare(b.date));
    },

    async putObservations(obs) {
      for (const observation of obs) {
        const key = makeKey(observation.seriesId, observation.date);
        observations.set(key, observation);
      }
    },

    async getLatest(seriesId) {
      const seriesObs = Array.from(observations.values())
        .filter((obs) => obs.seriesId === seriesId && obs.value !== null)
        .sort((a, b) => b.date.localeCompare(a.date));
      return seriesObs[0];
    },
  };
}

/**
 * DynamoDB cache implementation
 */
export async function dynamoCache(tableName: string): Promise<EconomicDataCache> {
  const { DynamoDBClient } = await import("@aws-sdk/client-dynamodb");
  const { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } =
    await import("@aws-sdk/lib-dynamodb");

  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

  // 7-day TTL for cached observations
  const TTL_DAYS = 7;

  const computeTTL = (): number => {
    return Math.floor(Date.now() / 1000) + TTL_DAYS * 24 * 60 * 60;
  };

  return {
    async getObservations(seriesId, startDate, endDate) {
      try {
        const result = await client.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression:
              "seriesId = :seriesId AND #date BETWEEN :startDate AND :endDate",
            ExpressionAttributeNames: {
              "#date": "date",
            },
            ExpressionAttributeValues: {
              ":seriesId": seriesId,
              ":startDate": startDate,
              ":endDate": endDate,
            },
          }),
        );

        return (result.Items ?? []).map((item) => {
          const cacheItem = item as CacheItem;
          return {
            seriesId: cacheItem.seriesId,
            date: cacheItem.date,
            value: cacheItem.value,
            cachedAt: cacheItem.cachedAt,
          } as EconomicObservation;
        });
      } catch (error) {
        console.error("Error querying DynamoDB cache:", error);
        return [];
      }
    },

    async putObservations(observations) {
      if (observations.length === 0) return;

      try {
        const ttl = computeTTL();

        // DynamoDB BatchWrite supports max 25 items per request
        const chunks: EconomicObservation[][] = [];
        for (let i = 0; i < observations.length; i += 25) {
          chunks.push(observations.slice(i, i + 25));
        }

        for (const chunk of chunks) {
          await client.send(
            new BatchWriteCommand({
              RequestItems: {
                [tableName]: chunk.map((obs) => ({
                  PutRequest: {
                    Item: {
                      seriesId: obs.seriesId,
                      date: obs.date,
                      value: obs.value,
                      cachedAt: obs.cachedAt,
                      expiresAt: ttl,
                    } as CacheItem,
                  },
                })),
              },
            }),
          );
        }
      } catch (error) {
        console.error("Error writing to DynamoDB cache:", error);
        // Don't throw - cache failure should not break the request
      }
    },

    async getLatest(seriesId) {
      try {
        const result = await client.send(
          new QueryCommand({
            TableName: tableName,
            IndexName: "seriesId-cachedAt-index",
            KeyConditionExpression: "seriesId = :seriesId",
            ExpressionAttributeValues: {
              ":seriesId": seriesId,
            },
            ScanIndexForward: false, // Descending order
            Limit: 1,
          }),
        );

        if (result.Items && result.Items.length > 0) {
          const item = result.Items[0] as CacheItem;
          return {
            seriesId: item.seriesId,
            date: item.date,
            value: item.value,
            cachedAt: item.cachedAt,
          };
        }

        return undefined;
      } catch (error) {
        console.error("Error getting latest from DynamoDB cache:", error);
        return undefined;
      }
    },
  };
}
