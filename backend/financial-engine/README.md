# MarginGuard financial engine

A standalone, deterministic TypeScript subsystem. No runtime dependencies, LLM calls, network requests, clock reads, or randomness. All results derive from the supplied company and structured intelligence event. Event descriptions are labels and never influence arithmetic.

## Run

Requires Node.js 24+ and npm. From `backend/financial-engine`:

```sh
npm ci
npm run check
npm run demo
```

`npm run check` builds with strict TypeScript and runs the formula and scenario tests. `npm run demo` prints a complete JSON report including calculation steps. The compiled entry point and declarations are `dist/index.js` and `dist/index.d.ts`.

```ts
import { analyzeDisruption } from './dist/index.js';
import { steelCityBeverages, logisticsDisruption } from './dist/steel-city-beverages.js';
const report = analyzeDisruption(steelCityBeverages, logisticsDisruption);
```

The five input types are `Company`, `Supplier`, `Component`, `Product`, and `IntelligenceEvent`; the company embeds the supply graph. Source dependencies must total 10,000 basis points for each component. Alternatives specify **additional** capacity available within the modeled month, a premium over the normal component price, per-component expedited freight, and fixed freight. An existing source can also offer additional capacity. An alternative affected by the event is conservatively excluded.

## Financial and allocation contract

- One currency and one month per analysis. Monetary inputs and outputs are safe-integer cents; rates use integer basis points (10,000 = 100%). BigInt intermediates prevent floating-point drift. Results exceeding safe-integer bounds throw.
- Production and deliveries are uniform over the month. No beginning inventory, safety stock, backlog recovery, lead-time simulation, or sales substitution. Disruption duration is explicitly bounded by the month. This is a monthly exposure model, not a daily production scheduler.
- Component demand = sum of monthly product volume × BOM component units per product.
- Unavailable components = **ceil**(demand × total affected supplier dependency / 10,000 × unavailable severity / 10,000 × disruption days / days in month).
- Each product receives a proportional share of each available component. Producible product units = minimum across BOM components of **floor**(monthly volume × available component units / total component demand). This conservative policy avoids over-allocation and double counting overlapping shortages. Unused component allocations are not redistributed to other products.
- Affected units = monthly volume − producible units. Aggregate units sum finished-product units; callers should use a common unit convention (the fixture uses 12-can cases).
- Unit contribution margin = selling price − variable cost. Variable cost includes normal material costs and all other avoidable unit costs. Negative-margin products are rejected by this version.
- Revenue at risk = affected units × selling price. Contribution margin at risk = affected units × unit contribution margin. Company totals sum product exposures.
- Cash impact is the **signed change from an undisrupted month**, assuming sales receipts and avoidable variable-cost payments occur in the same month. Baseline cash impact = −contribution margin at risk. This excludes receivables/payables timing, taxes, financing, fixed costs, and working-capital inventory movements.
- Each response is an independent, mutually exclusive purchase of one component from one alternative. Replacement quantity = min(component shortage, additional alternate capacity). Recompute the entire production bottleneck after replacement.
- Premium = **round-half-up**(replacement units × component unit cost × premium basis points / 10,000), rounded once at invoice total. Freight = replacement units × expedited shipping cost per component + fixed expediting charge. Costs apply to the entire purchased quantity, including units that other bottlenecks prevent using. Base component cost is already included in product variable cost; it is not added twice.
- Net financial benefit relative to doing nothing = avoided contribution margin loss − premium − freight. Response cash impact = −remaining contribution margin loss − premium − freight. Negative-benefit responses remain visible. `do-nothing` always has zero incremental benefit.

There is no optimizer or combined multi-alternative plan: do not sum independent options. Alternative availability and capacity are explicit supplied assumptions, not inferred from event prose. Typed input is validated for ranges, references, duplicate graph IDs, source totals, material cost consistency, and numeric overflow. Callers handling untrusted JSON should validate its object shape before calling this typed API.

The result includes affected supplier IDs, component demand and shortages, product exposures, aggregate financial values, response options, residual exposures, and human-readable formula steps. Product contribution margin is derived rather than stored independently to prevent contradictory inputs.

## Synthetic Steel City Beverages scenario

All names, costs, capacities, and the event below are synthetic. This Pittsburgh-style beverage manufacturer uses four suppliers, three components, and three products. Each finished case consumes 12 cans, 12 base doses, and one carton. Material cost per case is $3.00; variable costs also include filling, labor, utilities, and product-specific ingredients.

| Product (12-can case) | Monthly cases | Selling price | Variable cost | Contribution |
| --- | ---: | ---: | ---: | ---: |
| Steel City Sparkling Water | 50,000 | $12 | $7 | $5 |
| Foundry Cola | 30,000 | $18 | $10 | $8 |
| Rivet Energy | 20,000 | $24 | $14 | $10 |

Allegheny supplies 80% of cans and Great Lakes 20%. Keystone supplies the beverage base and Three Rivers supplies cartons. A 15-day freight-terminal closure completely stops Allegheny deliveries during a 30-day month:

1. Monthly can demand: 100,000 cases × 12 = 1,200,000 cans.
2. Missing cans: 1,200,000 × 80% × 100% × 15/30 = 480,000.
3. Lost cases: 20,000 sparkling + 12,000 cola + 8,000 energy = 40,000.
4. Revenue at risk: $240,000 + $216,000 + $192,000 = **$648,000**.
5. Contribution at risk: $100,000 + $96,000 + $80,000 = **$276,000**. Cash impact: **−$276,000**.
6. Great Lakes can expedite 360,000 extra cans. Premium: 360,000 × $0.12 × 25% = $10,800. Freight: 360,000 × $0.02 + $1,500 = $8,700. Total extra cost: **$19,500**.
7. This recovers 30,000 cases and $207,000 contribution, leaving 10,000 cases, $162,000 revenue, and $69,000 contribution at risk.
8. Net benefit: $207,000 − $19,500 = **$187,500**. Response cash impact: −$69,000 − $19,500 = **−$88,500**.

Tests assert these values independently, plus rounding, simultaneous shortages, severity, duration, capacity limits, unaffected products, invalid inputs, reproducibility, and overflow. This package requires no frontend, infrastructure, or LLM integration changes.
