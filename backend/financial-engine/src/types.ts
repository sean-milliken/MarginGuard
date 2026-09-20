/** Money is integer minor currency units (cents for USD); rates are basis points. */
export interface Supplier { id: string; name: string }
export interface Alternative {
  supplierId: string;
  capacityUnits: number;
  premiumBps: number;
  expeditedShippingCentsPerUnit: number;
  fixedExpeditingCents: number;
}
export interface Component {
  id: string;
  name: string;
  unitCostCents: number;
  sources: { supplierId: string; dependencyBps: number }[];
  alternatives: Alternative[];
}
export interface Product {
  id: string;
  name: string;
  monthlyVolume: number;
  sellingPriceCents: number;
  /** Includes all normal component costs; all variable costs are avoidable. */
  variableCostCents: number;
  billOfMaterials: { componentId: string; unitsPerProduct: number }[];
}
export interface Company {
  id: string;
  name: string;
  currency: string;
  daysInMonth: number;
  suppliers: Supplier[];
  components: Component[];
  products: Product[];
}
export interface IntelligenceEvent {
  id: string;
  type: 'logistics-disruption' | 'irrelevant';
  supplierIds: string[];
  disruptionDays: number;
  unavailableBps: number;
  description: string;
}
export interface CalculationStep { formula: string; result: number; unit: string }
export interface ProductImpact {
  productId: string;
  affectedUnits: number;
  contributionMarginCentsPerUnit: number;
  revenueAtRiskCents: number;
  contributionMarginAtRiskCents: number;
}
export interface Exposure {
  affectedProducts: ProductImpact[];
  affectedUnits: number;
  revenueAtRiskCents: number;
  contributionMarginAtRiskCents: number;
  /** Signed change relative to an undisrupted month. Negative means outflow/lost cash. */
  cashImpactCents: number;
  calculationSteps: CalculationStep[];
}
export interface ResponseOption {
  id: string;
  description: string;
  componentId?: string;
  supplierId?: string;
  replacementComponentUnits: number;
  premiumCents: number;
  expeditedShippingCents: number;
  incrementalCostCents: number;
  recoveredUnits: number;
  avoidedContributionMarginLossCents: number;
  netFinancialBenefitCents: number;
  residualExposure: Exposure;
  cashImpactCents: number;
  calculationSteps: CalculationStep[];
}
export interface Analysis extends Exposure {
  companyId: string;
  eventId: string;
  currency: string;
  affectedSuppliers: string[];
  affectedComponents: { componentId: string; monthlyDemandUnits: number; unavailableUnits: number }[];
  responseOptions: ResponseOption[];
}
