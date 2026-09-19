import { useState } from "react";
import { motion } from "framer-motion";
import type { EconomicSignal, EconomicImpact } from "../../../lib/api";
import { getEconomicImpact } from "../../../lib/api";

interface EconomicSignalsProps {
  signals: EconomicSignal[];
}

export function EconomicSignals({ signals }: EconomicSignalsProps) {
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [impact, setImpact] = useState<EconomicImpact[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleViewImpact = async (signal: EconomicSignal) => {
    if (selectedSignal === signal.id) {
      // Close if already selected
      setSelectedSignal(null);
      setImpact(null);
      return;
    }

    setSelectedSignal(signal.id);
    setLoading(true);

    try {
      const impactData = await getEconomicImpact(signal.id);
      setImpact(impactData);
    } catch (error) {
      console.error("Error fetching impact:", error);
      setImpact(null);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      default:
        return "bg-green-500/20 text-green-300 border-green-500/50";
    }
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === "increasing") return "↑";
    if (direction === "decreasing") return "↓";
    return "→";
  };

  if (signals.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Economic Indicators</h3>
        <p className="text-sm text-text-secondary">
          No economic signals available. Configure FRED API key to enable real-time commodity price monitoring.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Economic Indicators</h3>
        <p className="text-sm text-text-secondary mt-1">
          Real-time commodity prices from Federal Reserve Economic Data (FRED)
        </p>
      </div>

      <div className="space-y-3">
        {signals.map((signal) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-tertiary border border-border rounded-lg p-4 hover:border-primary-500/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-white">{signal.seriesName}</h4>
                <p className="text-xs text-text-secondary mt-1">
                  {new Date(signal.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-1 rounded border text-sm font-medium ${getSeverityColor(signal.severity)}`}
              >
                <span className="text-lg">
                  {getDirectionIcon(signal.direction)}
                </span>
                <span>{Math.abs(signal.percentageChange).toFixed(2)}%</span>
              </div>
            </div>

            <p className="mt-3 text-sm text-text-secondary">
              {signal.description}
            </p>

            {signal.affectedComponents && signal.affectedComponents.length > 0 && (
              <div className="mt-2 text-xs text-primary-400">
                Affects: {signal.affectedComponents.join(", ")}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <a
                href={signal.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-secondary hover:text-primary-400 transition-colors"
              >
                Source: FRED Series {signal.seriesId} →
              </a>

              {signal.affectedComponents && signal.affectedComponents.length > 0 && (
                <button
                  onClick={() => handleViewImpact(signal)}
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium"
                >
                  {selectedSignal === signal.id
                    ? "Hide financial impact"
                    : "View financial impact →"}
                </button>
              )}
            </div>

            {/* Financial Impact Section */}
            {selectedSignal === signal.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-border"
              >
                {loading ? (
                  <div className="text-center text-sm text-text-secondary py-4">
                    Calculating financial impact...
                  </div>
                ) : impact && impact.length > 0 ? (
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm text-primary-300">
                      Your Exposure
                    </h5>

                    {impact.map((imp) => (
                      <div
                        key={imp.componentId}
                        className="bg-bg-secondary rounded p-3 space-y-2"
                      >
                        <div className="text-sm">
                          <span className="text-text-secondary">Component:</span>{" "}
                          <span className="text-white font-medium">
                            {imp.componentName}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="text-text-secondary">Current Cost</div>
                            <div className="text-white font-medium">
                              ${(imp.currentCostCents / 100).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-text-secondary">
                              Projected Cost
                            </div>
                            <div className="text-warning font-medium">
                              ${(imp.projectedCostCents / 100).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border">
                          <div className="text-text-secondary text-xs mb-1">
                            Estimated Monthly Impact
                          </div>
                          <div className="text-error text-lg font-bold">
                            +${Math.abs(imp.monthlyImpactCents / 100).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>

                        {imp.affectedProducts && imp.affectedProducts.length > 0 && (
                          <div className="pt-2 text-xs">
                            <div className="text-text-secondary mb-1">
                              Affected Products:
                            </div>
                            <div className="space-y-1">
                              {imp.affectedProducts.map((product) => (
                                <div
                                  key={product.productId}
                                  className="flex justify-between"
                                >
                                  <span className="text-white">
                                    {product.productName}
                                  </span>
                                  <span className="text-error">
                                    +$
                                    {Math.abs(
                                      product.contributionMarginImpactCents / 100,
                                    ).toLocaleString("en-US", {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-text-secondary py-2">
                    No financial impact calculated
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
