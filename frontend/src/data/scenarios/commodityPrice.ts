import type { Scenario } from '../../types/mock';

export const commodityPriceScenario: Scenario = {
  id: 'scenario-commodity-001',
  eventId: 'event-commodity-001',
  name: 'Aluminum Price Increase Impact',
  summary:
    'Global aluminum price surge of 7% affects input costs for aluminum can packaging, impacting margins across Classic Cola and Zero Cola product lines.',

  impactedSuppliers: ['supplier-metro'],
  impactedComponents: ['component-aluminum-cans'],
  impactedProducts: ['product-classic-cola', 'product-zero-cola'],

  financialImpact: {
    marginAtRisk: 8_200,
    revenueAtRisk: 45_000,
    affectedUnits: 13_400, // Combined Classic + Zero
    timeHorizon: 90, // days (Q2)
    confidence: 0.82,
    cashImpactRange: {
      min: 0, // Do nothing
      max: 8_200 // Full absorption
    }
  },

  dependencyPath: {
    nodes: [
      {
        id: 'node-commodity-event',
        type: 'event',
        label: 'Aluminum Price Increase',
        sublabel: '7% increase',
        color: '#F59E0B',
        position: [-6, 2, 0],
        size: 0.5,
        metadata: { severity: 'MEDIUM', priceChange: 0.07 }
      },
      {
        id: 'node-commodity-supplier',
        type: 'supplier',
        label: 'Metro Aluminum',
        sublabel: '31% dependency',
        color: '#0EA5E9',
        position: [-3, 2, 0],
        size: 0.7,
        metadata: { dependencyPercentage: 31 }
      },
      {
        id: 'node-commodity-component',
        type: 'component',
        label: 'Aluminum Cans',
        sublabel: 'Input cost increase',
        color: '#38BDF8',
        position: [0, 2, 0],
        size: 0.6,
        metadata: { category: 'packaging' }
      },
      {
        id: 'node-commodity-product-1',
        type: 'product',
        label: 'Classic Cola',
        sublabel: '$5,100 margin impact',
        color: '#0369A1',
        position: [3, 3, 0],
        size: 0.6,
        metadata: { impactAmount: 5_100 }
      },
      {
        id: 'node-commodity-product-2',
        type: 'product',
        label: 'Zero Cola',
        sublabel: '$3,100 margin impact',
        color: '#0369A1',
        position: [3, 1, 0],
        size: 0.6,
        metadata: { impactAmount: 3_100 }
      },
      {
        id: 'node-commodity-impact',
        type: 'impact',
        label: '$8,200',
        sublabel: 'Quarterly margin pressure',
        color: '#F59E0B',
        position: [6, 2, 0],
        size: 1.0,
        metadata: { amount: 8_200, type: 'margin' }
      }
    ],
    connections: [
      { from: 'node-commodity-event', to: 'node-commodity-supplier', strength: 1.0 },
      { from: 'node-commodity-supplier', to: 'node-commodity-component', strength: 1.0 },
      { from: 'node-commodity-component', to: 'node-commodity-product-1', strength: 0.8 },
      { from: 'node-commodity-component', to: 'node-commodity-product-2', strength: 0.6 },
      { from: 'node-commodity-product-1', to: 'node-commodity-impact', strength: 0.62 },
      { from: 'node-commodity-product-2', to: 'node-commodity-impact', strength: 0.38 }
    ]
  },

  calculationBreakdown: [
    {
      step: 1,
      description: 'Calculate quarterly aluminum can usage',
      formula: '(Classic Cola units + Zero Cola units) × 3 months',
      values: { classicUnits: 8000, zeroUnits: 5400, months: 3 },
      result: 40_200
    },
    {
      step: 2,
      description: 'Calculate price increase per unit',
      formula: 'Average can cost × 7% price increase',
      values: { avgCanCost: 0.29, priceIncrease: 0.07 },
      result: 0.0203
    },
    {
      step: 3,
      description: 'Calculate total quarterly margin impact',
      formula: 'Total units × Price increase per unit',
      values: { totalUnits: 40_200, priceIncreasePerUnit: 0.0203 },
      result: 8_200
    }
  ]
};
