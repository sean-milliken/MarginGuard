import type { Scenario } from '../../types/mock';

export const supplierOutageScenario: Scenario = {
  id: 'scenario-supplier-001',
  eventId: 'event-supplier-001',
  name: 'Atlantic Packaging Facility Closure',
  summary:
    'Atlantic Packaging temporary facility closure for maintenance affects aluminum can and sweetener supply, putting production at risk for Classic Cola and Zero Cola.',

  impactedSuppliers: ['supplier-atlantic'],
  impactedComponents: ['component-aluminum-cans', 'component-sweetener'],
  impactedProducts: ['product-classic-cola', 'product-zero-cola'],

  financialImpact: {
    marginAtRisk: 15_800,
    revenueAtRisk: 52_000,
    affectedUnits: 890, // Units at risk if safety stock depleted
    timeHorizon: 7, // days
    confidence: 0.91,
    cashImpactRange: {
      min: 0, // Use safety stock
      max: 5_200 // Emergency sourcing
    }
  },

  dependencyPath: {
    nodes: [
      {
        id: 'node-outage-event',
        type: 'event',
        label: 'Facility Closure',
        sublabel: 'Maintenance - 7 days',
        color: '#F59E0B',
        position: [-6, 2, 0],
        size: 0.5,
        metadata: { severity: 'MEDIUM', duration: 7 }
      },
      {
        id: 'node-outage-supplier',
        type: 'supplier',
        label: 'Atlantic Packaging',
        sublabel: '42% dependency',
        color: '#0EA5E9',
        position: [-3, 2, 0],
        size: 0.7,
        metadata: { dependencyPercentage: 42 }
      },
      {
        id: 'node-outage-component',
        type: 'component',
        label: 'Aluminum Cans',
        sublabel: 'Temporary unavailable',
        color: '#38BDF8',
        position: [0, 2, 0],
        size: 0.6,
        metadata: { category: 'packaging' }
      },
      {
        id: 'node-outage-product-1',
        type: 'product',
        label: 'Classic Cola',
        sublabel: '$9,800 at risk',
        color: '#0369A1',
        position: [3, 3, 0],
        size: 0.6,
        metadata: { impactAmount: 9_800 }
      },
      {
        id: 'node-outage-product-2',
        type: 'product',
        label: 'Zero Cola',
        sublabel: '$6,000 at risk',
        color: '#0369A1',
        position: [3, 1, 0],
        size: 0.6,
        metadata: { impactAmount: 6_000 }
      },
      {
        id: 'node-outage-impact',
        type: 'impact',
        label: '$15,800',
        sublabel: 'Potential margin loss',
        color: '#F59E0B',
        position: [6, 2, 0],
        size: 1.0,
        metadata: { amount: 15_800, type: 'margin' }
      }
    ],
    connections: [
      { from: 'node-outage-event', to: 'node-outage-supplier', strength: 1.0 },
      { from: 'node-outage-supplier', to: 'node-outage-component', strength: 1.0 },
      { from: 'node-outage-component', to: 'node-outage-product-1', strength: 0.8 },
      { from: 'node-outage-component', to: 'node-outage-product-2', strength: 0.6 },
      { from: 'node-outage-product-1', to: 'node-outage-impact', strength: 0.62 },
      { from: 'node-outage-product-2', to: 'node-outage-impact', strength: 0.38 }
    ]
  },

  calculationBreakdown: [
    {
      step: 1,
      description: 'Calculate daily production capacity',
      formula: 'Combined monthly units ÷ 30 days',
      values: { monthlyUnits: 13_400, days: 30 },
      result: 447
    },
    {
      step: 2,
      description: 'Determine available safety stock',
      formula: 'Current inventory - Reorder point',
      values: { currentInventory: 1880, reorderPoint: 3135 },
      result: -1255
    },
    {
      step: 3,
      description: 'Calculate units at risk (shortfall × days)',
      formula: 'Daily capacity × (Closure days - Safety stock days)',
      values: { dailyCapacity: 447, closureDays: 7, safetyStockDays: 4.2 },
      result: 890
    },
    {
      step: 4,
      description: 'Calculate margin at risk',
      formula: 'Units at risk × Weighted average margin',
      values: { unitsAtRisk: 890, avgMargin: 17.75 },
      result: 15_800
    }
  ]
};
