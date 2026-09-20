import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";

export function JudgeDemo() {
  const { runScenario, busy } = useData();
  const navigate = useNavigate();
  const [stages, setStages] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const active = useRef(true);
  const transition = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      clearTimeout(transition.current);
    };
  }, []);
  async function run() {
    if (running || busy) return;
    clearTimeout(transition.current);
    setRunning(true);
    setStages(["Processing supplied synthetic logistics intelligence…"]);
    const result = await runScenario("logistics-15-days");
    if (!active.current) return;
    if (!result) {
      setStages([
        "Demo could not complete. Retry the demo; your last successful analysis remains available.",
      ]);
      setRunning(false);
      return;
    }
    const { report, company } = result;
    setStages([
      "✓ Synthetic source loaded; supplied classification: logistics disruption",
      `✓ ${report.affectedSuppliers.map((id) => company.suppliers.find((s) => s.id === id)?.name).join(", ")} matched`,
      `✓ ${report.affectedComponents.length} component dependencies resolved`,
      `✓ ${report.affectedProducts.length} dependent products identified`,
      "✓ Financial exposure calculated by the deterministic engine",
      `✓ ${report.responseOptions.length} responses evaluated; analysis saved`,
    ]);
    setRunning(false);
    // The work is already complete. This short pause only lets the returned
    // stage summary remain readable before navigating, and is not a timing claim.
    transition.current = setTimeout(() => {
      if (active.current) navigate("/analysis");
    }, 1200);
  }
  return (
    <section className="judge-demo">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="judge-button"
          disabled={running || busy}
          onClick={() => void run()}
        >
          Run Judge Demo
        </button>
        <span className="text-sm text-text-secondary">
          Repeatable synthetic scenario · no live news or model call required
        </span>
      </div>
      {stages.length > 0 && (
        <div className="mt-4" role="status" aria-live="polite">
          <ol className="trace-stages">
            {stages.map((stage, index) => (
              <li key={stage} style={{ animationDelay: `${index * 90}ms` }}>
                {stage}
              </li>
            ))}
          </ol>
          {!running && stages.length > 1 && (
            <button
              className="judge-button mt-4"
              onClick={() => navigate("/analysis")}
            >
              Explore financial analysis →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
