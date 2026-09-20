import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useData } from "../contexts/DataContext";
import { useSetup } from "../contexts/SetupContext";
import { SupplierExposure } from "../components/features/Dashboard";
import { EconomicSignals } from "../components/features/Dashboard/EconomicSignals";
import { Sidebar } from "../components/layout/Sidebar";
import { JudgeDemo } from "../components/JudgeDemo";
import { getEconomicSignals, type EconomicSignal } from "../lib/api";
import { recommendedResponse } from "../../../backend/financial-engine/src/sensitivity";
export default function DashboardPage() {
  const navigate = useNavigate();
  const { companyName } = useSetup();
  const { company, snapshot, error } = useData();
  const [signals, setSignals] = useState<EconomicSignal[]>([]);
  const [signalError, setSignalError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getEconomicSignals()
      .then((data) => {
        if (active) setSignals(data);
      })
      .catch(() => {
        if (active)
          setSignalError(
            "Economic observations are temporarily unavailable. Scenario analysis remains available.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const { report, event } = snapshot;
  const best = recommendedResponse(report);
  const money = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: snapshot.company.currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  const supplierNames = report.affectedSuppliers
    .map((id) => snapshot.company.suppliers.find((s) => s.id === id)?.name)
    .join(", ");
  const componentNames = report.affectedComponents
    .map(
      (c) =>
        snapshot.company.components.find((x) => x.id === c.componentId)?.name,
    )
    .join(", ");
  return (
    <div className="min-h-screen flex app-shell">
      <Sidebar />
      <main className="ml-[220px] flex-1 min-w-0 workspace-main">
        <header className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>{companyName} · synthetic manufacturing model</p>
          </div>
          <JudgeDemo compact />
        </header>
        <p className="product-promise">
          Know what will hit your bottom line before it does.
        </p>
        {error && (
          <p role="alert" className="text-error">
            {error}
          </p>
        )}
        <section className="risk-lead" aria-label="Current financial risk">
          <div className="risk-context">
            <span
              className={
                report.affectedUnits
                  ? "severity severity-high"
                  : "severity severity-clear"
              }
            >
              {report.affectedUnits
                ? "High · modeled risk"
                : "No material exposure"}
            </span>
            <span>Synthetic brief · analyzed</span>
          </div>
          <h2>
            {event.type === "irrelevant"
              ? "Competitor leadership announcement"
              : snapshot.selectedScenarioId === "custom"
                ? "Custom supply disruption"
                : "Freight closure interrupts can deliveries"}
          </h2>
          <div className="risk-decision-grid">
            <div>
              <p className="eyebrow">Margin at Risk</p>
              <p className="dashboard-amount">
                {money(report.contributionMarginAtRiskCents)}
              </p>
              <p className="text-sm text-text-secondary">
                Calculated contribution margin · {event.disruptionDays}-day
                scenario
              </p>
              <p className="risk-path">
                {supplierNames || "No supplier matched"} →{" "}
                {componentNames || "No component shortage"} →{" "}
                {report.affectedProducts.length} products
              </p>
            </div>
            <div className="risk-recommendation">
              <p className="eyebrow">Recommended action</p>
              <h3>
                {best.id === "do-nothing"
                  ? "Take no action"
                  : "Use alternate supply"}
              </h3>
              <p>
                {best.supplierId
                  ? snapshot.company.suppliers.find(
                      (s) => s.id === best.supplierId,
                    )?.name
                  : "No recovery spending required."}
              </p>
              <p className="benefit">{money(best.netFinancialBenefitCents)}</p>
              <p className="text-sm">Net benefit versus no action</p>
              <button
                className="judge-button mt-5"
                onClick={() => navigate("/analysis")}
              >
                View Analysis →
              </button>
            </div>
          </div>
          <footer className="risk-footer">
            <span>{report.affectedUnits.toLocaleString()} cases affected</span>
            <span>{money(report.revenueAtRiskCents)} revenue at risk</span>
            <button onClick={() => navigate("/scenarios")}>
              Run another scenario
            </button>
          </footer>
        </section>
        <nav className="decision-flow" aria-label="Decision flow">
          {[
            ["detect", "Detect"],
            ["trace", "Trace"],
            ["quantify", "Quantify"],
            ["decide", "Decide"],
          ].map(([id, label], i) => (
            <button key={id} onClick={() => navigate("/analysis#" + id)}>
              <span>0{i + 1}</span>
              {label}
            </button>
          ))}
        </nav>
        <section className="secondary-business">
          <div>
            <h2>Business context</h2>
            <p>Explore the inputs and signals behind the decision.</p>
          </div>
          <details>
            <summary>Economic indicators</summary>
            {loading ? (
              <p role="status">Loading observations…</p>
            ) : signalError ? (
              <p>{signalError}</p>
            ) : signals.length ? (
              <EconomicSignals signals={signals} />
            ) : (
              <p>No economic observations are available.</p>
            )}
          </details>
          <details>
            <summary>Supplier dependencies</summary>
            <SupplierExposure suppliers={company.suppliers} />
          </details>
          <details>
            <summary>Monthly contribution by product</summary>
            <p className="text-sm text-text-secondary">
              Sales less variable costs, before fixed costs, interest, and tax.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mt-4">
              {company.products.map((p) => (
                <div key={p.id}>
                  <h3>{p.name}</h3>
                  <p className="text-xl">{money(p.totalMargin * 100)}</p>
                  <p>
                    {p.unitsPerMonth.toLocaleString()} cases ·{" "}
                    {money(p.marginPerUnit * 100)} contribution/case
                  </p>
                </div>
              ))}
            </div>
          </details>
        </section>
      </main>
    </div>
  );
}
