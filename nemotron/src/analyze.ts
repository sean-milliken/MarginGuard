import {
  NemotronAnalysisResultSchema,
  type NemotronAnalysisResult,
} from "./schemas/analysis";
import {
  createNvidiaClient,
  resolveModelId,
  callNvidiaApi,
  type NvidiaClientConfig,
} from "./client/nvidia";
import {
  buildMessages,
  buildCorrectionMessages,
  type PromptInput,
  type ResponseOption,
} from "./client/prompts";
import type { BusinessContext } from "./schemas/eval";

export type {
  PromptInput,
  ResponseOption,
  NvidiaClientConfig,
  BusinessContext,
};

export interface AnalysisInput {
  articleText: string;
  businessContext?: BusinessContext;
  responseOptions?: ResponseOption[];
}

export type AnalysisErrorType =
  "API_ERROR" | "VALIDATION_ERROR" | "PARSE_ERROR";

export interface AnalysisError {
  type: AnalysisErrorType;
  message: string;
  validationErrors?: string[];
}

export type AnalysisOutcome =
  | {
      success: true;
      result: NemotronAnalysisResult;
      retried: boolean;
      firstAttemptSchemaValid: boolean;
    }
  | {
      success: false;
      error: AnalysisError;
      retried: boolean;
      firstAttemptSchemaValid: boolean;
    };

type ParseResult =
  | { success: true; result: NemotronAnalysisResult }
  | { success: false; errors: string[] };

// Geography type values the model sometimes misplaces into entities.type
const GEOGRAPHY_TYPES = new Set(["COUNTRY", "REGION", "CITY"]);

function extractJson(raw: string): string {
  // Strip markdown fences
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  // If direct parse fails, try to extract the outermost {...} block
  if (!cleaned.startsWith("{")) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      cleaned = cleaned.slice(start, end + 1);
    }
  }
  return cleaned;
}

function normalizeEntities(parsed: Record<string, unknown>): void {
  // The model sometimes puts COUNTRY/REGION/CITY in entities.type instead of geographies.
  // Move those entries to geographies and remove them from entities.
  const entities = parsed["entities"];
  const geographies = parsed["geographies"];
  if (!Array.isArray(entities) || !Array.isArray(geographies)) return;

  const misplaced: Array<{ name: string; type: string }> = [];
  const validEntities: unknown[] = [];

  for (const e of entities) {
    if (
      e != null &&
      typeof e === "object" &&
      typeof (e as Record<string, unknown>)["type"] === "string" &&
      GEOGRAPHY_TYPES.has((e as Record<string, unknown>)["type"] as string)
    ) {
      misplaced.push({
        name: String((e as Record<string, unknown>)["name"] ?? ""),
        type: String((e as Record<string, unknown>)["type"]),
      });
    } else {
      validEntities.push(e);
    }
  }

  if (misplaced.length === 0) return;

  parsed["entities"] = validEntities;
  const existingGeoNames = new Set(
    geographies
      .filter((g) => g != null && typeof g === "object")
      .map((g) =>
        String((g as Record<string, unknown>)["name"] ?? "").toLowerCase(),
      ),
  );
  for (const m of misplaced) {
    if (!existingGeoNames.has(m.name.toLowerCase())) {
      geographies.push({ name: m.name, type: m.type });
      existingGeoNames.add(m.name.toLowerCase());
    }
  }
}

function parseAndValidate(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    return { success: false, errors: ["Response is not valid JSON"] };
  }

  if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
    normalizeEntities(parsed as Record<string, unknown>);
  }

  const result = NemotronAnalysisResultSchema.safeParse(parsed);
  if (result.success) {
    return { success: true, result: result.data };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`,
  );
  return { success: false, errors };
}

export async function analyzeArticle(
  input: AnalysisInput,
  config?: NvidiaClientConfig,
): Promise<AnalysisOutcome> {
  const deadlineMs =
    config?.totalTimeoutMs === undefined
      ? undefined
      : Date.now() + config.totalTimeoutMs;
  const client = createNvidiaClient(config);
  const modelId = resolveModelId(config);
  const promptInput: PromptInput = input;

  const messages = buildMessages(promptInput);
  const attempt1 = await callNvidiaApi(
    client,
    modelId,
    messages,
    config?.maxAttempts,
    deadlineMs,
  );

  if (!attempt1.success) {
    return {
      success: false,
      error: { type: "API_ERROR", message: attempt1.error },
      retried: false,
      firstAttemptSchemaValid: false,
    };
  }

  const parse1 = parseAndValidate(attempt1.content);
  if (parse1.success) {
    return {
      success: true,
      result: parse1.result,
      retried: false,
      firstAttemptSchemaValid: true,
    };
  }

  const correctionMessages = buildCorrectionMessages(
    messages,
    attempt1.content,
    parse1.errors,
  );
  const attempt2 = await callNvidiaApi(
    client,
    modelId,
    correctionMessages,
    config?.maxAttempts,
    deadlineMs,
  );

  if (!attempt2.success) {
    return {
      success: false,
      error: { type: "API_ERROR", message: attempt2.error },
      retried: true,
      firstAttemptSchemaValid: false,
    };
  }

  const parse2 = parseAndValidate(attempt2.content);
  if (parse2.success) {
    return {
      success: true,
      result: parse2.result,
      retried: true,
      firstAttemptSchemaValid: false,
    };
  }

  return {
    success: false,
    error: {
      type: "VALIDATION_ERROR",
      message: "Schema validation failed after correction retry",
      validationErrors: parse2.errors,
    },
    retried: true,
    firstAttemptSchemaValid: false,
  };
}
