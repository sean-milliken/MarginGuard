# MarginGuard judge walkthrough

MarginGuard turns external events into traceable financial impact and recommended actions for manufacturers.

## Start locally

From the repository root, run `npm ci`, `npm run build:demo`, then `npm start`. Open http://127.0.0.1:3001 and choose **Try the demo**. For development with automatic reload, use `npm run dev` and http://127.0.0.1:5173 instead. Stop the active server with Ctrl+C before starting another on the same port.

## Two-minute walkthrough

1. Choose **Run Judge Demo**. The application loads the supplied synthetic freight brief, resolves dependencies, runs the existing financial engine, and persists the analysis through the existing API. Returned stage results appear briefly before opening Model Impact. This offline fixture does not claim a live Nemotron inference or model confidence.
2. The default 15-day disruption shows **$276,000 contribution margin at risk** across 40,000 cases. Open **How was this calculated?** to inspect the engine's formulas, integer-cent amounts, rounding and aggregation.
3. Inspect **Source Evidence** and the Event → Supplier → Component → Product → Financial Impact chain. The company and brief are synthetic. Source facts, AI inference and deterministic calculations have distinct labels.
4. Move **Disruption duration** to 30 days: contribution margin at risk becomes $552,000. Move **Supplier dependency** to 40%: it becomes $276,000. These are fresh calls to the same pure financial engine used by the API, not frontend approximations or model calls.
5. Open **What would change our recommendation?** to see sampled boundary brackets. Raising **Additional response cost** above the recovery benefit makes **Take no action** preferable. Click **Reset assumptions**, or rerun Judge Demo, to restore the supplied baseline.
6. Return to Dashboard and choose **No exposure · competitor appoints CEO**. The same scenario endpoint, finance engine and persistence path return zero affected units, zero exposure, and no action required. To test actual model classification of this source, open News Analysis, use the scenario example, and analyze it with a configured NVIDIA key.
7. Open **AI Accuracy**. It shows the actual labeled dataset composition. Load a genuine `nemotron/eval-results.json` to see measured metrics and inspect incorrect predictions. No measured scores are supplied in this repository because no NVIDIA key was available during implementation.

## Real Nemotron evaluation

Set `NVIDIA_API_KEY` in the root `.env` (never commit it) or export it in your shell. Run `npm run eval:nemotron`. The existing harness calls NVIDIA for each labeled example and writes `nemotron/eval-results.json`, which is ignored by Git. Load that file on AI Accuracy. The viewer validates the format and dataset IDs and recomputes metrics from predictions rather than trusting saved percentage claims. The harness now retains expected labels and source excerpts alongside each prediction/failure.

Classification denominators include failed inferences. Relevance precision/recall/F1 use successful cases with business context. Entity precision/recall are macro-averaged across successful cases containing entities, with F1 computed from those averages. Schema validity measures the first attempt before correction. There is no implemented keyword baseline, and no baseline score is claimed.

## Model boundaries

- Monetary outputs use the existing BigInt/integer-cent financial engine; model outputs never become financial results. Normal article classification remains qualitative until explicit scenario inputs are selected.
- What-if values are local, unsaved assumptions. The advanced inputs and saved response details remain separately labeled. A new scenario or Judge Demo resets local what-if state.
- The engine models one month. Duration searches stay between 1 and the company's days-in-month, premium searches within 0–50%, and added response costs within an exposure-based bounded range. Searches change one variable at a time and report brackets at the displayed resolution, not exact analytical roots. A null boundary means no change was found in the sampled range.
- Dependency changes rebalance existing other sources proportionally and never invent a supplier relationship. Sole-source dependencies remain 100%. The premium and additional fixed cost apply to each independent alternate response; existing capacity and shipping costs still apply.
- No new infrastructure, sponsor integrations, authentication systems, or model providers were added. Live news/FRED/NVIDIA remain optional. Persistence failure is shown as a retryable error rather than reported as a successful saved analysis.

## Verification

Run `npm run check` for production builds and unit/integration tests, and `npm run test:e2e` for browser tests (requires Playwright Chromium). Use `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` when using an installed Chrome browser. Browser tests cover repeatable Judge Mode, real recalculation, changed recommendations, source/formula inspection, zero exposure, persistence recovery, and honest evaluation rendering.
