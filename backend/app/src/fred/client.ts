import type {
  FredClientConfig,
  FredObservation,
  FredObservationsOptions,
  FredObservationsResponse,
  EconomicObservation,
} from "./types";

const DEFAULT_BASE_URL = "https://api.stlouisfed.org/fred";
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_MAX_RETRIES = 3;
const RETRY_DELAYS = [3000, 8000]; // 3s, 8s
const RETRYABLE_STATUS_CODES = [503, 529, 429];

/**
 * FRED API client error types
 */
export class FredClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = false,
  ) {
    super(message);
    this.name = "FredClientError";
  }
}

/**
 * FRED API client with retry, timeout, and error handling
 */
export class FredClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(config: FredClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  /**
   * Fetch observations for a FRED series
   */
  async getObservations(
    seriesId: string,
    options: FredObservationsOptions = {},
  ): Promise<EconomicObservation[]> {
    const url = this.buildObservationsUrl(seriesId, options);

    const response = await this.fetchWithRetry(url);
    const data = (await response.json()) as FredObservationsResponse;

    if (!data.observations || !Array.isArray(data.observations)) {
      throw new FredClientError("Invalid FRED API response format");
    }

    return data.observations.map((obs) => this.normalizeObservation(seriesId, obs));
  }

  /**
   * Build FRED API URL for series observations
   */
  private buildObservationsUrl(
    seriesId: string,
    options: FredObservationsOptions,
  ): string {
    const url = new URL(`${this.baseUrl}/series/observations`);
    url.searchParams.set("series_id", seriesId);
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("file_type", "json");

    if (options.startDate) {
      url.searchParams.set("observation_start", options.startDate);
    }
    if (options.endDate) {
      url.searchParams.set("observation_end", options.endDate);
    }
    if (options.limit) {
      url.searchParams.set("limit", options.limit.toString());
    }
    if (options.sortOrder) {
      url.searchParams.set("sort_order", options.sortOrder);
    }

    return url.toString();
  }

  /**
   * Normalize FRED observation to domain model
   * Handles missing observations (FRED returns "." for missing data)
   */
  private normalizeObservation(
    seriesId: string,
    obs: FredObservation,
  ): EconomicObservation {
    const value = obs.value === "." ? null : parseFloat(obs.value);
    if (value !== null && (isNaN(value) || !isFinite(value))) {
      throw new FredClientError(`Invalid observation value: ${obs.value}`);
    }

    return {
      seriesId,
      date: obs.date,
      value,
      cachedAt: new Date().toISOString(),
    };
  }

  /**
   * Fetch with retry logic for transient errors
   */
  private async fetchWithRetry(url: string, attempt = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "MarginGuard/1.0",
        },
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const isRetryable = RETRYABLE_STATUS_CODES.includes(response.status);

        if (response.status === 400) {
          const body = await response.text();
          throw new FredClientError(
            `Invalid request: ${body.slice(0, 200)}`,
            400,
            false,
          );
        }

        if (response.status === 404) {
          throw new FredClientError("FRED series not found", 404, false);
        }

        if (response.status === 401 || response.status === 403) {
          throw new FredClientError(
            "Invalid FRED API key or access denied",
            response.status,
            false,
          );
        }

        throw new FredClientError(
          `FRED API error: ${response.status} ${response.statusText}`,
          response.status,
          isRetryable,
        );
      }

      return response;
    } catch (error) {
      // Handle timeout
      if (error instanceof Error && error.name === "AbortError") {
        const timeoutError = new FredClientError(
          "FRED API request timeout",
          undefined,
          true,
        );
        return this.handleRetry(timeoutError, url, attempt);
      }

      // Handle network errors
      if (error instanceof TypeError) {
        const networkError = new FredClientError(
          "Network error connecting to FRED API",
          undefined,
          true,
        );
        return this.handleRetry(networkError, url, attempt);
      }

      // Handle FredClientError
      if (error instanceof FredClientError) {
        return this.handleRetry(error, url, attempt);
      }

      throw error;
    }
  }

  /**
   * Handle retry logic with exponential backoff
   */
  private async handleRetry(
    error: FredClientError,
    url: string,
    attempt: number,
  ): Promise<Response> {
    if (!error.isRetryable || attempt >= this.maxRetries) {
      throw error;
    }

    const delay = RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
    console.warn(`FRED API error, retrying in ${delay}ms...`, error.message);

    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.fetchWithRetry(url, attempt + 1);
  }
}

/**
 * Create FRED client from environment or config
 */
export async function createFredClient(): Promise<FredClient | null> {
  // Try to get API key from Secrets Manager
  const secretArn = process.env.FRED_SECRET_ARN;
  if (secretArn) {
    try {
      const { SecretsManagerClient, GetSecretValueCommand } = await import(
        "@aws-sdk/client-secrets-manager"
      );
      const client = new SecretsManagerClient({});
      const response = await client.send(
        new GetSecretValueCommand({ SecretId: secretArn }),
      );
      const secret = JSON.parse(response.SecretString ?? "{}") as Record<
        string,
        string
      >;
      const apiKey = secret.FRED_API_KEY;
      if (apiKey) {
        return new FredClient({ apiKey });
      }
    } catch (error) {
      console.error("Failed to load FRED API key from Secrets Manager:", error);
      return null;
    }
  }

  // Try local environment variable
  const apiKey = process.env.FRED_API_KEY;
  if (apiKey) {
    return new FredClient({ apiKey });
  }

  return null;
}
