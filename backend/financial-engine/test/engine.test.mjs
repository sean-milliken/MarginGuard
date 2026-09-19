import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeDisruption as analyze } from '../src/index.ts';
import { steelCityBeverages as company, logisticsDisruption as event } from '../src/steel-city-beverages.ts';
const run = (c = company, e = event) => analyze(c, e);
const copy = () => structuredClone(company);
test('complete scenario: BOM demand, dependency, volume, revenue, contribution, cash', () => {
 const r = run();
 assert.deepEqual(r.affectedSuppliers, ['allegheny']);
 assert.deepEqual(r.affectedComponents, [{ componentId: 'can', monthlyDemandUnits: 1200000, unavailableUnits: 480000 }]);
 assert.deepEqual(r.affectedProducts.map(p => [p.affectedUnits,p.contributionMarginCentsPerUnit,p.revenueAtRiskCents,p.contributionMarginAtRiskCents]), [[20000,500,24000000,10000000],[12000,800,21600000,9600000],[8000,1000,19200000,8000000]]);
 assert.equal(r.affectedUnits,40000); assert.equal(r.revenueAtRiskCents,64800000); assert.equal(r.contributionMarginAtRiskCents,27600000); assert.equal(r.cashImpactCents,-27600000);
});
test('response capacity, premium, freight, residual, net benefit and cash', () => {
 const r=run(), a=r.responseOptions[1];
 for (const [key,value] of Object.entries({replacementComponentUnits:360000,premiumCents:1080000,expeditedShippingCents:870000,incrementalCostCents:1950000,recoveredUnits:30000,avoidedContributionMarginLossCents:20700000,netFinancialBenefitCents:18750000,cashImpactCents:-8850000})) assert.equal(a[key],value,key);
 assert.equal(a.residualExposure.affectedUnits,10000); assert.equal(a.residualExposure.revenueAtRiskCents,16200000); assert.equal(a.residualExposure.contributionMarginAtRiskCents,6900000);
 assert.equal(a.cashImpactCents-r.cashImpactCents,a.netFinancialBenefitCents); assert.equal(r.responseOptions[0].netFinancialBenefitCents,0);
});
test('zero duration, severity, demand and empty supplier list', () => {
 for(const patch of [{disruptionDays:0},{unavailableBps:0},{supplierIds:[]}]) {const r=run(company,{...event,...patch}); assert.equal(r.affectedUnits,0);assert.equal(r.responseOptions.length,1);}
 const c=copy();c.products.forEach(p=>p.monthlyVolume=0);assert.equal(run(c).affectedUnits,0);
});
test('partial severity and aggregation of disrupted sources',()=>{
 assert.equal(run(company,{...event,unavailableBps:5000}).affectedUnits,20000);
 const r=run(company,{...event,supplierIds:['allegheny','great-lakes']});assert.equal(r.affectedUnits,50000);assert.equal(r.responseOptions.length,1);
});
test('multiple shortages use bottleneck and do not double count; unhelpful responses retain negative benefit',()=>{
 const r=run(company,{...event,supplierIds:['allegheny','keystone']});assert.equal(r.affectedUnits,50000);assert.equal(r.responseOptions[1].recoveredUnits,0);assert.equal(r.responseOptions[1].netFinancialBenefitCents,-1950000);
});
test('full month disruption; alternate purchases capped at shortage',()=>{
 const c=copy();c.components[0].alternatives[0].capacityUnits=2000000;
 const r=run(c,{...event,disruptionDays:30});assert.equal(r.affectedUnits,80000);assert.equal(r.responseOptions[1].replacementComponentUnits,960000);assert.equal(r.responseOptions[1].residualExposure.affectedUnits,0);
});
test('rounding: unavailable components ceil, producible products floor, invoice premium half-up',()=>{
 const c=copy();c.products=[c.products[0]];c.products[0].monthlyVolume=1;c.components[0].unitCostCents=1;c.components[0].alternatives[0].premiumBps=5000;
 const r=run(c,{...event,disruptionDays:1,unavailableBps:1});assert.equal(r.affectedComponents[0].unavailableUnits,1);assert.equal(r.affectedUnits,1);assert.equal(r.responseOptions[1].premiumCents,1);
});
test('unrelated products and zero alternate capacity',()=>{
 const c=copy();c.products[0].billOfMaterials=[{componentId:'carton',unitsPerProduct:1}];c.components[0].alternatives[0].capacityUnits=0;
 assert.equal(run(c).affectedProducts.some(p=>p.productId==='sparkling'),false);assert.equal(run(c).responseOptions.length,1);
});
test('repeatable, JSON serializable, input preserving and traced',()=>{
 const c=copy(),e=structuredClone(event),before=JSON.stringify([c,e]);assert.equal(JSON.stringify(run(c,e)),JSON.stringify(run(c,e)));assert.equal(JSON.stringify([c,e]),before);assert.ok(run().calculationSteps.every(s=>s.formula&&Number.isSafeInteger(s.result)));
});
test('invalid ranges, references, duplicates and economics fail',()=>{
 const mutations=[c=>c.products[0].monthlyVolume=-1,c=>c.products[0].sellingPriceCents=NaN,c=>c.products[0].variableCostCents=0,c=>c.products[0].variableCostCents=999999,c=>c.products[0].billOfMaterials[0].unitsPerProduct=0.5,c=>c.products[0].billOfMaterials[0].componentId='missing',c=>c.products[0].billOfMaterials.push(c.products[0].billOfMaterials[0]),c=>c.components[0].sources[0].dependencyBps=5000,c=>c.components[0].alternatives[0].supplierId='missing',c=>c.components[0].alternatives[0].premiumBps=-1,c=>c.suppliers.push(c.suppliers[0]),c=>c.daysInMonth=0,c=>c.currency='usd'];
 for(const mutate of mutations){const c=copy();mutate(c);assert.throws(()=>run(c));}
 for(const patch of [{supplierIds:['missing']},{supplierIds:['allegheny','allegheny']},{disruptionDays:31},{unavailableBps:10001},{type:'other'}])assert.throws(()=>run(company,{...event,...patch}));
});
test('overflow fails rather than returning imprecise values',()=>{const c=copy();c.products[0].monthlyVolume=Number.MAX_SAFE_INTEGER;assert.throws(()=>run(c),/safe integer/);});
test('complete loss of all supply cannot exceed monthly volume', () => {
 const r=run(company,{...event,disruptionDays:30,supplierIds:company.suppliers.map(s=>s.id)});
 assert.equal(r.affectedUnits,100000);assert.equal(r.revenueAtRiskCents,162000000);assert.equal(r.contributionMarginAtRiskCents,69000000);assert.equal(r.responseOptions.length,1);
});
test('proportional allocation never consumes more component units than available', () => {
 for(const days of [1,7,15,29,30]) {
  const r=run(company,{...event,disruptionDays:days});
  for(const component of r.affectedComponents) {
   const consumed=company.products.reduce((total,p)=>total+(p.monthlyVolume-(r.affectedProducts.find(x=>x.productId===p.id)?.affectedUnits??0))*(p.billOfMaterials.find(b=>b.componentId===component.componentId)?.unitsPerProduct??0),0);
   assert.ok(consumed<=component.monthlyDemandUnits-component.unavailableUnits);
  }
 }
});
