import test from "node:test";
import assert from "node:assert/strict";
import {
  stressTest,
  decisionBoundaries,
  recommendedResponse,
} from "../src/sensitivity.ts";
import { analyzeDisruption } from "../src/index.ts";
import {
  steelCityBeverages as company,
  logisticsDisruption as event,
} from "../src/steel-city-beverages.ts";
const inputs = {
  disruptionDays: 15,
  supplierId: "allegheny",
  dependencyBps: 8000,
  premiumBps: 2500,
  responseCostCents: 0,
};
test("what-if uses existing formulas, preserves inputs and recalculates duration and dependency", () => {
  const before = JSON.stringify(company);
  assert.deepEqual(
    stressTest(company, event, inputs),
    analyzeDisruption(company, event),
  );
  assert.equal(
    stressTest(company, event, { ...inputs, disruptionDays: 30 }).affectedUnits,
    80000,
  );
  assert.equal(
    stressTest(company, event, { ...inputs, dependencyBps: 4000 })
      .affectedUnits,
    20000,
  );
  assert.equal(JSON.stringify(company), before);
});
test("response costs cross recommendation boundary and traced values reconcile", () => {
  const initial = stressTest(company, event, inputs);
  const best = recommendedResponse(initial);
  assert.notEqual(best.id, "do-nothing");
  const boundary = decisionBoundaries(company, event, inputs).find(
    (b) => b.parameter === "responseCostCents",
  );
  assert.ok(boundary.upper > 0);
  assert.equal(
    recommendedResponse(
      stressTest(company, event, {
        ...inputs,
        responseCostCents: boundary.upper,
      }),
    ).id,
    "do-nothing",
  );
  assert.equal(
    recommendedResponse(
      stressTest(company, event, {
        ...inputs,
        responseCostCents: boundary.lower,
      }),
    ).id,
    best.id,
  );
  assert.equal(
    best.netFinancialBenefitCents,
    best.avoidedContributionMarginLossCents - best.incrementalCostCents,
  );
  assert.equal(
    initial.calculationSteps.find(
      (s) => s.formula === "Sum product contribution at risk",
    ).result,
    initial.contributionMarginAtRiskCents,
  );
});
test("bounded search reports no change honestly and invalid assumptions fail", () => {
  assert.equal(
    decisionBoundaries(company, event, inputs).find(
      (b) => b.parameter === "premiumBps",
    ).lower,
    null,
  );
  assert.throws(() =>
    stressTest(company, event, { ...inputs, dependencyBps: 10001 }),
  );
  assert.throws(() =>
    stressTest(company, event, {
      ...inputs,
      supplierId: "keystone",
      dependencyBps: 5000,
    }),
  );
});
test("premium and fixed charges are traced with integer-cent rounding", () => {
  const report = stressTest(company, event, {
    ...inputs,
    premiumBps: 1000,
    responseCostCents: 12345,
  });
  const response = report.responseOptions[1];
  assert.equal(response.premiumCents, 432000);
  assert.equal(response.expeditedShippingCents, 882345);
  assert.equal(response.incrementalCostCents, 1314345);
  assert.equal(
    response.netFinancialBenefitCents,
    response.avoidedContributionMarginLossCents - 1314345,
  );
});
test("irrelevant input yields zero exposure and cannot smuggle a supplier disruption", () => {
  const irrelevant = {
    ...event,
    type: "irrelevant",
    supplierIds: [],
    disruptionDays: 0,
    unavailableBps: 0,
  };
  const report = analyzeDisruption(company, irrelevant);
  assert.equal(report.affectedUnits, 0);
  assert.equal(report.revenueAtRiskCents, 0);
  assert.equal(report.contributionMarginAtRiskCents, 0);
  assert.deepEqual(report.affectedSuppliers, []);
  assert.deepEqual(report.affectedComponents, []);
  assert.deepEqual(report.affectedProducts, []);
  assert.equal(recommendedResponse(report).id, "do-nothing");
  assert.throws(() =>
    analyzeDisruption(company, { ...irrelevant, supplierIds: ["allegheny"] }),
  );
});
