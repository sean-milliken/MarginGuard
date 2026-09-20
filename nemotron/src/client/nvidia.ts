import OpenAI from "openai";

export const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
export const DEFAULT_NEMOTRON_MODEL = "nvidia/nemotron-3-super-120b-a12b";

export interface NvidiaClientConfig {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  maxAttempts?: number;
  /** Caps the qualitative JSON response. Interactive requests should be small enough for the API gateway window. */
  maxTokens?: number;
  /** Shared budget for initial analysis and schema correction. */
  totalTimeoutMs?: number;
}

export type ApiCallResult =
  | { success: true; content: string }
  | { success: false; error: string; code?: number };

export interface CompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function createNvidiaClient(config?: NvidiaClientConfig): OpenAI {
  const apiKey = config?.apiKey ?? process.env["NVIDIA_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "NVIDIA_API_KEY is not set. Provide it via environment variable or NvidiaClientConfig.apiKey.",
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: NVIDIA_BASE_URL,
    maxRetries: 0,
    timeout: config?.timeoutMs ?? 60_000,
  });
}

export function resolveModelId(config?: NvidiaClientConfig): string {
  return (
    config?.model ??
    process.env["NVIDIA_NEMOTRON_MODEL"] ??
    DEFAULT_NEMOTRON_MODEL
  );
}

const RETRYABLE_STATUS_CODES = new Set([503, 529, 429]);
const RETRY_DELAYS_MS = [3000, 8000];

export async function callNvidiaApi(
  client: OpenAI,
  modelId: string,
  messages: CompletionMessage[],
  maxAttempts = 3,
  deadlineMs?: number,
  maxTokens = 4096,
): Promise<ApiCallResult> {
  let lastError: ApiCallResult | null = null;
  const expired = (): ApiCallResult => ({
    success: false,
    error: "AI analysis timed out. Please retry.",
  });

  for (
    let attempt = 0;
    attempt < Math.max(1, Math.min(maxAttempts, 3));
    attempt++
  ) {
    if (deadlineMs !== undefined && Date.now() >= deadlineMs) return expired();
    if (attempt > 0) {
      if (
        deadlineMs !== undefined &&
        Date.now() + RETRY_DELAYS_MS[attempt - 1]! >= deadlineMs
      )
        return expired();
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]),
      );
    }

    try {
      const remaining =
        deadlineMs === undefined ? undefined : deadlineMs - Date.now();
      if (remaining !== undefined && remaining <= 0) return expired();
      const response = await client.chat.completions.create(
        {
          model: modelId,
          messages,
          temperature: 0.1,
          max_tokens: maxTokens,
        },
        remaining === undefined
          ? undefined
          : { timeout: Math.min(client.timeout, remaining) },
      );

      const content = response.choices[0]?.message?.content;
      if (content == null || content.trim() === "") {
        return { success: false, error: "API returned an empty response body" };
      }
      return { success: true, content: content.trim() };
    } catch (err) {
      if (err instanceof OpenAI.APIError) {
        lastError = {
          success: false,
          error: `NVIDIA API error ${err.status}: ${err.message}`,
          code: err.status ?? undefined,
        };
        if (err.status != null && RETRYABLE_STATUS_CODES.has(err.status)) {
          continue;
        }
        return lastError;
      }
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Unknown error calling NVIDIA API",
      };
    }
  }

  return (
    lastError ?? { success: false, error: "Unknown error calling NVIDIA API" }
  );
}
