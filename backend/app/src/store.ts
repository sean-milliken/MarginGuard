import type { AnalysisRecord } from "../../../shared/src/application";
export interface AnalysisStore {
  put(record: AnalysisRecord): Promise<void>;
  get(id: string): Promise<AnalysisRecord | undefined>;
}
export function memoryStore(): AnalysisStore {
  const records = new Map<string, AnalysisRecord>();
  return {
    async put(record) {
      records.set(record.analysisId, record);
      if (records.size > 100) records.delete(records.keys().next().value!);
    },
    async get(id) {
      return records.get(id);
    },
  };
}
export async function dynamoStore(tableName: string): Promise<AnalysisStore> {
  const { DynamoDBClient } = await import("@aws-sdk/client-dynamodb");
  const { DynamoDBDocumentClient, PutCommand, GetCommand } =
    await import("@aws-sdk/lib-dynamodb");
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  return {
    async put(record) {
      await client.send(new PutCommand({ TableName: tableName, Item: record }));
    },
    async get(id) {
      const result = await client.send(
        new GetCommand({ TableName: tableName, Key: { analysisId: id } }),
      );
      return result.Item as AnalysisRecord | undefined;
    },
  };
}
