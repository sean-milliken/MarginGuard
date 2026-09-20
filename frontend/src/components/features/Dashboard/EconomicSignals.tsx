import { useRef, useState } from "react";
import type { EconomicSignal, EconomicImpact } from "../../../lib/api";
import { getEconomicImpact } from "../../../lib/api";

export function EconomicSignals({ signals }: { signals: EconomicSignal[] }) {
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [impact, setImpact] = useState<EconomicImpact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  async function load(signal: EconomicSignal, retry = false) {
    const version = ++requestVersion.current;
    setError(null);
    setImpact([]);
    if (selectedSignal === signal.id && !retry) {
      setSelectedSignal(null);
      setLoading(false);
      return;
    }
    setSelectedSignal(signal.id);
    setLoading(true);
    try {
      const result = await getEconomicImpact(signal.id);
      if (version === requestVersion.current) setImpact(result);
    } catch (error) {
      if (version === requestVersion.current)
        setError(
          error instanceof Error
            ? error.message
            : "Unable to calculate this economic impact.",
        );
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }
  const money = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  return (
    <section className="bg-bg-secondary border border-border rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold">Economic Indicators</h2>
      <p className="text-sm text-text-secondary">
        Latest published economic observations from FRED. Index changes are
        modeled against the synthetic company's component costs.
      </p>
      {signals.length === 0 && <p>No observations are available.</p>}
      {signals.map((signal) => (
        <article
          key={signal.id}
          className="bg-bg-tertiary border border-border rounded-lg p-4 space-y-3"
        >
          <div className="flex justify-between gap-4">
            <div>
              <h3 className="font-medium">{signal.seriesName}</h3>
              <p className="text-xs text-text-secondary">
                Observation date: {signal.date}
              </p>
            </div>
            <span>
              {signal.percentageChange > 0 ? "+" : ""}
              {signal.percentageChange.toFixed(2)}% · {signal.severity}
            </span>
          </div>
          <p className="text-sm text-text-secondary">{signal.description}</p>
          <div className="flex justify-between gap-4">
            <a
              href={signal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-300 underline"
            >
              Source: FRED {signal.seriesId}
            </a>
            {Boolean(signal.affectedComponents?.length) && (
              <button
                className="text-sm text-primary-300"
                onClick={() => void load(signal)}
              >
                {selectedSignal === signal.id
                  ? "Hide financial impact"
                  : "View financial impact"}
              </button>
            )}
          </div>
          {selectedSignal === signal.id && (
            <div className="border-t border-border pt-4 space-y-3">
              {loading && <p role="status">Calculating financial impact…</p>}
              {error && (
                <div role="alert">
                  {error}{" "}
                  <button
                    className="underline"
                    onClick={() => void load(signal, true)}
                  >
                    Retry impact
                  </button>
                </div>
              )}
              {!loading && !error && impact.length === 0 && (
                <p>No mapped component impact is available.</p>
              )}
              {!loading &&
                !error &&
                impact.map((item) => (
                  <div
                    key={item.componentId}
                    className="bg-bg-secondary rounded-lg p-4 space-y-2"
                  >
                    <h4>{item.componentName}</h4>
                    <p className="text-sm">
                      Current cost: {money(item.currentCostCents)} · Modeled
                      cost: {money(item.projectedCostCents)}
                    </p>
                    <p className="text-sm text-text-secondary">
                      Monthly cost change
                    </p>
                    <p
                      className={`text-xl font-semibold ${item.monthlyImpactCents > 0 ? "text-error" : item.monthlyImpactCents < 0 ? "text-success" : ""}`}
                    >
                      {item.monthlyImpactCents > 0 ? "+" : ""}
                      {money(item.monthlyImpactCents)}
                    </p>
                    <p className="text-sm">
                      {item.monthlyImpactCents < 0
                        ? "Lower costs increase contribution."
                        : item.monthlyImpactCents > 0
                          ? "Higher costs reduce contribution."
                          : "No change at the model’s whole-cent unit-cost precision."}
                    </p>
                    {item.affectedProducts.map((product) => (
                      <p className="text-sm" key={product.productId}>
                        {product.productName}:{" "}
                        {money(-product.contributionMarginImpactCents)}{" "}
                        contribution change
                      </p>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
