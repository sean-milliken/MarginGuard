import test from "node:test";
import assert from "node:assert/strict";
import { createApi } from "../src/api";
import { createSnapshot } from "../src/service";
import type { AnalysisOutcome } from "../../../nemotron/src/analyze";
const payload = (value: unknown) => JSON.stringify(value);
test("dashboard and scenario routes use the real financial engine", async () => {
  const api = createApi();
  const initial = await api({ method: "GET", path: "/api/dashboard" });
  assert.equal(initial.statusCode, 200);
  assert.equal(
    JSON.parse(initial.body).report.contributionMarginAtRiskCents,
    27600000,
  );
  const run = await api({
    method: "POST",
    path: "/api/scenarios/logistics-7-days/run",
    body: "{}",
  });
  assert.equal(run.statusCode, 201);
  const record = JSON.parse(run.body);
  assert.equal(record.snapshot.event.disruptionDays, 7);
  assert.equal(record.snapshot.report.affectedUnits, 18668);
  const saved = await api({
    method: "GET",
    path: `/api/analyses/${record.analysisId}`,
  });
  assert.deepEqual(JSON.parse(saved.body), record);
});
test("custom explicit event inputs change financial results", async () => {
  const snapshot = createSnapshot();
  const api = createApi();
  const response = await api({
    method: "POST",
    path: "/analyses",
    body: payload({ event: { ...snapshot.event, disruptionDays: 0 } }),
  });
  assert.equal(response.statusCode, 201);
  assert.equal(JSON.parse(response.body).snapshot.report.revenueAtRiskCents, 0);
});
test("malformed inputs and unknown references have useful client errors", async () => {
  const api = createApi();
  for (const body of [
    "{",
    "null",
    "[]",
    payload({ scenarioId: "missing" }),
    payload({ event: { disruptionDays: 2 } }),
    payload({ company: { name: "missing fields" } }),
    payload({ financialResult: 123 }),
  ]) {
    assert.equal(
      (await api({ method: "POST", path: "/analyses", body })).statusCode,
      400,
      body,
    );
  }
  assert.equal(
    (await api({ method: "GET", path: "/missing" })).statusCode,
    404,
  );
  assert.equal(
    (await api({ method: "GET", path: "/analyses/missing" })).statusCode,
    404,
  );
});
test("missing NVIDIA configuration returns explicit unavailable response", async () => {
  const api = createApi({ intelligenceAvailable: false });
  const r = await api({
    method: "POST",
    path: "/intelligence",
    body: payload({
      articleText: "The freight terminal is closed for 15 days.",
    }),
  });
  assert.equal(r.statusCode, 503);
});
const text = "The freight terminal is closed for 15 days.";
const outcome: AnalysisOutcome = {
  success: true,
  retried: false,
  firstAttemptSchemaValid: true,
  result: {
    eventClassification: {
      category: "LOGISTICS_DISRUPTION",
      confidence: 0.99,
      rationale: "Freight terminal closure.",
    },
    entities: [],
    geographies: [],
    evidence: [text],
    businessRelevance: {
      isRelevant: true,
      relevanceScore: 1,
      affectedSupplyChainSegments: ["INBOUND_LOGISTICS"],
      reasoning: "Delivery interruption.",
    },
  },
};
test("Nemotron adapter receives qualitative options; its output cannot modify finances", async () => {
  const before = createSnapshot().report;
  const api = createApi({
    intelligenceAvailable: true,
    analyzer: async (input) => {
      assert.equal(input.articleText, text);
      assert.ok(input.responseOptions?.some((o) => o.id === "do-nothing"));
      assert.equal("revenueAtRiskCents" in input, false);
      return outcome;
    },
  });
  const result = await api({
    method: "POST",
    path: "/intelligence",
    body: payload({ articleText: text }),
  });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(createSnapshot().report, before);
});
test("hallucinated evidence and invalid option rankings are rejected", async () => {
  for (const patch of [
    { evidence: ["Invented evidence"] },
    {
      responseOptionRanking: [
        {
          optionId: "invented",
          rank: 1,
          explanation: "Fake",
          tradeoffs: "Fake",
        },
      ],
    },
  ]) {
    const api = createApi({
      intelligenceAvailable: true,
      analyzer: async () => ({
        ...outcome,
        result: { ...outcome.result, ...patch },
      }),
    });
    assert.equal(
      (
        await api({
          method: "POST",
          path: "/intelligence",
          body: payload({ articleText: text }),
        })
      ).statusCode,
      502,
    );
  }
});
test("persistence failure does not report successful analysis", async () => {
  const api = createApi({
    store: {
      async put() {
        throw new Error("storage unavailable");
      },
      async get() {
        return undefined;
      },
    },
  });
  assert.equal(
    (await api({ method: "POST", path: "/analyses", body: "{}" })).statusCode,
    500,
  );
});
