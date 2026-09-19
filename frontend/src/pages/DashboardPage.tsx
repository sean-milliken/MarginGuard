import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import {
  CriticalRiskCard,
  SupplierExposure,
} from "../components/features/Dashboard";
import { Sidebar } from "../components/layout/Sidebar";
export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    company,
    currentScenario,
    currentEvent,
    snapshot,
    busy,
    error,
    runScenario,
  } = useData();
  const report = snapshot.report;
  const best = report.responseOptions.reduce((a, b) =>
    b.netFinancialBenefitCents > a.netFinancialBenefitCents ? b : a,
  );
  const money = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: snapshot.company.currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-[220px] min-w-0">
        <header className="border-b border-border bg-bg-primary/80 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-primary-300">
              Financial Command Center
            </h1>
            <p className="text-sm text-text-secondary">
              {company.name} · synthetic company, calculated results
            </p>
          </div>
          <button
            className="rounded-lg bg-primary-600 px-4 py-2 text-white"
            onClick={() => navigate("/analysis")}
          >
            Simulate Event
          </button>
        </header>
        <main className="p-6 space-y-6">
          {error && (
            <p role="alert" className="text-error">
              {error}
            </p>
          )}
          <label className="flex flex-wrap items-center gap-3 text-sm">
            Scenario
            <select
              aria-label="Scenario"
              disabled={busy}
              value={snapshot.selectedScenarioId}
              onChange={(e) => void runScenario(e.target.value)}
              className="rounded-lg border border-border bg-bg-secondary p-2"
            >
              {snapshot.selectedScenarioId === "custom" && (
                <option value="custom">Custom disruption</option>
              )}
              {snapshot.scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {busy && <span role="status">Calculating…</span>}
          </label>
          <CriticalRiskCard
            event={currentEvent}
            scenario={currentScenario}
            onAnalyze={() => navigate("/analysis")}
          />
          <section
            className="grid sm:grid-cols-3 gap-4"
            aria-label="Financial overview"
          >
            {[
              { label: "Cash impact", value: money(report.cashImpactCents) },
              {
                label: "Best net response benefit",
                value: money(best.netFinancialBenefitCents),
              },
              {
                label: "Affected cases",
                value: report.affectedUnits.toLocaleString(),
              },
            ].map((metric) => (
              <div
                className="rounded-xl border border-border bg-bg-tertiary p-5"
                key={metric.label}
              >
                <p className="text-sm text-text-secondary">{metric.label}</p>
                <p className="text-2xl font-bold mt-2">{metric.value}</p>
              </div>
            ))}
          </section>
          <div className="grid lg:grid-cols-2 gap-6">
            <SupplierExposure suppliers={company.suppliers} />
            <section className="rounded-xl border border-border bg-bg-tertiary p-5">
              <h2 className="font-semibold mb-3">Response comparison</h2>
              <p className="text-sm text-text-secondary mb-4">
                {best.description}
              </p>
              <p className="text-2xl text-success">
                {money(best.netFinancialBenefitCents)} net benefit
              </p>
              <button
                className="mt-4 underline text-primary-300"
                onClick={() => navigate("/responses")}
              >
                Compare response options
              </button>
            </section>
          </div>
          <section className="rounded-xl border border-border bg-bg-tertiary p-5">
            <h2 className="font-semibold mb-4">Monthly product contribution</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {company.products.map((p) => (
                <div key={p.id}>
                  <h3>{p.name}</h3>
                  <p className="text-xl font-bold">
                    {money(p.totalMargin * 100)}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {p.unitsPerMonth.toLocaleString()} cases ·{" "}
                    {money(p.marginPerUnit * 100)}/case
                  </p>
                </div>
              ))}
            </div>
          </section>
          <p className="text-xs text-text-secondary">
            Cash impact assumes same-month collections and avoidable variable
            payments. Supplier dependency shows the largest share of an
            individual component. All amounts come from explicit scenario
            inputs.
          </p>
        </main>
      </div>
    </div>
  );
}
