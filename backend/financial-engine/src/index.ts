import type { Analysis, CalculationStep, Company, Exposure, IntelligenceEvent, ResponseOption } from './types.ts';
export type * from './types.ts';

const BPS = 10_000n;
function integer(value: number, name: string, min = 0, max = Number.MAX_SAFE_INTEGER): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${name} must be an integer in [${min}, ${max}]`);
}
function safe(value: bigint): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new Error('Calculation exceeds safe integer range');
  return result;
}
const sum = (values: number[]): number => safe(values.reduce((a, b) => a + BigInt(b), 0n));
const mul = (a: number, b: number): number => safe(BigInt(a) * BigInt(b));
function unique(ids: string[], label: string): void {
  if (ids.some(id => typeof id !== 'string' || !id.trim()) || new Set(ids).size !== ids.length) throw new Error(`${label}: IDs must be nonempty and unique`);
}
function validate(company: Company, event: IntelligenceEvent): void {
  integer(company.daysInMonth, 'daysInMonth', 1, 31);
  if (!/^[A-Z]{3}$/.test(company.currency)) throw new Error('currency must be a three-letter uppercase code');
  if (event.type !== 'logistics-disruption') throw new Error('Unsupported event type');
  integer(event.disruptionDays, 'disruptionDays', 0, company.daysInMonth);
  integer(event.unavailableBps, 'unavailableBps', 0, 10_000);
  unique(company.suppliers.map(s => s.id), 'suppliers');
  unique(company.components.map(c => c.id), 'components');
  unique(company.products.map(p => p.id), 'products');
  unique(event.supplierIds, 'event suppliers');
  const suppliers = new Set(company.suppliers.map(s => s.id));
  const components = new Map(company.components.map(c => [c.id, c]));
  const supplier = (id: string) => { if (!suppliers.has(id)) throw new Error(`Unknown supplier: ${id}`); };
  event.supplierIds.forEach(supplier);
  for (const c of company.components) {
    integer(c.unitCostCents, 'unitCostCents');
    unique(c.sources.map(s => s.supplierId), 'component sources');
    if (sum(c.sources.map(s => s.dependencyBps)) !== 10_000) throw new Error('Source dependencyBps must sum to 10000');
    for (const s of c.sources) { supplier(s.supplierId); integer(s.dependencyBps, 'dependencyBps', 0, 10_000); }
    unique(c.alternatives.map(a => a.supplierId), 'alternatives');
    for (const a of c.alternatives) {
      supplier(a.supplierId);
      integer(a.capacityUnits, 'capacityUnits'); integer(a.premiumBps, 'premiumBps');
      integer(a.expeditedShippingCentsPerUnit, 'expeditedShippingCentsPerUnit'); integer(a.fixedExpeditingCents, 'fixedExpeditingCents');
    }
  }
  for (const p of company.products) {
    integer(p.monthlyVolume, 'monthlyVolume'); integer(p.sellingPriceCents, 'sellingPriceCents'); integer(p.variableCostCents, 'variableCostCents');
    if (p.variableCostCents > p.sellingPriceCents) throw new Error('Products must have nonnegative contribution margin');
    if (!p.billOfMaterials.length) throw new Error('Product must have a bill of materials');
    unique(p.billOfMaterials.map(b => b.componentId), 'bill of materials');
    for (const b of p.billOfMaterials) {
      if (!components.has(b.componentId)) throw new Error(`Unknown component: ${b.componentId}`);
      integer(b.unitsPerProduct, 'unitsPerProduct', 1);
    }
    const materialCost = sum(p.billOfMaterials.map(b => mul(components.get(b.componentId)!.unitCostCents, b.unitsPerProduct)));
    if (materialCost > p.variableCostCents) throw new Error('variableCostCents must include normal material costs');
  }
}

/** Pure, deterministic monthly analysis. No network, model, clock, or random inputs. */
export function analyzeDisruption(company: Company, event: IntelligenceEvent): Analysis {
  validate(company, event);
  const steps: CalculationStep[] = [];
  const demand = new Map(company.components.map(c => [c.id, sum(company.products.map(p =>
    mul(p.monthlyVolume, p.billOfMaterials.find(b => b.componentId === c.id)?.unitsPerProduct ?? 0)))]));
  const shortages = new Map(company.components.map(c => {
    const dependency = sum(c.sources.filter(s => event.supplierIds.includes(s.supplierId)).map(s => s.dependencyBps));
    const denominator = BPS * BPS * BigInt(company.daysInMonth);
    const numerator = BigInt(demand.get(c.id)!) * BigInt(dependency) * BigInt(event.unavailableBps) * BigInt(event.disruptionDays);
    // Round unavailable components upward to avoid understating exposure.
    const loss = safe((numerator + denominator - 1n) / denominator);
    steps.push({ formula: `${c.id}: ceil(${demand.get(c.id)} × ${dependency}/10000 × ${event.unavailableBps}/10000 × ${event.disruptionDays}/${company.daysInMonth})`, result: loss, unit: 'component units unavailable' });
    return [c.id, loss];
  }));
  function exposure(losses: Map<string, number>): Exposure {
    const calculationSteps: CalculationStep[] = [];
    const affectedProducts = company.products.map(p => {
      // Pro-rata component allocation; the tightest component is the production bottleneck.
      const limits = p.billOfMaterials.map(b => {
        const total = demand.get(b.componentId)!;
        return total === 0 ? p.monthlyVolume : safe(BigInt(p.monthlyVolume) * BigInt(total - losses.get(b.componentId)!) / BigInt(total));
      });
      const producible = Math.min(p.monthlyVolume, ...limits);
      const affectedUnits = p.monthlyVolume - producible;
      const margin = p.sellingPriceCents - p.variableCostCents;
      const revenue = mul(affectedUnits, p.sellingPriceCents);
      const contribution = mul(affectedUnits, margin);
      calculationSteps.push(
        { formula: `${p.id}: producible = min(${p.monthlyVolume}, ${limits.join(', ')}) using floor(volume × available component / component demand)`, result: producible, unit: 'product units' },
        { formula: `${p.id}: affected units = ${p.monthlyVolume} - ${producible}`, result: affectedUnits, unit: 'product units' },
        { formula: `${p.id}: unit contribution = ${p.sellingPriceCents} - ${p.variableCostCents}`, result: margin, unit: 'cents/product unit' },
        { formula: `${p.id}: revenue at risk = ${affectedUnits} × ${p.sellingPriceCents}`, result: revenue, unit: 'cents' },
        { formula: `${p.id}: contribution at risk = ${affectedUnits} × ${margin}`, result: contribution, unit: 'cents' });
      return { productId: p.id, affectedUnits, contributionMarginCentsPerUnit: margin, revenueAtRiskCents: revenue, contributionMarginAtRiskCents: contribution };
    }).filter(p => p.affectedUnits > 0);
    const affectedUnits = sum(affectedProducts.map(p => p.affectedUnits));
    const revenue = sum(affectedProducts.map(p => p.revenueAtRiskCents));
    const contribution = sum(affectedProducts.map(p => p.contributionMarginAtRiskCents));
    calculationSteps.push({ formula: 'Sum product affected units', result: affectedUnits, unit: 'product units' },
      { formula: 'Sum product revenue at risk', result: revenue, unit: 'cents' },
      { formula: 'Sum product contribution at risk', result: contribution, unit: 'cents' },
      { formula: `cash impact = -${contribution}; same-month collections and avoidable variable payments`, result: -contribution, unit: 'cents' });
    return { affectedProducts, affectedUnits, revenueAtRiskCents: revenue, contributionMarginAtRiskCents: contribution, cashImpactCents: -contribution, calculationSteps };
  }
  const baseline = exposure(shortages);
  const responseOptions: ResponseOption[] = [{ id: 'do-nothing', description: 'Accept the disruption', replacementComponentUnits: 0, premiumCents: 0, expeditedShippingCents: 0, incrementalCostCents: 0, recoveredUnits: 0, avoidedContributionMarginLossCents: 0, netFinancialBenefitCents: 0, residualExposure: baseline, cashImpactCents: baseline.cashImpactCents, calculationSteps: [] }];
  for (const c of company.components) for (const a of c.alternatives) {
    const replacement = Math.min(shortages.get(c.id)!, a.capacityUnits);
    if (!replacement || (event.unavailableBps > 0 && event.disruptionDays > 0 && event.supplierIds.includes(a.supplierId))) continue;
    const remaining = new Map(shortages);
    remaining.set(c.id, shortages.get(c.id)! - replacement);
    const residual = exposure(remaining);
    const premium = safe((BigInt(replacement) * BigInt(c.unitCostCents) * BigInt(a.premiumBps) + BPS / 2n) / BPS);
    const shipping = sum([mul(replacement, a.expeditedShippingCentsPerUnit), a.fixedExpeditingCents]);
    const cost = sum([premium, shipping]);
    const avoided = baseline.contributionMarginAtRiskCents - residual.contributionMarginAtRiskCents;
    const altSupplierName = company.suppliers.find(s => s.id === a.supplierId)?.name ?? a.supplierId;
    const recoveredCases = baseline.affectedUnits - residual.affectedUnits;
    responseOptions.push({ id: JSON.stringify([c.id, a.supplierId]), description: `Source ${c.name}s from ${altSupplierName} — recover ${recoveredCases.toLocaleString()} cases`,
      componentId: c.id, supplierId: a.supplierId, replacementComponentUnits: replacement,
      premiumCents: premium, expeditedShippingCents: shipping, incrementalCostCents: cost,
      recoveredUnits: baseline.affectedUnits - residual.affectedUnits,
      avoidedContributionMarginLossCents: avoided, netFinancialBenefitCents: safe(BigInt(avoided) - BigInt(cost)),
      residualExposure: residual, cashImpactCents: safe(BigInt(residual.cashImpactCents) - BigInt(cost)),
      calculationSteps: [
        { formula: `replacement = min(${shortages.get(c.id)}, ${a.capacityUnits})`, result: replacement, unit: 'component units' },
        { formula: `premium = round-half-up(${replacement} × ${c.unitCostCents} × ${a.premiumBps}/10000)`, result: premium, unit: 'cents' },
        { formula: `shipping = ${replacement} × ${a.expeditedShippingCentsPerUnit} + ${a.fixedExpeditingCents}`, result: shipping, unit: 'cents' },
        { formula: `incremental cost = ${premium} + ${shipping}`, result: cost, unit: 'cents' },
        { formula: `avoided contribution loss = ${baseline.contributionMarginAtRiskCents} - ${residual.contributionMarginAtRiskCents}`, result: avoided, unit: 'cents' },
        { formula: `net benefit = ${avoided} - ${cost}`, result: avoided - cost, unit: 'cents' },
        { formula: `cash impact = ${residual.cashImpactCents} - ${cost}`, result: safe(BigInt(residual.cashImpactCents) - BigInt(cost)), unit: 'cents' }
      ] });
  }
  const affectedComponents = company.components.filter(c => shortages.get(c.id)! > 0).map(c => ({ componentId: c.id, monthlyDemandUnits: demand.get(c.id)!, unavailableUnits: shortages.get(c.id)! }));
  return { ...baseline, companyId: company.id, eventId: event.id, currency: company.currency,
    affectedSuppliers: company.suppliers.filter(s => event.supplierIds.includes(s.id) && affectedComponents.some(c => company.components.find(x => x.id === c.componentId)!.sources.some(source => source.supplierId === s.id && source.dependencyBps > 0))).map(s => s.id),
    affectedComponents, responseOptions, calculationSteps: [...steps, ...baseline.calculationSteps] };
}
