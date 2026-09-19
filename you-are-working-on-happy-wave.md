# FRED Economic Data Integration Plan

## Context

MarginGuard is an early-warning business intelligence system for manufacturers. The product flow is:

**Real-world external data → Economic/event signal → Company exposure → Deterministic financial impact → Response options → Recommendation**

FRED (Federal Reserve Economic Data) will be the **first real external data source** integrated into the system. This integration will connect real commodity price data to Steel City Beverages' synthetic supply chain to demonstrate how external economic signals translate into deterministic financial impacts.

**Key Constraint**: This is NOT a generic economics dashboard. FRED data must feed into MarginGuard's existing business-risk workflow, specifically connecting to Steel City Beverages' components, suppliers, and products.

## Architecture Decisions

### 1. Module Structure
Create `backend/app/src/fred/` module following existing patterns:
```
backend/app/src/fred/
├── types.ts          # Domain types: EconomicObservation, EconomicSeries, EconomicSignal, EconomicImpact
├── config.ts         # Series configuration with allowlist (security boundary)
├── client.ts         # FRED API client with retry/timeout/error handling
├── cache.ts          # DynamoDB cache layer using store pattern
├── signals.ts        # Deterministic signal detection (percentageChange, severity)
├── impact.ts         # Component mapping & financial impact calculations (BigInt)
└── test/             # Unit tests for calculations and error handling
```

### 2. DynamoDB Caching Strategy
**New table**: `MarginGuardEconomicData`
- Partition Key: `seriesId` (STRING) - e.g., "PCU331315331315"
- Sort Key: `date` (STRING) - ISO date "YYYY-MM-DD"  
- Attributes: `value` (NUMBER), `cachedAt` (STRING), `units` (STRING), `title` (STRING)
- TTL: `expiresAt` (7 days for observations)
- GSI: `seriesId-cachedAt-index` for latest lookups

**Rationale**: FRED data has different access patterns than analyses. Separate table enables independent TTL policies and future multi-source expansion.

### 3. Security Architecture
- **FRED_API_KEY**: Secrets Manager only, never committed or exposed to frontend
- **Series allowlist**: Configuration-driven in `config.ts` - no arbitrary proxy
- **Backend-only**: All FRED communication happens in Lambda, frontend never sees API key
- **Authentication**: All `/fred/*` endpoints require existing Cognito JWT authorizer

## FRED Series Selection

Based on Steel City Beverages components (aluminum cans, beverage base, corrugated cases), selected **4 real FRED series**:

| Series ID | Name | Maps To | Rationale |
|-----------|------|---------|-----------|
| **PCU331315331315** | PPI: Aluminum sheet, plate & foil | Aluminum can component | Direct input cost for cans (80% Allegheny, 20% Great Lakes) |
| **PPIACO** | Producer Price Index: All Commodities | All components (baseline) | General commodity pressure indicator |
| **PCU322121322121** | PPI: Corrugated & solid fiber boxes | Corrugated case component | Direct input cost for 12-can cases |
| **WPU01170301** | PPI: Industrial electric power | All (indirect) | Energy cost affecting all production |

Configuration structure in `backend/app/src/fred/config.ts`:
```typescript
export const FRED_SERIES_CONFIG: FredSeriesConfig[] = [
  {
    id: "PCU331315331315",
    name: "Aluminum Sheet, Plate & Foil PPI",
    category: "commodity",
    units: "Index Dec 1984=100",
    frequency: "monthly",
    componentMapping: {
      componentId: "can",  // Maps to existing Steel City component
      impactType: "direct-cost"
    },
    description: "Producer price index for aluminum products"
  },
  // ... other series
];
```

## Domain Types

**New types** in `backend/app/src/fred/types.ts`:

```typescript
// Normalized FRED observation in domain model
export interface EconomicObservation {
  seriesId: string;
  date: string;              // ISO date "YYYY-MM-DD"
  value: number | null;      // null if FRED returns "." (missing)
  cachedAt: string;          // ISO timestamp
}

// Series metadata
export interface EconomicSeries {
  id: string;
  title: string;
  units: string;
  frequency: string;
  lastUpdated: string;
  observations: EconomicObservation[];
  source: "FRED";
  sourceUrl: string;         // https://fred.stlouisfed.org/series/{id}
}

// Calculated economic signal with deterministic severity
export interface EconomicSignal {
  id: string;                              // `${seriesId}-${date}`
  seriesId: string;
  seriesName: string;
  date: string;
  currentValue: number;
  previousValue: number;
  absoluteChange: number;                  // current - previous
  percentageChange: number;                // (change / previous) * 100
  direction: "increasing" | "decreasing" | "stable";
  severity: "low" | "medium" | "high" | "critical";
  units: string;
  affectedComponents?: string[];           // Component IDs from config mapping
  calculationSteps: CalculationStep[];     // Reuse existing type from financial engine
  source: "FRED";
  sourceUrl: string;
}

// Financial impact from signal mapped to component
export interface EconomicImpact {
  signalId: string;
  componentId: string;
  componentName: string;
  currentCostCents: number;
  projectedCostCents: number;              // Deterministic: current * (1 + percentageChange/100)
  costIncreaseCents: number;
  monthlyVolumeAffected: number;           // Sum across all products using component
  monthlyImpactCents: number;              // volume * costIncrease
  affectedProducts: {
    productId: string;
    monthlyVolume: number;
    contributionMarginImpactCents: number;
  }[];
  calculationSteps: CalculationStep[];
}
```

## Deterministic Calculations

### Signal Detection (`backend/app/src/fred/signals.ts`)
```typescript
// Severity thresholds (configuration, not magic numbers)
const SEVERITY_THRESHOLDS = {
  low: 2,        // < 2% change
  medium: 5,     // 2-5% change  
  high: 10,      // 5-10% change
  critical: 10   // > 10% change
};

function calculateSignal(
  current: EconomicObservation,
  previous: EconomicObservation,
  config: FredSeriesConfig
): EconomicSignal {
  // Pure calculation - no model, no network, no random
  const absoluteChange = current.value! - previous.value!;
  const percentageChange = (absoluteChange / previous.value!) * 100;
  
  const severity = 
    Math.abs(percentageChange) >= SEVERITY_THRESHOLDS.critical ? "critical" :
    Math.abs(percentageChange) >= SEVERITY_THRESHOLDS.high ? "high" :
    Math.abs(percentageChange) >= SEVERITY_THRESHOLDS.medium ? "medium" : "low";
  
  const direction = 
    Math.abs(percentageChange) < 0.1 ? "stable" :
    percentageChange > 0 ? "increasing" : "decreasing";
  
  const calculationSteps: CalculationStep[] = [
    {
      formula: `absoluteChange = ${current.value} - ${previous.value}`,
      result: absoluteChange,
      unit: "index points"
    },
    {
      formula: `percentageChange = (${absoluteChange} / ${previous.value}) × 100`,
      result: percentageChange,
      unit: "percent"
    }
  ];
  
  return { /* ... full signal object */ };
}
```

### Financial Impact (`backend/app/src/fred/impact.ts`)
**Follow existing financial engine patterns**: BigInt calculations, `safe()` conversion, `sum()` and `mul()` helpers.

```typescript
function calculateComponentImpact(
  signal: EconomicSignal,
  component: Component,
  company: Company
): EconomicImpact {
  // Apply percentage change to component cost using BigInt (match financial engine pattern)
  const currentCostCents = component.unitCostCents;
  const costChangeMultiplier = BigInt(Math.round(signal.percentageChange * 100)); // Basis points
  const projectedCostCents = safe(
    (BigInt(currentCostCents) * (10000n + costChangeMultiplier)) / 10000n
  );
  const costIncreaseCents = projectedCostCents - currentCostCents;
  
  // Calculate monthly volume affected: sum across all products using this component
  const monthlyVolume = sum(
    company.products.map(p => 
      mul(
        p.monthlyVolume,
        p.billOfMaterials.find(b => b.componentId === component.id)?.unitsPerProduct ?? 0
      )
    )
  );
  
  const monthlyImpactCents = mul(monthlyVolume, costIncreaseCents);
  
  // Calculate per-product contribution margin impact
  const affectedProducts = company.products
    .filter(p => p.billOfMaterials.some(b => b.componentId === component.id))
    .map(p => {
      const unitsPerProduct = p.billOfMaterials.find(b => b.componentId === component.id)!.unitsPerProduct;
      const productCostIncrease = mul(unitsPerProduct, costIncreaseCents);
      const marginImpact = mul(p.monthlyVolume, productCostIncrease);
      return {
        productId: p.id,
        monthlyVolume: p.monthlyVolume,
        contributionMarginImpactCents: marginImpact
      };
    });
  
  const calculationSteps: CalculationStep[] = [
    { formula: `projectedCost = ${currentCostCents} × (10000 + ${costChangeMultiplier}) / 10000`, result: projectedCostCents, unit: "cents" },
    { formula: `costIncrease = ${projectedCostCents} - ${currentCostCents}`, result: costIncreaseCents, unit: "cents" },
    { formula: `monthlyVolume = sum across products`, result: monthlyVolume, unit: "component units" },
    { formula: `monthlyImpact = ${monthlyVolume} × ${costIncreaseCents}`, result: monthlyImpactCents, unit: "cents" }
  ];
  
  return {
    signalId: signal.id,
    componentId: component.id,
    componentName: component.name,
    currentCostCents,
    projectedCostCents,
    costIncreaseCents,
    monthlyVolumeAffected: monthlyVolume,
    monthlyImpactCents,
    affectedProducts,
    calculationSteps
  };
}
```

## API Endpoints

Add to `backend/app/src/api.ts` following existing patterns:

```typescript
// GET /fred/series - List configured FRED series with latest observations
if (method === "GET" && route === "/fred/series") {
  const series = await fredService.getConfiguredSeries();
  return reply(200, series);
}

// GET /fred/series/:id - Get specific series with observations
// Query params: ?start=YYYY-MM-DD&end=YYYY-MM-DD&limit=100
if (method === "GET" && route.startsWith("/fred/series/")) {
  const seriesId = route.slice("/fred/series/".length);
  // Validate against allowlist
  if (!FRED_SERIES_CONFIG.find(c => c.id === seriesId)) {
    return reply(400, { error: "Unknown series ID" });
  }
  const series = await fredService.getSeries(seriesId, { /* parse query */ });
  return series ? reply(200, series) : reply(404, { error: "Series not found" });
}

// GET /fred/signals - Get current economic signals with severity
if (method === "GET" && route === "/fred/signals") {
  const signals = await fredService.getSignals();
  return reply(200, signals);
}

// GET /fred/impact/:signalId - Get financial impact for signal
// Uses Steel City Beverages as default company
if (method === "GET" && route.startsWith("/fred/impact/")) {
  const signalId = route.slice("/fred/impact/".length);
  const impact = await fredService.calculateImpact(signalId);
  return impact ? reply(200, impact) : reply(404, { error: "Signal not found" });
}
```

**Error handling patterns**:
- FRED API unavailable → 503 "External data source unavailable"
- Invalid series ID → 400 "Unknown series ID"
- Missing FRED_API_KEY → 503 "FRED integration not configured"
- Rate limit (120/min) → 429 with exponential backoff

## Infrastructure Changes

**CDK updates** in `infra/lib/infra-stack.ts`:

```typescript
// 1. New DynamoDB table for economic data
const economicDataTable = new dynamodb.Table(this, "EconomicDataTable", {
  tableName: "MarginGuardEconomicData",
  partitionKey: { name: "seriesId", type: dynamodb.AttributeType.STRING },
  sortKey: { name: "date", type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: "expiresAt",
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

economicDataTable.addGlobalSecondaryIndex({
  indexName: "seriesId-cachedAt-index",
  partitionKey: { name: "seriesId", type: dynamodb.AttributeType.STRING },
  sortKey: { name: "cachedAt", type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});

// 2. FRED API key from Secrets Manager (pattern matches existing Nemotron secret)
const fredSecretArn = this.node.tryGetContext("fredSecretArn") as string | undefined;
if (fredSecretArn) {
  const fredSecret = secretsmanager.Secret.fromSecretCompleteArn(
    this,
    "FredSecret",
    fredSecretArn
  );
  fredSecret.grantRead(applicationFn);
  applicationFn.addEnvironment("FRED_SECRET_ARN", fredSecretArn);
}

// 3. Environment variables
applicationFn.addEnvironment("ECONOMIC_DATA_TABLE", economicDataTable.tableName);

// 4. IAM grants
economicDataTable.grantReadWriteData(applicationFn);

// 5. API Gateway routes (reuse existing authorizer)
const addRoute = (id: string, method: apigwv2.HttpMethod, path: string, fn: lambda.Function) => {
  httpApi.addRoutes({
    path,
    methods: [method],
    integration: new apigwv2Integrations.HttpLambdaIntegration(id, fn),
    authorizer: path === "/health" ? undefined : authorizer,
  });
};

addRoute("FredSeriesListInt", apigwv2.HttpMethod.GET, "/fred/series", applicationFn);
addRoute("FredSeriesGetInt", apigwv2.HttpMethod.GET, "/fred/series/{id}", applicationFn);
addRoute("FredSignalsInt", apigwv2.HttpMethod.GET, "/fred/signals", applicationFn);
addRoute("FredImpactInt", apigwv2.HttpMethod.GET, "/fred/impact/{id}", applicationFn);
```

**Secrets Manager setup**:
```bash
# Create secret (one-time)
aws secretsmanager create-secret \
  --name marginguard-fred-api-key \
  --secret-string '{"FRED_API_KEY":"your-key-here"}'

# Deploy with context
cdk deploy --context fredSecretArn=arn:aws:secretsmanager:REGION:ACCOUNT:secret:marginguard-fred-api-key
```

## Frontend Integration

### API Client Updates
`frontend/src/lib/api.ts`:
```typescript
export async function getEconomicSignals(): Promise<EconomicSignal[]> {
  return request<EconomicSignal[]>("/fred/signals");
}

export async function getEconomicImpact(signalId: string): Promise<EconomicImpact> {
  return request<EconomicImpact>(`/fred/impact/${signalId}`);
}
```

### UI Component
`frontend/src/components/features/Dashboard/EconomicSignals.tsx`:

**Design principles**:
- **Source transparency**: Always show FRED link to series
- **Date visibility**: Show observation date for staleness awareness
- **Severity color coding**: critical (red), high (orange), medium (yellow), low (green)
- **Affected components**: Clear mapping to business inputs
- **Calculation drill-down**: Button to view financial impact details

**Visual structure**:
```
┌─────────────────────────────────────────┐
│ Economic Indicators                     │
│ Real-time commodity prices from FRED    │
├─────────────────────────────────────────┤
│ Aluminum Sheet, Plate & Foil PPI        │
│ Feb 1, 2024                             │ ↑ 5.03% [HIGH]
│                                         │
│ Aluminum prices increased 5.03% MoM     │
│ Affects: aluminum cans                  │
│ Source: FRED Series PCU331315331315     │
│ [View financial impact →]               │
└─────────────────────────────────────────┘
```

Integrate into `frontend/src/pages/DashboardPage.tsx` after existing critical risk card.

## Testing Strategy

### Unit Tests
**`backend/app/src/fred/test/signals.test.ts`**:
- ✓ Deterministic percentage change calculation
- ✓ Severity thresholds (low/medium/high/critical)
- ✓ FRED missing observation "." → null handling
- ✓ Zero previous value edge case
- ✓ Direction detection (increasing/decreasing/stable)

**`backend/app/src/fred/test/impact.test.ts`**:
- ✓ Component cost increase matches financial engine patterns (BigInt)
- ✓ Monthly volume calculation across products
- ✓ Contribution margin impact per product
- ✓ Calculation steps recorded for transparency

**`backend/app/src/fred/test/client.test.ts`**:
- ✓ Network timeout retry with exponential backoff
- ✓ 429 rate limit handling
- ✓ Invalid API key error
- ✓ Malformed FRED response
- ✓ Series not found (404)

### Integration Tests
**`backend/app/test/fred-api.test.ts`**:
- ✓ GET /fred/signals returns cached data when FRED unavailable
- ✓ GET /fred/series/:id validates against allowlist
- ✓ All endpoints require authentication (Cognito JWT)
- ✓ Error responses have correct status codes

### E2E Tests
**Playwright** (`frontend/tests/`):
- ✓ Dashboard displays economic signals
- ✓ FRED attribution link present with target="_blank"
- ✓ Severity badges show correct colors
- ✓ Loading and error states

## Demo Mode

Create snapshot data at `backend/app/src/fred/demo-data.ts`:
```typescript
export const DEMO_FRED_SIGNALS: EconomicSignal[] = [
  {
    id: "PCU331315331315-2024-02-01",
    seriesId: "PCU331315331315",
    seriesName: "Aluminum Sheet, Plate & Foil PPI",
    date: "2024-02-01",
    currentValue: 156.7,
    previousValue: 149.2,
    absoluteChange: 7.5,
    percentageChange: 5.03,
    direction: "increasing",
    severity: "high",
    // ... full signal with calculation steps
  },
  // ... more demo signals
];
```

Fallback logic: If `FRED_SECRET_ARN` not configured, return demo data instead of 503 error for hackathon demos.

## Verification Flow

**Complete end-to-end test**:
1. Obtain FRED API key: https://fred.stlouisfed.org/docs/api/api_key.html
2. Configure: `export FRED_API_KEY=xxx` in backend/.env
3. Start backend: `cd backend/app && npm run dev` (port 3001)
4. Start frontend: `cd frontend && npm run dev` (port 5173)
5. Login to application
6. Navigate to dashboard
7. **Verify**:
   - Economic signals section displays
   - Real FRED data shows current/previous values
   - Percentage change calculated correctly
   - Severity badge shows appropriate color
   - FRED source link navigates to https://fred.stlouisfed.org/series/PCU331315331315
   - "View financial impact" shows component mapping
   - Calculation steps visible and transparent
   - Monthly impact shown in dollars
   - Affected products list matches Steel City Beverages

## Critical Files to Modify

1. **`backend/app/src/fred/types.ts`** - Domain types connecting FRED to financial engine
2. **`backend/app/src/fred/impact.ts`** - Financial calculations (BigInt patterns)
3. **`backend/app/src/api.ts`** - API routing (add 4 new endpoints)
4. **`infra/lib/infra-stack.ts`** - Infrastructure (DynamoDB table, Secrets Manager, routes)
5. **`backend/app/src/fred/config.ts`** - Series configuration & component mapping
6. **`backend/app/src/fred/client.ts`** - FRED API client (retry/timeout/error handling)
7. **`backend/app/src/fred/cache.ts`** - DynamoDB cache layer (store pattern)
8. **`backend/app/src/fred/signals.ts`** - Deterministic signal detection
9. **`frontend/src/components/features/Dashboard/EconomicSignals.tsx`** - UI component
10. **`frontend/src/pages/DashboardPage.tsx`** - Integrate component
11. **`.env.example`** - Document FRED_API_KEY
12. **`README.md`** - Setup instructions, series documentation

## Existing Patterns to Reuse

✓ **API routing**: String matching `method === "GET" && route === "/path"`, `reply()` helper  
✓ **Store abstraction**: Interface with `put()`/`get()`, memory/DynamoDB factory functions  
✓ **Financial calculations**: BigInt with `safe()`, `sum()`, `mul()` helpers, `CalculationStep[]`  
✓ **CDK patterns**: DynamoDB PAY_PER_REQUEST, Secrets Manager via `tryGetContext()`, Lambda env vars  
✓ **Service layer**: Zod validation, factory functions over classes  
✓ **Error handling**: Try/catch with specific status codes, descriptive error messages  

## Security Checklist

- [ ] FRED_API_KEY never committed or in source code
- [ ] API key only in Secrets Manager (AWS) or .env (local, gitignored)
- [ ] No VITE_ prefix on FRED_API_KEY (backend only)
- [ ] Series ID validated against allowlist before FRED request
- [ ] No API key in error messages or logs
- [ ] All /fred/* endpoints require Cognito JWT authentication
- [ ] Rate limiting implemented (120 requests/minute)
- [ ] Input validation on query parameters (limit, dates)
- [ ] Source URLs sanitized (no XSS)

## Implementation Notes

**Phase 1 Priority**: Backend foundation (types, client, cache, signals, impact calculations)  
**Phase 2 Priority**: API integration and infrastructure (endpoints, CDK, DynamoDB)  
**Phase 3 Priority**: Frontend UI and testing  
**Phase 4 Priority**: Documentation and demo mode  

**Time estimate**: 12-16 days for production-quality implementation

**Key principle**: Every financial number must come from deterministic TypeScript code, never from an LLM. All calculations must be inspectable through `calculationSteps` arrays.