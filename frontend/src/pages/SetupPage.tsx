import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetup } from "../contexts/SetupContext";
export default function SetupPage() {
  const navigate = useNavigate();
  const { completeSetup } = useSetup();
  const [companyName, setCompanyName] = useState("");
  const [personalize, setPersonalize] = useState(false);
  return (
    <main className="landing">
      <p className="brand">MarginGuard</p>
      <h1>Know what will hit your bottom line before it does.</h1>
      <p className="landing-sub">
        MarginGuard turns external events into traceable financial impact and
        recommended actions for manufacturers.
      </p>
      <ol className="landing-flow">
        {[
          ["Detect", "External event"],
          ["Trace", "Business dependency"],
          ["Quantify", "Margin at Risk"],
          ["Decide", "Recommended action"],
        ].map(([step, description]) => (
          <li key={step}>
            <strong>{step}</strong>
            <span>{description}</span>
          </li>
        ))}
      </ol>
      <button
        className="judge-button"
        onClick={() => {
          completeSetup("demo");
          navigate("/");
        }}
      >
        Open Dashboard
      </button>
      <p className="text-sm text-text-secondary mt-4">
        Explore Steel City Beverages, a synthetic manufacturing company. No
        setup needed.
      </p>
      <button
        className="text-sm underline mt-6"
        onClick={() => setPersonalize(!personalize)}
        aria-expanded={personalize}
      >
        Personalize the demo
      </button>
      {personalize && (
        <form
          className="mt-4 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            if (companyName.trim()) {
              completeSetup("own", companyName);
              navigate("/");
            }
          }}
        >
          <label>
            Company name
            <input
              aria-label="Company name"
              className="block w-full p-3 my-3 bg-bg-secondary border border-border rounded"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={120}
              required
            />
          </label>
          <p className="text-sm text-text-secondary mb-3">
            This changes the display label only. All financial inputs remain
            synthetic; no real company data is imported.
          </p>
          <button className="judge-button">Get started</button>
        </form>
      )}
    </main>
  );
}
