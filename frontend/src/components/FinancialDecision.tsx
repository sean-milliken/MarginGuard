import { useMemo, useState } from "react";
import { useData } from "../contexts/DataContext";
import {
  stressTest,
  decisionBoundaries,
  recommendedResponse,
  type StressInputs,
} from "../../../backend/financial-engine/src/sensitivity";
import type { CalculationStep } from "../../../backend/financial-engine/src/types";

export function Provenance({
  kind,
}: {
  kind: "SOURCE FACT" | "AI INFERENCE" | "DETERMINISTIC CALCULATION";
}) {
  return (
    <span
      className={`provenance provenance-${kind.split(" ")[0].toLowerCase()}`}
    >
      {kind === "DETERMINISTIC CALCULATION"
        ? "Calculated"
        : kind === "AI INFERENCE"
          ? "AI inference"
          : "Source evidence"}
    </span>
  );
}
function Calculations({
  steps,
  money,
}: {
  steps: CalculationStep[];
  money: (cents: number) => string;
}) {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-primary-300">
        How was this calculated?
      </summary>
      <ol className="calculation-list">
        {steps.map((step, i) => (
          <li key={i}>
            <code>{step.formula}</code>
            <strong>
              {step.unit === "cents"
                ? money(step.result)
                : `${step.result.toLocaleString()} ${step.unit}`}
            </strong>
          </li>
        ))}
      </ol>
    </details>
  );
}
export function FinancialDecision() {
  const { snapshot, intelligence, intelligenceSource } = useData();
  const { company, event } = snapshot;
  const target = event.supplierIds[0] ?? company.suppliers[0].id;
  const dependency = company.components.find((c) =>
    c.sources.some((s) => s.supplierId === target),
  );
  const initial: StressInputs = {
    supplierId: target,
    disruptionDays: event.disruptionDays,
    dependencyBps:
      dependency?.sources.find((s) => s.supplierId === target)?.dependencyBps ??
      10000,
    premiumBps: dependency?.alternatives[0]?.premiumBps ?? 0,
    responseCostCents: 0,
  };
  const [inputs, setInputs] = useState(initial);
  const irrelevant = event.type === "irrelevant";
  const report = useMemo(
    () => (irrelevant ? snapshot.report : stressTest(company, event, inputs)),
    [company, event, inputs, irrelevant, snapshot.report],
  );
  const boundaries = useMemo(
    () => (irrelevant ? [] : decisionBoundaries(company, event, inputs)),
    [company, event, inputs, irrelevant],
  );
  const best = recommendedResponse(report);
  const originalBest = recommendedResponse(snapshot.report);
  const changed = JSON.stringify(inputs) !== JSON.stringify(initial);
  const money = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: company.currency,
    }).format((cents || 0) / 100);
  const name = (id: string) =>
    company.suppliers.find((s) => s.id === id)?.name ??
    company.components.find((c) => c.id === id)?.name ??
    company.products.find((p) => p.id === id)?.name ??
    id;
  const adjustableDependency =
    !!dependency &&
    company.components
      .filter((c) => c.sources.some((s) => s.supplierId === target))
      .every((c) => c.sources.length > 1);
  const parameterText = (parameter: string, value: number) =>
    parameter === "disruptionDays"
      ? `${value} days`
      : parameter === "premiumBps"
        ? `${value / 100}%`
        : money(value);
  return (
    <div className="space-y-5" data-testid="financial-decision">
      <section id="detect" className="event-summary">
        <p className="eyebrow">1 · Detect</p>
        <h2>
          {irrelevant
            ? "Competitor leadership announcement"
            : snapshot.selectedScenarioId === "custom"
              ? "Custom supply disruption"
              : "Freight closure interrupts can deliveries"}
        </h2>
        <p className="my-2 text-sm">{event.description}</p>
        <p>
          {report.affectedUnits ? "High modeled risk" : "No material exposure"}{" "}
          · Synthetic manufacturing brief ·{" "}
          {irrelevant ? "No relevant dependency" : "Logistics disruption"} ·
          Supplied classification; no model confidence claimed
        </p>
      </section>
      <section id="trace" className="judge-panel">
        <h2 className="text-xl font-semibold">2 · Trace the dependency</h2>
        <div
          className="dependency-chain"
          key={`${event.id}-${report.affectedUnits}`}
        >
          {[
            [
              "EVENT",
              event.type === "irrelevant"
                ? "Leadership announcement"
                : snapshot.selectedScenarioId === "custom"
                  ? "Supply disruption"
                  : "Freight closure",
            ],
            [
              "SUPPLIER",
              report.affectedSuppliers.map(name).join(" · ") || "No match",
            ],
            [
              "COMPONENT",
              report.affectedComponents
                .map((c) => name(c.componentId))
                .join(" · ") || "No shortage",
            ],
            [
              "PRODUCT",
              report.affectedProducts
                .map((p) => name(p.productId))
                .join(" · ") || "No affected products",
            ],
            [
              "FINANCIAL IMPACT",
              `${money(report.contributionMarginAtRiskCents)} margin at risk`,
            ],
          ].map(([label, value], i) => (
            <div
              className="dependency-node"
              key={label}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <p className="text-sm text-text-secondary mt-3">
          Paths resolved from supplier shares and each product's bill of
          materials.
        </p>
      </section>

      <div className="financial-overview">
        <section
          id="quantify"
          className="judge-panel exposure-hero"
          aria-live="polite"
        >
          <p className="text-sm text-text-secondary">
            {changed ? "WHAT-IF ESTIMATE" : "CURRENT SCENARIO"} ·{" "}
            {event.type === "irrelevant"
              ? "Leadership announcement"
              : snapshot.selectedScenarioId === "custom"
                ? "Supply disruption"
                : "Freight terminal closure"}
          </p>
          <h2 className="exposure-amount" data-testid="margin-exposure">
            {report.affectedUnits
              ? money(report.contributionMarginAtRiskCents)
              : "No material exposure detected"}
          </h2>
          <p className="font-semibold">
            {report.affectedUnits
              ? "Margin at Risk"
              : "No action required for the modeled supply chain."}
          </p>
          <Provenance kind="DETERMINISTIC CALCULATION" />
          {irrelevant && (
            <p className="mt-3">
              No supplier, component, product, or logistics dependency matched
              the supplied synthetic event. Model confidence is not claimed for
              this offline fixture.
            </p>
          )}
          <div className="grid sm:grid-cols-3 gap-4 mt-5">
            <div>
              <p>Affected cases</p>
              <strong data-testid="affected-cases">
                {report.affectedUnits.toLocaleString()}
              </strong>
            </div>
            <div>
              <p>Revenue at risk</p>
              <strong>{money(report.revenueAtRiskCents)}</strong>
            </div>
            <div>
              <p>Cash impact</p>
              <strong>{money(report.cashImpactCents)}</strong>
            </div>
          </div>
          {changed && (
            <p className="mt-3">
              Saved baseline:{" "}
              {money(snapshot.report.contributionMarginAtRiskCents)} margin at
              risk · {originalBest.description}
            </p>
          )}
          <Calculations steps={report.calculationSteps} money={money} />
        </section>

        <section id="decide" className="judge-panel">
          <h2 className="text-xl font-semibold">Recommended action</h2>
          <p className="text-lg mt-2" data-testid="recommended-action">
            {best.id === "do-nothing"
              ? "Take no action"
              : `Use ${name(best.supplierId!)} for ${name(best.componentId!)}`}
          </p>
          <p className="text-3xl text-success mt-3" data-testid="net-benefit">
            {money(best.netFinancialBenefitCents)} net benefit
          </p>
          <p className="text-sm text-text-secondary">
            Highest incremental contribution after recovery costs, versus
            accepting the disruption. Ties retain the earlier option; no action
            wins a zero-benefit tie.
          </p>
        </section>
      </div>
      <section className="judge-panel">
        <h2 className="text-xl font-semibold">Compare response options</h2>
        <div className="overflow-x-auto mt-4">
          <table className="decision-table">
            <thead>
              <tr>
                <th>Response</th>
                <th>Cases recovered</th>
                <th>Margin preserved</th>
                <th>Response cost</th>
                <th>Net benefit</th>
              </tr>
            </thead>
            <tbody>
              {report.responseOptions.map((option) => (
                <tr
                  key={option.id}
                  className={best.id === option.id ? "recommended-row" : ""}
                >
                  <td>
                    {option.id === "do-nothing"
                      ? "Take no action"
                      : `Source ${name(option.componentId!)} from ${name(option.supplierId!)}`}
                    {option.id === best.id && (
                      <span className="block text-xs text-success mt-1">
                        Recommended
                      </span>
                    )}
                  </td>
                  <td>{option.recoveredUnits.toLocaleString()}</td>
                  <td>{money(option.avoidedContributionMarginLossCents)}</td>
                  <td>{money(option.incrementalCostCents)}</td>
                  <td>{money(option.netFinancialBenefitCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="judge-panel">
        <h3 className="font-semibold mt-5">Why this recommendation?</h3>
        <p className="mt-3">
          Why this action: {money(best.avoidedContributionMarginLossCents)} in
          avoided margin loss minus {money(best.incrementalCostCents)} in
          response costs. Remaining Margin at Risk:{" "}
          {money(best.residualExposure.contributionMarginAtRiskCents)}.
        </p>
        <p className="text-sm text-text-secondary mt-2">
          Cash change versus an undisrupted month: {money(best.cashImpactCents)}
          . Recovery is limited by available alternate capacity; options are
          independent and are not combined.
        </p>
        <Provenance kind="DETERMINISTIC CALCULATION" />
        <Calculations
          steps={
            best.calculationSteps.length
              ? best.calculationSteps
              : report.calculationSteps
          }
          money={money}
        />
        {!irrelevant && (
          <details className="mt-5">
            <summary className="cursor-pointer font-semibold text-primary-300">
              What would change our recommendation?
            </summary>
            <p className="text-sm text-text-secondary my-3">
              Nearest sampled change, holding all other current assumptions
              fixed. Ranges below bracket a change; they are not exact
              continuous break-even points.
            </p>
            <ul className="space-y-3">
              {boundaries.map((boundary) => (
                <li key={boundary.parameter}>
                  <strong>
                    {boundary.parameter === "disruptionDays"
                      ? "Disruption duration"
                      : boundary.parameter === "premiumBps"
                        ? "Alternate premium"
                        : "Additional response cost"}
                    :{" "}
                  </strong>
                  {boundary.lower === null ? (
                    `No recommendation change found within ${parameterText(boundary.parameter, boundary.minimum)}–${parameterText(boundary.parameter, boundary.maximum)}.`
                  ) : (
                    <>
                      Change between{" "}
                      {parameterText(boundary.parameter, boundary.lower)} and{" "}
                      {parameterText(boundary.parameter, boundary.upper!)}.
                      Alternative:{" "}
                      {boundary.alternativeId === "do-nothing"
                        ? "Take no action"
                        : boundary.alternativeDescription}{" "}
                      ({money(boundary.netBenefitCents!)} net benefit at the
                      changed sample).
                    </>
                  )}
                  <span className="block text-xs text-text-secondary">
                    Search step:{" "}
                    {parameterText(boundary.parameter, boundary.step)}.
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {!irrelevant && (
        <section id="stress" className="judge-panel space-y-4">
          <div className="flex justify-between flex-wrap gap-3">
            <h2 className="text-xl font-semibold">What-if stress test</h2>
            <button
              className="text-primary-300 underline"
              onClick={() => setInputs(initial)}
            >
              Reset assumptions
            </button>
          </div>
          <p className="text-sm text-text-secondary">
            Explore explicit assumptions. Results update locally through the
            same finance engine; sliders do not call Nemotron. These estimates
            do not change the saved scenario.
          </p>
          <p
            className="whatif-result"
            aria-live="polite"
            key={JSON.stringify(inputs)}
          >
            Margin at Risk:{" "}
            {money(snapshot.report.contributionMarginAtRiskCents)} →{" "}
            <strong>{money(report.contributionMarginAtRiskCents)}</strong>. Net
            benefit: {money(originalBest.netFinancialBenefitCents)} →{" "}
            <strong>{money(best.netFinancialBenefitCents)}</strong>.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                key: "disruptionDays",
                label: "Disruption duration",
                min: 0,
                max: company.daysInMonth,
                step: 1,
                value: inputs.disruptionDays,
                display: `${inputs.disruptionDays} days`,
                disabled: false,
              },
              {
                key: "dependencyBps",
                label: "Supplier dependency",
                min: 1000,
                max: 10000,
                step: 100,
                value: inputs.dependencyBps,
                display: `${inputs.dependencyBps / 100}%`,
                disabled: !adjustableDependency,
              },
              {
                key: "premiumBps",
                label: "Alternate supplier premium",
                min: 0,
                max: 5000,
                step: 50,
                value: inputs.premiumBps,
                display: `${inputs.premiumBps / 100}%`,
                disabled: false,
              },
              {
                key: "responseCostCents",
                label: "Additional response cost",
                min: 0,
                max: Math.max(
                  10000,
                  snapshot.report.contributionMarginAtRiskCents + 10000,
                ),
                step: 10000,
                value: inputs.responseCostCents,
                display: money(inputs.responseCostCents),
                disabled: false,
              },
            ].map((control) => (
              <label key={control.key} className="block">
                <span className="flex justify-between gap-2">
                  <span>{control.label}</span>
                  <strong>{control.display}</strong>
                </span>
                <input
                  className="w-full mt-3 accent-sky-400"
                  type="range"
                  aria-label={control.label}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={control.value}
                  disabled={control.disabled}
                  onChange={(e) =>
                    setInputs((previous) => ({
                      ...previous,
                      [control.key]: Number(e.target.value),
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <p className="text-sm text-text-secondary">
            Dependency changes apply to {name(target)}; remaining sources are
            rebalanced proportionally.{" "}
            {adjustableDependency
              ? ""
              : "Sole-source dependencies remain at 100%."}{" "}
            Premium applies to alternate purchases; additional cost is added to
            each independent response's fixed shipping charge. Horizon: one{" "}
            {company.daysInMonth}-day month.
          </p>
        </section>
      )}

      <details className="judge-panel">
        <summary className="cursor-pointer font-semibold">
          Source Evidence
        </summary>
        <div className="mt-4 space-y-3">
          <h3>{snapshot.source.title}</h3>
          <Provenance kind="SOURCE FACT" />
          <p className="text-sm">
            Source type: synthetic manufacturing brief, supplied scenario
            inputs.
          </p>
          <blockquote className="source-excerpt">
            {snapshot.source.text}
          </blockquote>
          <p>
            Used for:{" "}
            {irrelevant
              ? "supplied irrelevant classification; no disrupted supplier IDs."
              : `explicit duration (${event.disruptionDays} days), delivery availability and supplier identifiers.`}
          </p>
          <p>
            Matched entities:{" "}
            {report.affectedSuppliers.map(name).join(", ") || "none"}.
          </p>
          {changed && (
            <p className="text-warning">
              The what-if assumptions above override this source scenario for
              the current simulation.
            </p>
          )}
          {intelligence?.success && (
            <div className="space-y-2">
              <h3>Submitted article · user-provided text</h3>
              <Provenance kind="AI INFERENCE" />
              <p>
                Nemotron: {intelligence.result.eventClassification.category} ·{" "}
                {(
                  intelligence.result.eventClassification.confidence * 100
                ).toFixed(1)}
                % model confidence
              </p>
              {intelligence.result.evidence.map((quote) => (
                <blockquote className="source-excerpt" key={quote}>
                  {quote}
                </blockquote>
              ))}
              <p className="text-sm">
                Evidence is checked against the{" "}
                {intelligenceSource?.length ?? 0}-character submitted source.
                These quotes belong to that article, not the synthetic brief
                above.
              </p>
              <p>{intelligence.result.eventClassification.rationale}</p>
              <p>
                Extracted entities:{" "}
                {intelligence.result.entities
                  .map((entity) => entity.name)
                  .join(", ") || "none"}
                .
              </p>
              <p>
                Used for qualitative classification and relevance. The saved
                scenario's explicit inputs remain the source of financial
                values.
              </p>
            </div>
          )}
        </div>
      </details>
      <details className="judge-panel">
        <summary className="cursor-pointer font-semibold">
          Processing Trace
        </summary>
        <ol className="mt-4 space-y-2">
          <li>Source ingestion — supplied synthetic brief loaded</li>
          <li>
            Nemotron extraction —{" "}
            {intelligence?.success
              ? "completed for submitted article; qualitative output only"
              : intelligence
                ? "failed; financial assumptions preserved"
                : "not run; offline scenario uses supplied structured intelligence"}
          </li>
          <li>
            Dependency resolution — {report.affectedSuppliers.length} suppliers,{" "}
            {report.affectedComponents.length} components,{" "}
            {report.affectedProducts.length} products
          </li>
          <li>
            Financial analysis — complete, deterministic integer-cent
            calculations
          </li>
          <li>
            Action evaluation — {report.responseOptions.length} independent
            options calculated
          </li>
          <li>Recommendation — highest computed net benefit selected</li>
          <li>
            Persistence — what-if estimates are local and unsaved; saved
            scenarios use the application API
          </li>
        </ol>
      </details>
    </div>
  );
}
