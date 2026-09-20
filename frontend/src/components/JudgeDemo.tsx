import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";

export function JudgeDemo({ compact = false }: { compact?: boolean }) {
  const { runScenario, busy } = useData();
  const navigate = useNavigate();
  const [stages, setStages] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function run() {
    if (running || busy) return;
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
    const { report } = result;
    setStages([
      `Analysis saved · ${report.affectedSuppliers.length} suppliers matched · ${report.responseOptions.length} responses compared.`,
    ]);
    setRunning(false);
    navigate("/analysis");
  }
  return (
    <section className={compact ? "judge-demo-compact" : "judge-demo"}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="judge-button"
          disabled={running || busy}
          onClick={() => void run()}
        >
          Run Judge Demo
        </button>
        <span className={compact ? "sr-only" : "text-sm text-text-secondary"}>
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
