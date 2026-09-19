# MarginGuard integrated application

This branch combines backend setup (already in main), the UI, the deterministic financial engine, and the Nemotron intelligence subsystem. The default application is a synthetic Steel City Beverages logistics demo. Financial results are computed by the server, not loaded from the old UI mock datasets.

## Local launch

Requires Node.js 24+ and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The frontend proxies `/api` to the local Node server on port 3001. The development launcher explicitly enables demo authentication. No AWS account or NVIDIA key is required to use the financial scenarios. If you sign out, any email and password can re-enter the local demo.

For a built, single-process local demo:

```sh
npm run build:demo
npm start
```

Open http://127.0.0.1:3001. `build:demo` explicitly selects demo auth; normal deployment builds require Cognito configuration. Both local servers bind to loopback by default. This unauthenticated local API is for the hackathon demo, not public hosting. Local analysis history is an in-memory cache of the most recent 100 runs and resets on restart.

## Walkthrough

1. Dashboard: inspect the default 15-day logistics disruption ($648,000 revenue and $276,000 contribution at risk).
2. Switch among 7-, 15-, and 30-day scenarios. The UI calls the API and replaces the report with calculated results.
3. Simulate Event / Analysis: choose the disrupted supplier, duration, and unavailable-delivery percentage. Zero disruption produces zero exposure. Read the supplier → component → product path and calculation steps.
4. Responses: compare doing nothing with capacity-limited alternate supply. For the default event, extra cost is $19,500 and net benefit is $187,500. No procurement actions are executed.
5. Company: inspect monthly volumes, prices, variable costs, supplier dependencies, alternate premiums, and shipping costs.
6. Sources: inspect the explicitly labeled synthetic scenario brief.
7. Intelligence: submit source text for Nemotron classification, entities, evidence, and qualitative option rankings when configured. This never changes the financial report or its numeric assumptions.
8. Evals: explains how to run the existing evaluation harness; no invented evaluation scores are shown.

## Nemotron configuration

Copy `.env.example` to `.env` in the repository root and set `NVIDIA_API_KEY` locally. Restart the Node API. Optionally set `NVIDIA_NEMOTRON_MODEL`. Never put credentials into frontend `VITE_` variables or commit `.env`.

Only clicking **Analyze source** sends the submitted article and qualitative business/response descriptions to NVIDIA. The application calls the existing `analyzeArticle` subsystem. Two bounded attempts (initial and schema correction, each with a 10-second transport timeout) fit the API request window; automatic SDK retries are disabled. The standalone evaluation harness retains its explicit transport retries.

Model evidence must be an exact substring of the submitted text, and option rankings must use known, unique options. Invalid or unavailable model output is reported as an error, never replaced with fabricated intelligence. Live NVIDIA inference and measured eval scores require a working key; the automated integration suite injects a controlled analyzer instead of making paid API calls.

## FRED economic data integration

MarginGuard integrates real-time commodity price data from the Federal Reserve Economic Data (FRED) API as the first real external data source. FRED commodity signals are connected to Steel City Beverages' supply chain to demonstrate deterministic financial impact calculations.

**Setup:**

1. Obtain a free FRED API key: https://fred.stlouisfed.org/docs/api/api_key.html
2. Copy `.env.example` to `.env` in the repository root and set `FRED_API_KEY`
3. Restart the Node API

The dashboard will display real-time economic signals when FRED is configured. All financial impact calculations are deterministic and never involve LLM inference.

**FRED series monitored:**

- **PCU331315331315**: Aluminum sheet, plate & foil PPI → affects aluminum can component
- **PPIACO**: Producer Price Index: All Commodities → general commodity pressure
- **PCU322121322121**: Corrugated & solid fiber boxes PPI → affects corrugated case component  
- **WPU01170301**: Industrial electric power PPI → affects all production (indirect)

Each signal shows month-over-month percentage change, severity level (low/medium/high/critical), and deterministic financial impact on Steel City Beverages' components, suppliers, and products. Observations are cached in DynamoDB with 7-day TTL. Source transparency is preserved - every signal includes the original FRED series link.

FRED integration is optional. Without a configured API key, the application continues to function with all synthetic scenario analysis features intact.

## API contract

`shared/src/application.ts` defines the frontend/backend report contract. `backend/app/src/service.ts` validates JSON input using Zod and invokes the pure financial engine. The same request router is used by the local server and Lambda.

| Method | Path (local prefix `/api`) | Result |
| --- | --- | --- |
| GET | `/health` | Service status |
| GET | `/dashboard` | Company, scenarios, selected event, computed report, source and model availability |
| GET | `/companies/steel-city-beverages` | Explicit synthetic manufacturing inputs |
| GET | `/events`, `/events/{id}` | Scenario events |
| GET | `/scenarios` | Supported logistics scenarios |
| GET | `/sources` | Synthetic brief |
| POST | `/analyses` | Validate inputs, calculate, save and return `{analysisId, companyId, createdAt, snapshot}` |
| GET | `/analyses/{id}` | Saved analysis or 404 |
| POST | `/scenarios/{id}/run` | Calculate a named scenario |
| POST | `/intelligence` | Qualitative Nemotron outcome |
| GET | `/fred/series` | List configured FRED series with latest observations |
| GET | `/fred/series/{id}` | Get specific FRED series with historical observations |
| GET | `/fred/signals` | Current economic signals with severity and percentage changes |
| GET | `/fred/impact/{signalId}` | Deterministic financial impact on Steel City Beverages |

Example analysis body: `{"scenarioId":"logistics-15-days"}`. `/analyses` also accepts an explicit `event`, optional complete `company`, and optional demo `companyId`. Unknown fields and invalid references are rejected. Intelligence body: `{"articleText":"...at least 20 characters...","analysis":{"scenarioId":"logistics-15-days"}}`.

Money in the API uses integer cents. The UI converts to dollars only for display. The financial engine's README documents proportional component allocation, rounding, and same-month cash assumptions. This version models logistics disruption, not commodity price changes, dynamic inventory, or combined procurement optimization. The old UI scenario files and Python analysis placeholders are retained as historical source but are not on the application execution path.

## AWS integration

The CDK stack now routes company/event reads and scenario/analysis operations to a bundled Node.js 24 Lambda. The existing S3 upload endpoint and storage resources are preserved. Analysis records use the existing DynamoDB analysis table. All application routes require Cognito JWTs; `/health` remains public. Frontend requests include the Cognito ID token, and existing sessions are restored on reload. This is one shared hackathon company workspace, not a tenant-isolated service.

Build the application bundle before synthesizing or deploying:

```sh
npm ci
npm run build
npm exec -w infra -- cdk synth --no-lookups
```

With the intended AWS account and deployment permissions configured, use the existing deployment workflow. `infra/deploy-infra.sh` now installs from the root lockfile and builds the Node bundle before deployment. The stack's Amplify build likewise installs root workspaces. `frontend/setup-dev.sh` obtains Cognito and API values from the stack for a normal frontend deployment build; mock mode must remain false.

To enable Nemotron in AWS, create/manage a Secrets Manager secret outside the repository containing either the key string or JSON with `NVIDIA_API_KEY`, and pass its **complete ARN** as CDK context `nemotronSecretArn`. The Lambda gets read access to that secret only and loads it server-side. No key is embedded in the frontend, CDK template, or source. If the secret is missing/unreadable, financial analysis still works and the model is shown as unavailable.

To enable FRED in AWS, create/manage a Secrets Manager secret containing JSON with `FRED_API_KEY`:

```sh
aws secretsmanager create-secret \
  --name marginguard-fred-api-key \
  --secret-string '{"FRED_API_KEY":"your-key-here"}'
```

Deploy with CDK context `fredSecretArn`:

```sh
cdk deploy --context fredSecretArn=arn:aws:secretsmanager:REGION:ACCOUNT:secret:marginguard-fred-api-key
```

The Lambda gets read access to the secret and loads it server-side. FRED observations are cached in the `MarginGuardEconomicData` DynamoDB table with 7-day TTL. If the secret is missing or FRED is unavailable, the application continues to work with all synthetic scenarios intact.

Deploying changes is a separate operation. Local builds, template assertions, and browser tests do not constitute a live AWS deployment or a successful live NVIDIA call.

## Verification

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

If Chrome is already installed, use `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`. Browser tests start and stop the local app automatically and cover real API financial recalculation, route navigation/refresh, API failure/retry, and logout/sign-in. Unit tests cover 13 financial scenarios/formulas, 21 Nemotron schema/metric cases, and API/model-boundary/persistence/cloud-routing behavior.

Do not publish a demo-auth build to the protected AWS deployment. `npm run build:demo` exists specifically for a local, offline-capable hackathon presentation.
