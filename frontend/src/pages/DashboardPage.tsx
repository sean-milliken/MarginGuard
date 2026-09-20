import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useSetup } from "../contexts/SetupContext";
import {
  CriticalRiskCard,
  SupplierExposure,
} from "../components/features/Dashboard";
import { Sidebar } from "../components/layout/Sidebar";
export default function DashboardPage() {
  const navigate = useNavigate();
  const { companyName } = useSetup();
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
              Supply Chain Risk Monitor
            </h1>
            <p className="text-sm text-text-secondary">
              {companyName} · pick a disruption below to see the financial impact
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
            onClick={() => navigate("/intelligence")}
          >
            Analyze a disruption
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </header>
        <main className="p-6 space-y-6">
          {error && (
            <p role="alert" className="text-error">
              {error}
            </p>
          )}
          <label className="flex flex-wrap items-center gap-3 text-sm">
            Model a disruption
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
              { label: "Estimated cash loss", value: money(report.cashImpactCents) },
              {
                label: "Best recovery option saves",
                value: money(best.netFinancialBenefitCents),
              },
              {
                label: "Product cases affected",
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
              <h2 className="font-semibold mb-1">Best recovery option</h2>
              <p className="text-xs text-text-secondary mb-3">If you act on this disruption, here's your best move</p>
              <p className="text-sm text-text-secondary mb-3">
                {best.description}
              </p>
              <p className="text-2xl text-success">
                {money(best.netFinancialBenefitCents)} saved vs. doing nothing
              </p>
              <button
                className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
                onClick={() => navigate("/responses")}
              >
                Compare response options
              </button>
            </section>
          </div>
          <section className="rounded-xl border border-border bg-bg-tertiary p-5">
            <h2 className="font-semibold mb-1">Monthly profit by product</h2>
            <p className="text-xs text-text-secondary mb-4">How much profit each product generates in a normal month</p>
            <div className="grid sm:grid-cols-3 gap-5">
              {company.products.map((p) => (
                <div key={p.id}>
                  <h3>{p.name}</h3>
                  <p className="text-xl font-bold">
                    {money(p.totalMargin * 100)}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {p.unitsPerMonth.toLocaleString()} cases · {money(p.marginPerUnit * 100)} profit/case
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
