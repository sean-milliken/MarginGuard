import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSetup } from "../contexts/SetupContext";
import { FinancialDecision, Provenance } from "../components/FinancialDecision";
import { JudgeDemo } from "../components/JudgeDemo";
import { EvaluationReport } from "../components/EvaluationReport";
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
  const navigate = useNavigate();
  const { companyName } = useSetup();
  const {
    snapshot,
    analysisRevision,
    busy,
    error,
    runScenario,
    intelligence,
    analyzeText,
  } = useData();
  const { report, company, event } = snapshot;
  const [days, setDays] = useState(event.disruptionDays),
    [severity, setSeverity] = useState(event.unavailableBps / 100),
    [supplier, setSupplier] = useState(
      event.supplierIds[0] ?? company.suppliers[0]!.id,
    );
  const [article, setArticle] = useState("");
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [signals, setSignals] = useState<EconomicSignal[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [signalsError, setSignalsError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!["/sources", "/intelligence"].includes(pathname)) return;
    let active = true;
    setNewsLoading(true);
    setNewsError(null);
    getNews()
      .then((data) => {
        if (active) setNews(data);
      })
      .catch((error) => {
        if (active) setNewsError(error.message);
      })
      .finally(() => {
        if (active) setNewsLoading(false);
      });
    if (pathname === "/sources") {
      setSignalsLoading(true);
      setSignalsError(null);
      getEconomicSignals()
        .then((data) => {
          if (active) setSignals(data);
        })
        .catch((error) => {
          if (active) setSignalsError(error.message);
        })
        .finally(() => {
          if (active) setSignalsLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [pathname, retry]);
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
  const pageTitles: Record<string, { title: string; sub: string }> = {
    "/analysis": {
      title: "Model Impact",
      sub: "Adjust the disruption below to see how it affects your cash and products.",
    },
    "/responses": {
      title: "Recovery Options",
      sub: "These are your options to reduce the impact. Financial simulations only — no orders are placed.",
    },
    "/intelligence": {
      title: "News Analysis",
      sub: "Paste a news article or supply chain alert. AI will identify what's disrupted and who's affected.",
    },
    "/sources": {
      title: "Sources",
      sub: "The scenario, news headlines, and economic observations available to the model.",
    },
    "/company": {
      title: "Company Data",
      sub: "The products, materials, and suppliers behind the financial model.",
    },
    "/evals": {
      title: "AI Accuracy",
      sub: "Results from testing the AI's analysis against labeled examples.",
    },
  };
  const { title, sub } = pageTitles[pathname] ?? {
    title: pathname.slice(1).replace(/^./, (c) => c.toUpperCase()),
    sub: "",
  };
  // "20260919T120000Z" → "Sep 19, 2026"
  const gdeltDate = (raw: string) => {
    const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
    if (!m) return raw;
    return new Date(`${m[1]}-${m[2]}-${m[3]}`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  };
  const panel = "rounded-xl border border-border bg-bg-tertiary p-5 space-y-3";
  const input = "rounded-lg border border-border bg-bg-secondary p-2";
  return (
    <div className="min-h-screen flex app-shell">
      <Sidebar />
      <main className="ml-[220px] p-6 flex-1 min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-300">{title}</h1>
          {sub && <p className="text-sm text-text-secondary mt-1">{sub}</p>}
        </div>
        {error && (
          <p role="alert" className="text-error">
            {error}
          </p>
        )}
        {busy && <p role="status">Working…</p>}
        {["/analysis", "/responses"].includes(pathname) && (
          <>
            <JudgeDemo />
            <FinancialDecision
              key={JSON.stringify([
                analysisRevision,
                snapshot.company,
                snapshot.event,
              ])}
            />
          </>
        )}
        {["/sources", "/intelligence"].includes(pathname) && (
          <>
            {newsLoading && <p role="status">Loading news headlines…</p>}
            {newsError && (
              <div role="alert">
                News: {newsError}{" "}
                <button
                  className="underline"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Retry sources
                </button>
              </div>
            )}
            {!newsLoading && !newsError && news.length === 0 && (
              <p>No news headlines are available.</p>
            )}
            {pathname === "/sources" && signalsLoading && (
              <p role="status">Loading economic observations…</p>
            )}
            {pathname === "/sources" && signalsError && (
              <div role="alert">Economic indicators: {signalsError}</div>
            )}
          </>
        )}
        {pathname === "/analysis" && (
          <details className={panel} open>
            <summary className="font-semibold cursor-pointer">
              Saved scenario &amp; advanced inputs
            </summary>
            <form
              className={panel}
              onSubmit={(e) => {
                e.preventDefault();
                void runScenario("custom", days, severity, supplier);
              }}
            >
              <h2 className="font-semibold">What's the disruption?</h2>
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
                  Deliveries blocked (%)
                  <input
                    aria-label="Deliveries blocked (%)"
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
                Product prices and supplier data come from the Company Data
                page. Hit Calculate to see the updated financial impact.
              </p>
            </form>
            <section className={panel}>
              <h2 className="font-semibold">Financial impact</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Cases affected",
                    value: report.affectedUnits.toLocaleString(),
                    plain: true,
                  },
                  {
                    label: "Sales at risk",
                    value: money(report.revenueAtRiskCents),
                    plain: true,
                  },
                  {
                    label: "Contribution margin at risk",
                    value: money(report.contributionMarginAtRiskCents),
                    plain: true,
                  },
                  {
                    label: "Cash change vs. normal month",
                    value: money(report.cashImpactCents),
                    negative: report.cashImpactCents < 0,
                  },
                ].map(({ label, value, negative }) => (
                  <div
                    key={label}
                    className="rounded-lg bg-bg-secondary p-3 space-y-1"
                  >
                    <p className="text-xs text-text-secondary uppercase tracking-wide">
                      {label}
                    </p>
                    <p
                      className={`text-lg font-bold tabular-nums ${negative ? "text-error" : ""}`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide mb-2">
                  What gets affected
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  {(report.affectedSuppliers.length
                    ? report.affectedSuppliers.map(name)
                    : ["No suppliers affected"]
                  ).map((n) => (
                    <span
                      key={n}
                      className="rounded bg-bg-secondary px-2 py-0.5 border border-border"
                    >
                      {n}
                    </span>
                  ))}
                  <span className="text-text-secondary px-1">→</span>
                  {(report.affectedComponents.length
                    ? report.affectedComponents.map((c) => name(c.componentId))
                    : ["No shortage"]
                  ).map((n) => (
                    <span
                      key={n}
                      className="rounded bg-bg-secondary px-2 py-0.5 border border-border"
                    >
                      {n}
                    </span>
                  ))}
                  <span className="text-text-secondary px-1">→</span>
                  {(report.affectedProducts.length
                    ? report.affectedProducts.map((p) => name(p.productId))
                    : ["No products affected"]
                  ).map((n) => (
                    <span
                      key={n}
                      className="rounded bg-bg-secondary px-2 py-0.5 border border-border"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </section>
            <details className={panel}>
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                <span>How this was calculated</span>
                <span className="text-xs text-text-secondary font-normal">
                  click to expand
                </span>
              </summary>
              <ol className="divide-y divide-border/40 mt-2">
                {report.calculationSteps.map((step, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-2 py-2 text-sm"
                  >
                    <span className="text-text-secondary tabular-nums text-right">
                      {i + 1}.
                    </span>
                    <code className="font-mono text-text-secondary break-all">
                      {step.formula}
                    </code>
                    <span className="font-semibold tabular-nums whitespace-nowrap pl-4">
                      {step.result.toLocaleString()}{" "}
                      <span className="font-normal text-text-secondary">
                        {step.unit}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </details>
            <div className="flex justify-end">
              <button
                onClick={() => navigate("/responses")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
              >
                See your recovery options
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          </details>
        )}
        {pathname === "/responses" && (
          <details className={panel} open>
            <summary className="font-semibold cursor-pointer">
              Saved scenario response details
            </summary>
            <p className="text-sm text-text-secondary">
              Independent alternatives, compared with doing nothing. These are
              simulations; no orders are placed.
            </p>
            {report.responseOptions.filter((o) => o.recoveredUnits > 0)
              .length === 0 && (
              <div className="rounded-xl border border-border bg-bg-tertiary p-6 text-center">
                <p className="text-text-secondary text-sm">
                  No recovery options available for the current scenario.
                </p>
                <p className="text-text-tertiary text-xs mt-1">
                  Doing nothing remains available as a baseline. Other actions
                  may be capacity-limited or unable to relieve the current
                  bottleneck.
                </p>
              </div>
            )}
            {report.responseOptions.map((option) => (
              <section className={panel} key={option.id}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <h2 className="font-semibold text-base leading-snug">
                    {option.description}
                  </h2>
                  <span
                    className={`text-sm font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${option.netFinancialBenefitCents > 0 ? "bg-success/15 text-success" : "bg-error/15 text-error"}`}
                  >
                    {option.netFinancialBenefitCents > 0 ? "+" : ""}
                    {money(option.netFinancialBenefitCents)} net financial
                    benefit
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Cases recovered",
                      value: option.recoveredUnits.toLocaleString(),
                      plain: true,
                    },
                    {
                      label: "Extra cost to act",
                      value: money(option.incrementalCostCents),
                      negative: option.incrementalCostCents > 0,
                    },
                    {
                      label: "Profit loss avoided",
                      value: money(option.avoidedContributionMarginLossCents),
                      positive: true,
                    },
                    {
                      label: "Net cash impact",
                      value: money(option.cashImpactCents),
                      negative: option.cashImpactCents < 0,
                    },
                  ].map(({ label, value, negative, positive }) => (
                    <div
                      key={label}
                      className="rounded-lg bg-bg-secondary p-3 space-y-1"
                    >
                      <p className="text-xs text-text-secondary uppercase tracking-wide leading-tight">
                        {label}
                      </p>
                      <p
                        className={`text-base font-bold tabular-nums ${negative ? "text-error" : positive ? "text-success" : ""}`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-text-secondary pt-1">
                  <span>Remaining contribution at risk</span>
                  <span className="font-medium text-text-primary tabular-nums">
                    {money(
                      option.residualExposure.contributionMarginAtRiskCents,
                    )}
                  </span>
                </div>
                <details>
                  <summary className="cursor-pointer text-primary-300">
                    How this response was calculated
                  </summary>
                  {option.calculationSteps.length === 0 ? (
                    <p className="text-sm mt-2">
                      Baseline: no incremental cost and no avoided loss.
                    </p>
                  ) : (
                    option.calculationSteps.map((step, index) => (
                      <p key={index} className="text-sm mt-2">
                        {step.formula} = {step.result.toLocaleString()}{" "}
                        {step.unit}
                      </p>
                    ))
                  )}
                </details>
              </section>
            ))}
          </details>
        )}
        {pathname === "/intelligence" && (
          <>
            {news.length > 0 && (
              <section className={panel}>
                <h2 className="font-semibold">Recent news headlines</h2>
                <p className="text-xs text-text-tertiary">
                  Use a headline as input, or paste the full article text below.
                  Article bodies are not fetched automatically.
                </p>
                <ul className="space-y-2">
                  {news.map((a) => (
                    <li key={a.url} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setArticle(a.title)}
                        className="shrink-0 rounded border border-border bg-bg-secondary px-2 py-0.5 text-xs hover:bg-bg-hover"
                      >
                        Use headline
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
                Analyze a news article or supply chain alert
              </h2>
              <p className="text-sm text-text-secondary">
                The AI reads the text and tells you what's disrupted, who's
                affected, and how serious it is. Your text is only sent when you
                click the button below.
              </p>
              {!article && (
                <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-text-primary">
                      Example: Steel City Beverages scenario
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5 truncate max-w-md">
                      {snapshot.source.text.split("\n")[0]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setArticle(snapshot.source.text)}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:border-primary-500 hover:text-primary-300 transition-colors"
                  >
                    Use this example
                  </button>
                </div>
              )}
              <label className="block">
                Article or alert text
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
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {busy && (
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                {busy ? "Analyzing…" : "Analyze source"}
              </button>
              {!snapshot.intelligenceAvailable && (
                <p role="status" className="text-sm text-text-secondary">
                  AI analysis is currently unavailable. You can still model
                  financial impact on the Model Impact page.
                </p>
              )}
            </form>
            {intelligence?.success && (
              <>
                <section className={panel}>
                  <h2 className="font-semibold">
                    {intelligence.result.eventClassification.category}
                  </h2>
                  <p>{intelligence.result.eventClassification.rationale}</p>
                  <p className="text-sm text-text-secondary">
                    Model confidence:{" "}
                    <span className="font-medium text-text-primary">
                      {(
                        intelligence.result.eventClassification.confidence * 100
                      ).toFixed(0)}
                      %
                    </span>
                  </p>
                  <p className="text-sm text-text-secondary">
                    {intelligence.result.businessRelevance.reasoning}
                  </p>
                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Entities identified
                    </h3>
                    <Provenance kind="AI INFERENCE" />
                    <div className="flex flex-wrap gap-2">
                      {intelligence.result.entities.map((entity, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-bg-secondary border border-border px-3 py-1 text-xs"
                        >
                          <span className="text-text-primary font-medium">
                            {entity.name}
                          </span>
                          <span className="text-text-tertiary ml-1">
                            · {entity.type}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Evidence from the article
                    </h3>
                    <Provenance kind="SOURCE FACT" />
                    <div className="space-y-2">
                      {intelligence.result.evidence.map((quote, i) => (
                        <blockquote
                          key={i}
                          className="border-l-2 border-primary-500 pl-3 text-sm text-text-secondary italic"
                        >
                          {quote}
                        </blockquote>
                      ))}
                    </div>
                  </div>
                  {intelligence.result.responseOptionRanking &&
                    intelligence.result.responseOptionRanking.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2">
                          AI-suggested response ranking
                        </h3>
                        <div className="space-y-2">
                          {intelligence.result.responseOptionRanking.map(
                            (rank) => {
                              const option = report.responseOptions.find(
                                (o) => o.id === rank.optionId,
                              );
                              return (
                                <div
                                  key={rank.optionId}
                                  className="rounded-lg bg-bg-secondary p-3 text-sm"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold bg-primary-600/20 text-primary-300 rounded px-1.5 py-0.5">
                                      #{rank.rank}
                                    </span>
                                    <span className="font-medium">
                                      {option?.description ?? rank.optionId}
                                    </span>
                                  </div>
                                  <p className="text-text-secondary text-xs">
                                    {rank.explanation}
                                  </p>
                                  {rank.tradeoffs && (
                                    <p className="text-text-tertiary text-xs mt-0.5">
                                      Tradeoffs: {rank.tradeoffs}
                                    </p>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}
                </section>
                <div className="flex justify-end">
                  <button
                    onClick={() => navigate("/analysis")}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 transition-colors"
                  >
                    Model the financial impact
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                </div>
              </>
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
                  Via Google News RSS · cached for up to 5 minutes
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
                        {article.domain} · {gdeltDate(article.seendate)}
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
                    <li
                      key={sig.id}
                      className="flex items-start justify-between gap-4"
                    >
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

            {!newsLoading &&
              !signalsLoading &&
              !newsError &&
              !signalsError &&
              news.length === 0 &&
              signals.length === 0 && (
                <p className="text-sm text-text-secondary">
                  No source observations are currently available. This does not
                  establish that there is no supply-chain risk.
                </p>
              )}
          </>
        )}
        {pathname === "/company" && (
          <>
            <section className={panel}>
              <h2 className="font-semibold">
                {companyName || company.name} — Products
              </h2>
              <p className="text-sm text-text-secondary">
                This uses synthetic Steel City Beverages inputs.
                "Contribution/case" is what's left after subtracting the cost to
                make each 12-can case.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-text-secondary uppercase tracking-wide">
                      {[
                        "Product",
                        "Cases/month",
                        "Selling price",
                        "Cost per case",
                        "Profit per case",
                      ].map((h) => (
                        <th className="p-2 font-medium" key={h}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {company.products.map((p) => (
                      <tr key={p.id} className="border-t border-border/40">
                        <td className="p-2 font-medium">{p.name}</td>
                        <td className="p-2">
                          {p.monthlyVolume.toLocaleString()}
                        </td>
                        <td className="p-2">{money(p.sellingPriceCents)}</td>
                        <td className="p-2">{money(p.variableCostCents)}</td>
                        <td className="p-2 text-success font-semibold">
                          {money(p.sellingPriceCents - p.variableCostCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className={panel}>
              <h2 className="font-semibold">Materials & suppliers</h2>
              <p className="text-sm text-text-secondary">
                Each material shows which supplier provides it and how much of
                the supply comes from each one. A backup supplier is listed
                where available.
              </p>
              {company.components.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg bg-bg-secondary p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{c.name}</h3>
                    <span className="text-xs text-text-secondary">
                      {money(c.unitCostCents)} per unit
                    </span>
                  </div>
                  {c.sources.map((s) => (
                    <p
                      key={s.supplierId}
                      className="text-sm text-text-secondary"
                    >
                      {s.dependencyBps / 100}% of supply from{" "}
                      <span className="text-text-primary font-medium">
                        {name(s.supplierId)}
                      </span>
                    </p>
                  ))}
                  {c.alternatives.map((a) => (
                    <p
                      key={a.supplierId}
                      className="text-sm text-text-secondary"
                    >
                      Backup:{" "}
                      <span className="text-text-primary font-medium">
                        {name(a.supplierId)}
                      </span>{" "}
                      — up to {a.capacityUnits.toLocaleString()} units
                      available, {a.premiumBps / 100}% more expensive
                    </p>
                  ))}
                </div>
              ))}
            </section>
          </>
        )}
        {pathname === "/evals" && <EvaluationReport />}
      </main>
    </div>
  );
}
