// Mock data type definitions for MarginGuard

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  revenue: number;
  cash: number;
  monthlyExpenses: number;
  burnRate: number; // months
  suppliers: Supplier[];
  products: Product[];
  components: Component[];
}

export interface Supplier {
  id: string;
  name: string;
  location?: string;
  category: string;
  dependencyPercentage: number; // 0-100
  relationship: 'primary' | 'secondary' | 'backup';
  components: string[]; // IDs of components they supply
}

export interface Product {
  id: string;
  name: string;
  unitsPerMonth: number;
  marginPerUnit: number;
  totalMargin: number;
  components: string[]; // IDs of required components
}

export interface Component {
  id: string;
  name: string;
  category: string;
  suppliers: string[]; // Supplier IDs
  products: string[]; // Product IDs that use this
}

export type EventType = 'port_disruption' | 'commodity_price' | 'supplier_outage' | 'other';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ExternalEvent {
  id: string;
  title: string;
  description: string;
  occurred: Date;
  type: EventType;
  severity: Severity;
  source: string;
  sourceUrl?: string;
  affectedEntity?: string;
  financialExposure?: number;
}

export interface Scenario {
  id: string;
  eventId: string;
  name: string;
  summary: string;
  impactedSuppliers: string[];
  impactedComponents: string[];
  impactedProducts: string[];
  financialImpact: FinancialImpact;
  dependencyPath: DependencyPath;
  calculationBreakdown: CalculationStep[];
}

export interface FinancialImpact {
  marginAtRisk: number;
  revenueAtRisk: number;
  affectedUnits: number;
  timeHorizon: number; // days
  confidence: number; // 0-1
  cashImpactRange: {
    min: number;
    max: number;
  };
}

export interface DependencyPath {
  nodes: DependencyNode[];
  connections: DependencyConnection[];
}

export type NodeType = 'event' | 'supplier' | 'component' | 'product' | 'impact';

export interface DependencyNode {
  id: string;
  type: NodeType;
  label: string;
  sublabel?: string;
  color?: string;
  position?: [number, number, number]; // x, y, z
  size?: number;
  metadata: Record<string, any>;
}

export interface DependencyConnection {
  from: string;
  to: string;
  label?: string;
  strength?: number; // 0-1
}

export interface CalculationStep {
  step: number;
  description: string;
  formula?: string;
  values: Record<string, number | string>;
  result: number | string;
}

export interface ResponseOption {
  id: string;
  scenarioId: string;
  name: string;
  description: string;
  cost: number;
  revenueProtected: number;
  expectedBenefit: number;
  netImpact: number;
  timeToImplement: number; // days
  liquidityImpact: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  risks: string[];
  requirements: string[];
  recommended: boolean;
  recommendationReason?: string;
}

export interface SourceDocument {
  id: string;
  eventId: string;
  title: string;
  type: 'news' | 'report' | 'analysis' | 'internal';
  url?: string;
  publishedDate: Date;
  relevantExcerpt: string;
  usedFor: string[]; // What this source was used to determine
  confidence: number; // 0-1
}

export interface EvaluationMetrics {
  eventClassification: {
    accuracy: number;
    baseline: number;
    testCases: number;
  };
  entityExtraction: {
    precision: number;
    recall: number;
    f1Score: number;
  };
  structuredOutput: {
    validJsonPercentage: number;
    totalSamples: number;
  };
  categoryBreakdown: CategoryMetric[];
}

export interface CategoryMetric {
  category: string;
  accuracy: number;
  samples: number;
}
