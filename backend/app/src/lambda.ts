import { createApi } from "./api";
import { dynamoStore } from "./store";
const api = (async () => {
  if (process.env.NVIDIA_SECRET_ARN) {
    try {
      const { SecretsManagerClient, GetSecretValueCommand } =
        await import("@aws-sdk/client-secrets-manager");
      const client = new SecretsManagerClient({});
      const secret = await client.send(
        new GetSecretValueCommand({ SecretId: process.env.NVIDIA_SECRET_ARN }),
      );
      const text = secret.SecretString ?? "";
      const key = text.startsWith("{") ? JSON.parse(text).NVIDIA_API_KEY : text;
      if (typeof key === "string" && key.trim())
        process.env.NVIDIA_API_KEY = key;
    } catch {
      console.error(
        "NVIDIA secret unavailable; deterministic analysis remains enabled.",
      );
    }
  }
  return createApi({ store: await dynamoStore(process.env.ANALYSES_TABLE!) });
})();
export async function handler(event: {
  requestContext: { http: { method: string } };
  rawPath: string;
  body?: string;
  isBase64Encoded?: boolean;
}) {
  return (await api)({
    method: event.requestContext.http.method,
    path: event.rawPath,
    body:
      event.isBase64Encoded && event.body
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body,
  });
}
