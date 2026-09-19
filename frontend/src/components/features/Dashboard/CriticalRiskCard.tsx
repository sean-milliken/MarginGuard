import React from "react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "../../utility/AnimatedNumber";
import { Tilt3D } from "../../utility/Tilt3D";
import type { ExternalEvent, Scenario } from "../../../types/mock";

interface CriticalRiskCardProps {
  event: ExternalEvent;
  scenario: Scenario;
  delay?: number;
  onAnalyze?: () => void;
}

export const CriticalRiskCard: React.FC<CriticalRiskCardProps> = ({
  event,
  scenario,
  delay = 0,
  onAnalyze,
}) => {
  const timeAgo = "Synthetic scenario";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Tilt3D tiltMax={6} scale={1.01} perspective={1000}>
        <div
          className="relative overflow-hidden rounded-2xl border border-error/30 bg-gradient-to-br from-bg-tertiary to-bg-secondary"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Animated top bar */}
          <motion.div
            className="absolute top-0 left-0 h-1 w-full bg-error"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Glass inner reflection */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, transparent 40%, rgba(239,68,68,0.02) 100%)",
            }}
          />

          <div className="p-6">
            {/* Header row */}
            <div
              className="flex items-start justify-between mb-4"
              style={{ transform: "translateZ(15px)" }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-error-bg border border-error/20"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    boxShadow:
                      "0 0 20px rgba(239,68,68,0.15), 0 4px 12px rgba(0,0,0,0.3)",
                  }}
                >
                  <svg
                    className="w-5 h-5 text-error"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-error">
                      Scenario Exposure
                    </span>
                    <span className="relative inline-flex h-2 w-2">
                      <motion.span
                        className="absolute inline-flex h-full w-full rounded-full bg-error"
                        animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-error" />
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{timeAgo}</p>
                </div>
              </div>

              <motion.span
                className="rounded-full bg-error-bg border border-error/20 px-3 py-1 text-xs font-semibold text-error"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ boxShadow: "0 0 15px rgba(239,68,68,0.1)" }}
              >
                {event.severity}
              </motion.span>
            </div>

            {/* Title & summary */}
            <div style={{ transform: "translateZ(20px)" }}>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {event.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                {scenario.summary}
              </p>
            </div>

            {/* 3 Metric boxes - float forward */}
            <div
              className="grid grid-cols-3 gap-4 mb-5"
              style={{ transform: "translateZ(25px)" }}
            >
              <div
                className="rounded-lg bg-bg-primary/60 border border-error/10 p-3 backdrop-blur-sm"
                style={{
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">
                  Margin at Risk
                </p>
                <AnimatedNumber
                  value={scenario.financialImpact.marginAtRisk}
                  format="currency"
                  decimals={0}
                  className="text-xl font-bold text-error"
                  duration={1600}
                />
              </div>
              <div
                className="rounded-lg bg-bg-primary/60 border border-error/10 p-3 backdrop-blur-sm"
                style={{
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">
                  Revenue Exposed
                </p>
                <AnimatedNumber
                  value={scenario.financialImpact.revenueAtRisk}
                  format="currency"
                  decimals={0}
                  className="text-xl font-bold text-text-primary"
                  duration={1600}
                />
              </div>
              <div
                className="rounded-lg bg-bg-primary/60 border border-error/10 p-3 backdrop-blur-sm"
                style={{
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">
                  Time Horizon
                </p>
                <div className="flex items-baseline gap-1">
                  <AnimatedNumber
                    value={scenario.financialImpact.timeHorizon}
                    format="number"
                    className="text-xl font-bold text-text-primary"
                    duration={1000}
                  />
                  <span className="text-sm text-text-tertiary">days</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between"
              style={{ transform: "translateZ(15px)" }}
            >
              <div className="flex items-center gap-3 text-xs text-text-tertiary">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  {Math.round(scenario.financialImpact.confidence * 100)}%
                  confidence
                </span>
                <span className="text-border">|</span>
                <span>
                  {scenario.impactedProducts.length} products affected
                </span>
                <span className="text-border">|</span>
                <span>{event.affectedEntity}</span>
              </div>

              <motion.button
                onClick={onAnalyze}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white"
                whileHover={{
                  scale: 1.05,
                  boxShadow:
                    "0 8px 30px rgba(3,105,161,0.5), 0 0 20px rgba(3,105,161,0.2)",
                }}
                whileTap={{ scale: 0.95 }}
                style={{ boxShadow: "0 4px 15px rgba(3,105,161,0.3)" }}
              >
                Analyze Impact
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
              </motion.button>
            </div>
          </div>

          {/* Ambient glow orbs */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-error/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-primary-500/5 blur-3xl" />
          <motion.div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full blur-3xl"
            animate={{ opacity: [0.02, 0.05, 0.02], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(circle, rgba(239,68,68,0.08), transparent 70%)",
            }}
          />
        </div>
      </Tilt3D>
    </motion.div>
  );
};
