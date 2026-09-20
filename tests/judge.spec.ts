import { test, expect } from "@playwright/test";
import { EVAL_DATASET } from "../nemotron/src/eval/dataset";
import { calculateMetrics } from "../nemotron/src/eval/metrics";
import type { EvalResultItem } from "../nemotron/src/schemas/eval";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/eval-results", (route) =>
    route.fulfill({ status: 404, json: { error: "No local run" } }),
  );
  await page.route("**/api/fred/signals", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Optional feed unavailable" },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: /Try the demo/ }).click();
});

test("judge demo, what-if boundaries, calculations and repeat runs use actual finance", async ({
  page,
}) => {
  const errors: string[] = [];
  let modelCalls = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("/intelligence")) modelCalls++;
  });
  await page.getByRole("button", { name: "Run Judge Demo" }).click();
  await expect(page).toHaveURL(/\/analysis$/);
  await expect(page.getByTestId("margin-exposure")).toHaveText("$276,000.00");
  await page.getByRole("slider", { name: "Disruption duration" }).fill("30");
  await expect(
    page.getByRole("slider", { name: "Alternate supplier premium" }),
  ).toHaveValue("2500");
  await expect(page.getByTestId("margin-exposure")).toHaveText("$552,000.00");
  await page.getByRole("slider", { name: "Supplier dependency" }).fill("4000");
  await expect(page.getByTestId("margin-exposure")).toHaveText("$276,000.00");
  await page
    .getByText("What would change our recommendation?", { exact: true })
    .click();
  await expect(page.getByTestId("financial-decision")).toContainText(
    "Change between",
  );
  await page
    .getByRole("slider", { name: "Additional response cost" })
    .fill("27600000");
  await expect(page.getByTestId("recommended-action")).toHaveText(
    "Take no action",
  );
  await page
    .getByText("How was this calculated?", { exact: true })
    .first()
    .click();
  await expect(page.getByTestId("financial-decision")).toContainText(
    "Sum product contribution at risk",
  );
  await page.getByText("Source Evidence", { exact: true }).click();
  await expect(page.getByTestId("financial-decision")).toContainText(
    "supplied scenario inputs",
  );
  await page.getByRole("button", { name: "Run Judge Demo" }).click();
  await expect(
    page.getByRole("slider", { name: "Disruption duration" }),
  ).toHaveValue("15");
  await expect(
    page.getByRole("slider", { name: "Additional response cost" }),
  ).toHaveValue("0");
  await expect(page.getByTestId("recommended-action")).not.toHaveText(
    "Take no action",
  );
  expect(modelCalls).toBe(0);
  expect(errors).toEqual([]);
});

test("judge analysis remains usable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Run Judge Demo" }).click();
  await expect(page).toHaveURL(/\/analysis$/);
  await expect(page.getByTestId("margin-exposure")).toHaveText("$276,000.00");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});

test("irrelevant event is a successful no-exposure result", async ({
  page,
}) => {
  await page.getByLabel("Scenario").selectOption("irrelevant-leadership");
  await page.getByRole("button", { name: /Model Impact/ }).click();
  await expect(page.getByTestId("margin-exposure")).toHaveText(
    "No material exposure detected",
  );
  await expect(page.getByTestId("affected-cases")).toHaveText("0");
  await expect(page.getByTestId("recommended-action")).toHaveText(
    "Take no action",
  );
  await expect(page.getByTestId("net-benefit")).toHaveText("$0.00 net benefit");
});

test("judge demo reports persistence failure and can retry without fabricated success", async ({
  page,
}) => {
  await page.route("**/api/analyses", (route) =>
    route.fulfill({ status: 500, json: { error: "Persistence unavailable" } }),
  );
  await page.getByRole("button", { name: "Run Judge Demo" }).click();
  await expect(page.getByText(/Demo could not complete/)).toBeVisible();
  await expect(page).not.toHaveURL(/\/analysis$/);
  await page.unroute("**/api/analyses");
  await page.getByRole("button", { name: "Run Judge Demo" }).click();
  await expect(page).toHaveURL(/\/analysis$/);
});

test("eval view distinguishes dataset counts from measured results and rejects invalid files", async ({
  page,
}) => {
  await page.getByRole("button", { name: /AI Accuracy/ }).click();
  await expect(
    page.getByText(/labeled examples in the evaluation dataset/),
  ).toBeVisible();
  await expect(page.getByText(/No measured run loaded/)).toBeVisible();
  await page.getByLabel("Load evaluation results").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"accuracy":1}'),
  });
  await expect(page.getByRole("alert")).toContainText("Could not load results");
});

test("evaluation viewer computes recorded errors instead of trusting supplied percentage claims", async ({
  page,
}) => {
  await page.getByRole("button", { name: /AI Accuracy/ }).click();
  const item = EVAL_DATASET[0]!;
  const results: EvalResultItem[] = [
    {
      id: item.id,
      success: true,
      firstAttemptSchemaValid: true,
      retried: false,
      latencyMs: 1,
      predicted: {
        eventClassification: {
          category: "IRRELEVANT",
          confidence: 0.5,
          rationale: "Deliberately incorrect test prediction",
        },
        entities: [],
        geographies: [],
        evidence: [item.articleText.slice(0, 40)],
        businessRelevance: {
          isRelevant: false,
          relevanceScore: 0,
          affectedSupplyChainSegments: [],
          reasoning: "Test fixture only",
        },
      },
    },
  ];
  const file = {
    runTimestamp: new Date().toISOString(),
    modelId: "test-fixture-not-a-live-evaluation",
    metrics: {
      ...calculateMetrics(results, EVAL_DATASET),
      classificationAccuracy: 1,
    },
    results,
  };
  await page.getByLabel("Load evaluation results").setInputFiles({
    name: "test-run.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(file)),
  });
  await expect(
    page.getByText("Inspect Errors (1)", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Deliberately incorrect test prediction", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Classification accuracy", { exact: true }).locator(".."),
  ).toContainText("0.0%");
});
