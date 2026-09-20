import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { useData } from "../contexts/DataContext";
import {
  getNews,
  getEconomicSignals,
  type NewsArticle,
  type EconomicSignal,
} from "../lib/api";
export default function WorkspacePage() {
  const { pathname } = useLocation();
  const { snapshot, busy, error, runScenario, intelligence, analyzeText } =
    useData();
  const { report, company, event } = snapshot;
  const [days, setDays] = useState(event.disruptionDays),
    [severity, setSeverity] = useState(event.unavailableBps / 100),
    [supplier, setSupplier] = useState(
      event.supplierIds[0] ?? company.suppliers[0]!.id,
    );
  const [article, setArticle] = useState(snapshot.source.text);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [signals, setSignals] = useState<EconomicSignal[]>([]);
  useEffect(() => {
    getNews().then(setNews).catch(() => {});
    getEconomicSignals().then(setSignals).catch(() => {});
  }, []);
  const money = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: company.currency,
    }).format(cents / 100);
  const name = (id: string) =>
    company.suppliers.find((s) => s.id === id)?.name ??
    company.components.find((c) => c.id === id)?.name ??
    company.products.find((p) => p.id === id)?.name ??
    id;
  const title = pathname.slice(1).replace(/^./, (c) => c.toUpperCase());
  // "20260919T120000Z" → "Sep 19, 2026"
  const gdeltDate = (raw: string) => {
    const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
    if (!m) return raw;
    return new Date(`${m[1]}-${m[2]}-${m[3]}`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const panel = "rounded-xl border border-border bg-bg-tertiary p-5 space-y-3";
  const input = "rounded-lg border border-border bg-bg-secondary p-2";
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="ml-[220px] p-6 flex-1 min-w-0 space-y-6">
        <h1 className="text-2xl font-bold text-primary-300">{title}</h1>
        {error && (
          <p role="alert" className="text-error">
            {error}
          </p>
        )}
        {busy && <p role="status">Working…</p>}
        {pathname === "/analysis" && (
          <>
            <form
              className={panel}
              onSubmit={(e) => {
                e.preventDefault();
                void runScenario("custom", days, severity, supplier);
              }}
            >
              <h2 className="font-semibold">Explicit disruption inputs</h2>
              <div className="flex flex-wrap items-end gap-4">
                <label>
                  Supplier
                  <select
                    aria-label="Supplier"
                    className={`${input} block`}
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  >
                    {company.suppliers.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Disruption days
                  <input
                    aria-label="Disruption days"
                    className={`${input} block w-28`}
                    type="number"
                    min="0"
                    max={company.daysInMonth}
                    required
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  />
                </label>
                <label>
                  Unavailable deliveries (%)
                  <input
                    aria-label="Unavailable deliveries (%)"
                    className={`${input} block w-28`}
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                  />
                </label>
                <button
                  disabled={busy}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-white"
                >
                  Calculate impact
                </button>
              </div>
              <p className="text-sm text-text-secondary">
                Supplier shares, monthly demand, and prices come from the
                Company page. Article classification never changes these inputs.
              </p>
            </form>
            <section className={panel}>
              <h2 className="font-semibold">Calculated exposure</h2>
              <p>
                {report.affectedUnits.toLocaleString()} cases ·{" "}
                {money(report.revenueAtRiskCents)} revenue at risk ·{" "}
                {money(report.contributionMarginAtRiskCents)} contribution at
                risk
              </p>
              <p>Cash impact: {money(report.cashImpactCents)}</p>
              <h3>Dependency path</h3>
              <p>
                {report.affectedSuppliers.map(name).join(", ") ||
                  "No suppliers affected"}{" "}
                →{" "}
                {report.affectedComponents
                  .map((c) => name(c.componentId))
                  .join(", ") || "No shortage"}{" "}
                →{" "}
                {report.affectedProducts
                  .map((p) => name(p.productId))
                  .join(", ") || "No products affected"}
              </p>
            </section>
            <section className={panel}>
              <h2 className="font-semibold">Calculation steps</h2>
              <ol className="space-y-3">
                {report.calculationSteps.map((step, i) => (
                  <li key={i} className="text-sm">
                    <span className="text-text-secondary">
                      {i + 1}. {step.formula}
                    </span>
                    <br />
                    <strong>
                      {step.result.toLocaleString()} {step.unit}
                    </strong>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
        {pathname === "/responses" && (
          <>
            <p>
              Independent alternatives, compared with doing nothing. These are
              simulations; no orders are placed.
            </p>
            {report.responseOptions.map((option) => (
              <section className={panel} key={option.id}>
                <h2 className="font-semibold">{option.description}</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  <p>
                    Incremental cost
                    <br />
                    <strong>{money(option.incrementalCostCents)}</strong>
                  </p>
                  <p>
                    Avoided contribution loss
                    <br />
                    <strong>
                      {money(option.avoidedContributionMarginLossCents)}
                    </strong>
                  </p>
                  <p>
                    Net benefit
                    <br />
                    <strong className="text-success">
                      {money(option.netFinancialBenefitCents)}
                    </strong>
                  </p>
                </div>
                <p>
                  {option.recoveredUnits.toLocaleString()} cases recovered ·
                  cash impact {money(option.cashImpactCents)} · remaining
                  contribution at risk{" "}
                  {money(option.residualExposure.contributionMarginAtRiskCents)}
                </p>
                <details>
                  <summary className="cursor-pointer text-primary-300">
                    Response calculations
                  </summary>
                  {option.calculationSteps.map((s, i) => (
                    <p className="text-sm mt-2" key={i}>
                      {s.formula} = {s.result.toLocaleString()} {s.unit}
                    </p>
                  ))}
                </details>
              </section>
            ))}
          </>
        )}
        {pathname === "/intelligence" && (
          <>
            {news.length > 0 && (
              <section className={panel}>
                <h2 className="font-semibold">Recent news headlines</h2>
                <p className="text-xs text-text-tertiary">
                  Select an article to pre-load its headline into the source
                  text field below, then add the full article body for analysis.
                </p>
                <ul className="space-y-2">
                  {news.map((a) => (
                    <li key={a.url} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setArticle(
                            `${a.title}\n\nSource: ${a.domain}\nURL: ${a.url}\n\n[Paste article text here]`,
                          )
                        }
                        className="shrink-0 rounded border border-border bg-bg-secondary px-2 py-0.5 text-xs hover:bg-bg-hover"
                      >
                        Use
                      </button>
                      <div>
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-300 hover:underline leading-snug"
                        >
                          {a.title}
                        </a>
                        <p className="text-xs text-text-tertiary">
                          {a.domain} · {gdeltDate(a.seendate)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <form
              className={panel}
              onSubmit={(e) => {
                e.preventDefault();
                void analyzeText(article);
              }}
            >
              <h2 className="font-semibold">
                Analyze source text with Nemotron
              </h2>
              <p className="text-sm text-text-secondary">
                Extract classification, entities, and source evidence. Financial
                calculations remain independent. Text is sent to NVIDIA only
                when you submit.
              </p>
              <label className="block">
                Source text
                <textarea
                  aria-label="Source text"
                  className={`${input} block w-full mt-2 min-h-48`}
                  minLength={20}
                  maxLength={30000}
                  required
                  value={article}
                  onChange={(e) => setArticle(e.target.value)}
                />
              </label>
              <button
                disabled={busy || !snapshot.intelligenceAvailable}
                className="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50"
              >
                Analyze source
              </button>
              {!snapshot.intelligenceAvailable && (
                <p role="status">
                  Nemotron is not configured. Set NVIDIA_API_KEY on the server
                  and restart. Financial analysis is available now.
                </p>
              )}
            </form>
            {intelligence?.success && (
              <section className={panel}>
                <h2 className="font-semibold">
                  {intelligence.result.eventClassification.category}
                </h2>
                <p>{intelligence.result.eventClassification.rationale}</p>
                <p>
                  Model confidence:{" "}
                  {(
                    intelligence.result.eventClassification.confidence * 100
                  ).toFixed(0)}
                  %
                </p>
                <p>{intelligence.result.businessRelevance.reasoning}</p>
                <h3>Entities</h3>
                <ul>
                  {intelligence.result.entities.map((entity, i) => (
                    <li key={i}>
                      {entity.name} ({entity.type})
                    </li>
                  ))}
                </ul>
                <h3>Source evidence</h3>
                {intelligence.result.evidence.map((quote, i) => (
                  <blockquote
                    key={i}
                    className="border-l-2 border-primary-500 pl-3"
                  >
                    {quote}
                  </blockquote>
                ))}
                {intelligence.result.responseOptionRanking?.map((rank) => (
                  <p key={rank.optionId}>
                    Qualitative rank {rank.rank}:{" "}
                    {
                      report.responseOptions.find((o) => o.id === rank.optionId)
                        ?.description
                    }{" "}
                    — {rank.explanation} Tradeoffs: {rank.tradeoffs}
                  </p>
                ))}
              </section>
            )}
          </>
        )}
        {pathname === "/sources" && (
          <>
            <section className={panel}>
              <h2 className="font-semibold">Scenario source article</h2>
              <p className="text-xs text-warning">
                Synthetic scenario · not a live news feed
              </p>
              <p className="font-medium">{snapshot.source.title}</p>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">
                {snapshot.source.text}
              </p>
            </section>

            {news.length > 0 && (
              <section className={panel}>
                <h2 className="font-semibold">Live news · supply chain</h2>
                <p className="text-xs text-text-tertiary">
                  Via GDELT · updates every 5 minutes
                </p>
                <ul className="space-y-3">
                  {news.map((article) => (
                    <li key={article.url} className="flex flex-col gap-0.5">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-300 hover:underline text-sm font-medium leading-snug"
                      >
                        {article.title}
                      </a>
                      <span className="text-xs text-text-tertiary">
                        {article.domain} ·{" "}
                        {gdeltDate(article.seendate)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {signals.length > 0 && (
              <section className={panel}>
                <h2 className="font-semibold">Economic indicators · FRED</h2>
                <p className="text-xs text-text-tertiary">
                  St. Louis Fed · supply chain relevant series
                </p>
                <ul className="space-y-3">
                  {signals.map((sig) => (
                    <li key={sig.id} className="flex items-start justify-between gap-4">
                      <div>
                        <a
                          href={sig.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary-300 hover:underline"
                        >
                          {sig.seriesName}
                        </a>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {sig.description} · {sig.date}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          sig.severity === "critical"
                            ? "text-error"
                            : sig.severity === "high"
                              ? "text-warning"
                              : "text-text-secondary"
                        }`}
                      >
                        {sig.percentageChange > 0 ? "+" : ""}
                        {sig.percentageChange.toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {news.length === 0 && signals.length === 0 && (
              <p className="text-sm text-text-secondary">
                Live news and economic indicators load when the backend is
                reachable. Configure FRED_API_KEY to enable economic signals.
              </p>
            )}
          </>
        )}
        {pathname === "/company" && (
          <>
            <section className={panel}>
              <h2>{company.name}</h2>
              <p>
                Synthetic manufacturing model · {company.currency} ·{" "}
                {company.daysInMonth}-day month · product units are 12-can cases
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      {[
                        "Product",
                        "Monthly cases",
                        "Price/case",
                        "Variable cost/case",
                        "Contribution/case",
                      ].map((h) => (
                        <th className="p-2" key={h}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {company.products.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2">{p.name}</td>
                        <td>{p.monthlyVolume.toLocaleString()}</td>
                        <td>{money(p.sellingPriceCents)}</td>
                        <td>{money(p.variableCostCents)}</td>
                        <td>
                          {money(p.sellingPriceCents - p.variableCostCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            {company.components.map((c) => (
              <section className={panel} key={c.id}>
                <h2>
                  {c.name} · {money(c.unitCostCents)}/unit
                </h2>
                {c.sources.map((s) => (
                  <p key={s.supplierId}>
                    {name(s.supplierId)}: {s.dependencyBps / 100}% dependency
                  </p>
                ))}
                {c.alternatives.map((a) => (
                  <p key={a.supplierId}>
                    Alternate {name(a.supplierId)}:{" "}
                    {a.capacityUnits.toLocaleString()} extra units,{" "}
                    {a.premiumBps / 100}% premium,{" "}
                    {money(a.expeditedShippingCentsPerUnit)}/unit shipping +{" "}
                    {money(a.fixedExpeditingCents)} fixed.
                  </p>
                ))}
              </section>
            ))}
          </>
        )}
        {pathname === "/evals" && (
          <section className={panel}>
            <h2>Evaluation status</h2>
            <p>
              No live model evaluation has been run in this session. Accuracy
              and confidence scores are not fabricated.
            </p>
            <p>
              The repository includes a labeled Nemotron evaluation dataset and
              harness. Run <code>npm run eval:nemotron</code> with a server-side
              NVIDIA key to produce measured results.
            </p>
            <p>
              Financial formula and API integration tests run with{" "}
              <code>npm test</code>.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
