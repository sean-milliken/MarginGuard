import type { Company, IntelligenceEvent } from './types.ts';
/** Synthetic data. Finished product units are 12-can cases. */
export const steelCityBeverages: Company = {
  id: 'steel-city-beverages', name: 'Steel City Beverages', currency: 'USD', daysInMonth: 30,
  suppliers: [{ id: 'allegheny', name: 'Allegheny Can & Packaging' }, { id: 'keystone', name: 'Keystone Beverage Ingredients' }, { id: 'three-rivers', name: 'Three Rivers Corrugated' }, { id: 'great-lakes', name: 'Great Lakes Can Supply' }],
  components: [
    { id: 'can', name: '355 mL aluminum can with lid', unitCostCents: 12, sources: [{ supplierId: 'allegheny', dependencyBps: 8000 }, { supplierId: 'great-lakes', dependencyBps: 2000 }], alternatives: [{ supplierId: 'great-lakes', capacityUnits: 360000, premiumBps: 2500, expeditedShippingCentsPerUnit: 2, fixedExpeditingCents: 150000 }] },
    { id: 'base', name: 'Beverage base dose', unitCostCents: 8, sources: [{ supplierId: 'keystone', dependencyBps: 10000 }], alternatives: [] },
    { id: 'carton', name: '12-can corrugated case', unitCostCents: 60, sources: [{ supplierId: 'three-rivers', dependencyBps: 10000 }], alternatives: [] }
  ],
  products: [
    { id: 'sparkling', name: 'Steel City Sparkling Water', monthlyVolume: 50000, sellingPriceCents: 1200, variableCostCents: 700, billOfMaterials: [{ componentId: 'can', unitsPerProduct: 12 }, { componentId: 'base', unitsPerProduct: 12 }, { componentId: 'carton', unitsPerProduct: 1 }] },
    { id: 'cola', name: 'Foundry Cola', monthlyVolume: 30000, sellingPriceCents: 1800, variableCostCents: 1000, billOfMaterials: [{ componentId: 'can', unitsPerProduct: 12 }, { componentId: 'base', unitsPerProduct: 12 }, { componentId: 'carton', unitsPerProduct: 1 }] },
    { id: 'energy', name: 'Rivet Energy', monthlyVolume: 20000, sellingPriceCents: 2400, variableCostCents: 1400, billOfMaterials: [{ componentId: 'can', unitsPerProduct: 12 }, { componentId: 'base', unitsPerProduct: 12 }, { componentId: 'carton', unitsPerProduct: 1 }] }
  ]
};
export const logisticsDisruption: IntelligenceEvent = { id: 'allegheny-freight-closure', type: 'logistics-disruption', supplierIds: ['allegheny'], disruptionDays: 15, unavailableBps: 10000, description: 'Synthetic freight-terminal closure stops Allegheny can deliveries for 15 days of a 30-day month.' };
