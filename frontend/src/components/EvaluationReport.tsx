import { useState } from "react";
import { EVAL_DATASET } from "../../../nemotron/src/eval/dataset";
import {
  EvalResultsSchema,
  type EvalResults,
} from "../../../nemotron/src/schemas/eval";
import { calculateMetrics } from "../../../nemotron/src/eval/metrics";

export function EvaluationReport() {
  const [report, setReport] = useState<EvalResults | null>(null);
  const [error, setError] = useState("");
  const distribution = EVAL_DATASET.reduce<Record<string, number>>(
    (counts, item) => {
      counts[item.groundTruth.eventCategory] =
        (counts[item.groundTruth.eventCategory] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const metrics = report
    ? calculateMetrics(report.results, EVAL_DATASET)
    : null;
  const failures =
    report?.results.filter((result) => {
      const truth = EVAL_DATASET.find((item) => item.id === result.id)!;
      return (
        !result.success ||
        result.predicted?.eventClassification.category !==
          truth.groundTruth.eventCategory ||
        (truth.businessContext &&
          result.predicted?.businessRelevance.isRelevant !==
            truth.groundTruth.isRelevant)
      );
    }) ?? [];
  return (
    <section className="judge-panel space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Nemotron evaluation</h2>
        <p>{EVAL_DATASET.length} labeled examples in the evaluation dataset</p>
      </div>
      <div className="grid sm:grid-cols-4 gap-3">
        {Object.entries(distribution).map(([category, count]) => (
          <div key={category} className="judge-metric">
            <strong>{count}</strong>
            <p>{category.replace(/_/g, " ")}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-text-secondary">
        Load the JSON produced by <code>npm run eval:nemotron</code>. Metrics
        are recomputed from recorded predictions and repository labels. No
        keyword baseline is implemented.
      </p>
      <label className="block">
        Load evaluation results{" "}
        <input
          className="block mt-2"
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError("");
            setReport(null);
            try {
              if (file.size > 5_000_000)
                throw new Error("Choose a results file smaller than 5 MB.");
              const parsed = EvalResultsSchema.parse(
                JSON.parse(await file.text()),
              );
              if (
                !parsed.results.length ||
                parsed.results.some(
                  (result) => result.success && !result.predicted,
                )
              )
                throw new Error("Results must include recorded predictions.");
              const ids = parsed.results.map((r) => r.id);
              if (
                new Set(ids).size !== ids.length ||
                ids.some((id) => !EVAL_DATASET.some((item) => item.id === id))
              )
                throw new Error(
                  "Results must contain unique IDs from this evaluation dataset.",
                );
              setReport(parsed);
            } catch {
              setError(
                "Could not load results. Use valid harness JSON with unique IDs from the current dataset (maximum 5 MB).",
              );
            }
          }}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      {!report && (
        <p>
          No measured run loaded. Confidence on an individual prediction is not
          evaluation accuracy.
        </p>
      )}
      {report && metrics && (
        <>
          <p>
            {report.modelId} · {new Date(report.runTimestamp).toLocaleString()}{" "}
            · {metrics.totalExamples} recorded cases,{" "}
            {metrics.successfulInferences} successful inferences
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              ["Classification accuracy", metrics.classificationAccuracy],
              ["Relevance precision", metrics.relevancePrecision],
              ["Relevance recall", metrics.relevanceRecall],
              ["Relevance F1", metrics.relevanceF1],
              ["Entity precision", metrics.entityPrecision],
              ["Entity recall", metrics.entityRecall],
              ["Entity F1", metrics.entityF1],
              [
                "First-attempt schema validity",
                metrics.structuredOutputValidityRate,
              ],
            ].map(([label, value]) => (
              <div className="judge-metric" key={label}>
                <p>{label}</p>
                <strong>{(Number(value) * 100).toFixed(1)}%</strong>
              </div>
            ))}
          </div>
          <p className="text-sm text-text-secondary">
            Classification includes failed inferences. Relevance uses{" "}
            {metrics.relevanceExamples} successful cases with business context;
            entity metrics macro-average successful cases with entities.
            Undefined precision/recall is reported as zero. Schema validity is
            before correction.
          </p>
          <details open>
            <summary>Inspect Errors ({failures.length})</summary>
            {!failures.length && (
              <p>No classification or relevance errors in this loaded run.</p>
            )}
            {failures.map((result) => {
              const item = EVAL_DATASET.find((item) => item.id === result.id)!;
              return (
                <article key={result.id} className="judge-panel mt-3">
                  <h3>{result.id}</h3>
                  <p>
                    Expected: {item.groundTruth.eventCategory} · relevant:{" "}
                    {String(item.groundTruth.isRelevant)}
                  </p>
                  <p>
                    Predicted:{" "}
                    {result.predicted?.eventClassification.category ??
                      "Inference failed"}{" "}
                    · relevant:{" "}
                    {String(
                      result.predicted?.businessRelevance.isRelevant ??
                        "unavailable",
                    )}
                  </p>
                  <blockquote>{item.articleText.slice(0, 450)}…</blockquote>
                  <p>
                    {result.error ??
                      result.predicted?.eventClassification.rationale}
                  </p>
                </article>
              );
            })}
          </details>
        </>
      )}
    </section>
  );
}
