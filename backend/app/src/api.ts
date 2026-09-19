import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import {
  createSnapshot,
  InvalidInputError,
  classifyArticle,
  scenarios,
  type Analyzer,
} from "./service";
import { memoryStore, type AnalysisStore } from "./store";
export interface ApiRequest {
  method: string;
  path: string;
  body?: string;
}
export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}
export function createApi(
  options: {
    store?: AnalysisStore;
    analyzer?: Analyzer;
    intelligenceAvailable?: boolean;
  } = {},
) {
  const store = options.store ?? memoryStore();
  const reply = (statusCode: number, data: unknown): ApiResponse => ({
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(data),
  });
  return async ({ method, path, body }: ApiRequest): Promise<ApiResponse> => {
    const route = path.replace(/^\/api(?=\/)/, "");
    try {
      if (method === "GET" && route === "/health")
        return reply(200, {
          status: "ok",
          financialEngine: "deterministic",
          intelligenceAvailable:
            options.intelligenceAvailable ??
            Boolean(process.env.NVIDIA_API_KEY),
        });
      if (method === "GET" && route === "/dashboard")
        return reply(200, createSnapshot());
      if (method === "GET" && route === "/scenarios")
        return reply(200, scenarios);
      if (method === "GET" && route === "/companies/steel-city-beverages")
        return reply(200, createSnapshot().company);
      if (method === "GET" && route === "/events")
        return reply(
          200,
          scenarios.map((s) => s.event),
        );
      if (method === "GET" && route.startsWith("/events/")) {
        const event = scenarios
          .map((s) => s.event)
          .find((e) => e.id === route.slice("/events/".length));
        return event
          ? reply(200, event)
          : reply(404, { error: "Event not found" });
      }
      if (method === "GET" && route === "/sources")
        return reply(200, [createSnapshot().source]);
      if (method === "GET" && route.startsWith("/analyses/")) {
        const record = await store.get(route.slice("/analyses/".length));
        return record
          ? reply(200, record)
          : reply(404, { error: "Analysis not found" });
      }
      if (
        method !== "POST" ||
        (!["/analyses", "/intelligence"].includes(route) &&
          !/^\/scenarios\/[^/]+\/run$/.test(route))
      )
        return reply(404, { error: "Route not found" });
      if (!body || Buffer.byteLength(body) > 200000)
        return reply(400, { error: "Provide a JSON body of at most 200KB" });
      let input: unknown;
      try {
        input = JSON.parse(body);
      } catch {
        return reply(400, { error: "Invalid JSON" });
      }
      if (route === "/intelligence") {
        if (!(
          options.intelligenceAvailable ?? Boolean(process.env.NVIDIA_API_KEY)
        ))
          return reply(503, {
            error:
              "Nemotron is not configured. Set NVIDIA_API_KEY on the server; financial analysis remains available.",
          });
        const outcome = await classifyArticle(input, options.analyzer);
        return reply(outcome.success ? 200 : 502, outcome);
      }
      const match = route.match(/^\/scenarios\/([^/]+)\/run$/);
      if (match) {
        if (input === null || typeof input !== "object" || Array.isArray(input))
          return reply(400, { error: "Request must be an object" });
        input = { ...input, scenarioId: decodeURIComponent(match[1]!) };
      }
      let snapshot;
      try {
        snapshot = createSnapshot(input);
      } catch (error) {
        if (error instanceof ZodError) throw error;
        return reply(400, {
          error:
            error instanceof Error ? error.message : "Invalid financial inputs",
        });
      }
      const record = {
        analysisId: `analysis-${randomUUID()}`,
        companyId: snapshot.company.id,
        createdAt: new Date().toISOString(),
        snapshot,
      };
      if (Buffer.byteLength(JSON.stringify(record)) > 350000)
        return reply(413, {
          error: "Analysis is too large to persist. Reduce the company model.",
        });
      await store.put(record);
      return reply(201, record);
    } catch (error) {
      if (error instanceof InvalidInputError)
        return reply(400, { error: error.message });
      if (error instanceof ZodError)
        return reply(400, {
          error: "Invalid request",
          details: error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`,
          ),
        });
      console.error(
        "Application request failed:",
        error instanceof Error ? error.name : "UnknownError",
      );
      return reply(500, { error: "Unable to complete request. Please retry." });
    }
  };
}
