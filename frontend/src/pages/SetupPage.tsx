import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetup } from "../contexts/SetupContext";

export default function SetupPage() {
  const navigate = useNavigate();
  const { completeSetup } = useSetup();
  const [companyName, setCompanyName] = useState("");
  const [ownStep, setOwnStep] = useState(false);

  const pickDemo = () => {
    completeSetup("demo");
    navigate("/", { replace: true });
  };

  const pickOwn = () => {
    if (!ownStep) { setOwnStep(true); return; }
    completeSetup("own", companyName);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-primary">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="text-2xl font-bold text-text-primary tracking-tight">MarginGuard</span>
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome. Let's get you set up.</h1>
          <p className="text-text-secondary">
            MarginGuard models how supplier disruptions hit your cash and profit — and shows you what to do about it.
          </p>
        </div>

        {!ownStep ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Demo card */}
            <button
              onClick={pickDemo}
              className="group text-left rounded-2xl border border-primary-600/40 bg-bg-secondary p-6 hover:border-primary-500 hover:bg-bg-tertiary transition-all"
            >
              <div className="h-11 w-11 rounded-xl bg-primary-600/15 border border-primary-600/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Try the demo</h2>
              <p className="text-sm text-text-secondary mb-4">
                Explore with Steel City Beverages — a pre-built beverage company with 3 products, 4 suppliers, and a realistic disruption already modeled.
              </p>
              <div className="space-y-1.5 mb-5">
                {["Everything pre-loaded — no setup needed", "See real financial calculations instantly", "Best way to understand the app first"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                    <svg className="w-3.5 h-3.5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white group-hover:bg-primary-500 transition-colors">
                Use the demo
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>

            {/* Own data card */}
            <button
              onClick={pickOwn}
              className="group text-left rounded-2xl border border-border bg-bg-secondary p-6 hover:border-primary-600/40 hover:bg-bg-tertiary transition-all"
            >
              <div className="h-11 w-11 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Use my company</h2>
              <p className="text-sm text-text-secondary mb-4">
                Enter your company name to label the model with your own data. The financial structure uses the demo as a template — full data import coming soon.
              </p>
              <div className="space-y-1.5 mb-5">
                {["Your company name throughout the app", "Same financial calculations, your label", "Swap in real products & suppliers later"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                    <svg className="w-3.5 h-3.5 text-text-tertiary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary group-hover:border-primary-600/40 transition-colors">
                Enter my company name
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        ) : (
          /* Own data — company name step */
          <div className="rounded-2xl border border-primary-600/40 bg-bg-secondary p-8 max-w-md mx-auto">
            <button
              onClick={() => setOwnStep(false)}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Back
            </button>
            <h2 className="text-xl font-semibold text-text-primary mb-1">What's your company called?</h2>
            <p className="text-sm text-text-secondary mb-6">
              This name will appear throughout the app wherever you see "Steel City Beverages."
            </p>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Acme Manufacturing"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && companyName.trim() && pickOwn()}
              className="w-full rounded-lg border border-border bg-bg-tertiary px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none mb-4"
            />
            <button
              onClick={pickOwn}
              disabled={!companyName.trim()}
              className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-40 transition-colors"
            >
              Get started
            </button>
          </div>
        )}

        <p className="text-center text-xs text-text-tertiary mt-6">
          You can switch between demo and your own data at any time from the dashboard.
        </p>
      </div>
    </div>
  );
}
