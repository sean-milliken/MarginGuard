import type { Scenario } from '../../types/mock';

export const portDisruptionScenario: Scenario = {
  id: 'scenario-port-001',
  eventId: 'event-port-001',
  name: 'East Coast Port Closure Impact',
  summary:
    'Major East Coast port closure disrupts aluminum can supply chain for 10 days, putting $24,500 in product margin at risk for Classic Cola and Zero Cola production.',

  impactedSuppliers: ['supplier-atlantic'],
  impactedComponents: ['component-aluminum-cans'],
  impactedProducts: ['product-classic-cola', 'product-zero-cola'],

  financialImpact: {
    marginAtRisk: 24_500,
    revenueAtRisk: 61_000,
    affectedUnits: 1_400,
    timeHorizon: 10, // days
    confidence: 0.87,
    cashImpactRange: {
      min: 7_200, // Switch supplier cost
      max: 12_400 // Expedite inventory cost
    }
  },

  dependencyPath: {
    nodes: [
      {
        id: 'node-event',
        type: 'event',
        label: 'Port Disruption',
        sublabel: 'East Coast - 10 days',
        color: '#F59E0B', // warning amber
        position: [-6, 2, 0],
        size: 0.5,
        metadata: {
          severity: 'HIGH',
          duration: 10,
          location: 'Port of New York/New Jersey'
        }
      },
      {
        id: 'node-supplier',
        type: 'supplier',
        label: 'Atlantic Packaging',
        sublabel: '42% dependency',
        color: '#0EA5E9', // primary blue
        position: [-3, 2, 0],
        size: 0.7,
        metadata: {
          dependencyPercentage: 42,
          location: 'Newark, NJ',
          relationship: 'primary'
        }
      },
      {
        id: 'node-component',
        type: 'component',
        label: 'Aluminum Cans',
        sublabel: 'Primary packaging',
        color: '#38BDF8', // light blue
        position: [0, 2, 0],
        size: 0.6,
        metadata: {
          category: 'packaging',
          criticalComponent: true
        }
      },
      {
        id: 'node-product-1',
        type: 'product',
        label: 'Classic Cola',
        sublabel: '8,000 units/month',
        color: '#0369A1', // dark blue
        position: [3, 3, 0],
        size: 0.6,
        metadata: {
          margin: 17.5,
          units: 8000,
          impactAmount: 16_300
        }
      },
      {
        id: 'node-product-2',
        type: 'product',
        label: 'Zero Cola',
        sublabel: '5,400 units/month',
        color: '#0369A1', // dark blue
        position: [3, 1, 0],
        size: 0.6,
        metadata: {
          margin: 15.1,
          units: 5400,
          impactAmount: 8_200
        }
      },
      {
        id: 'node-impact',
        type: 'impact',
        label: '$24,500',
        sublabel: 'Margin at Risk',
        color: '#EF4444', // error red
        position: [6, 2, 0],
        size: 1.0,
        metadata: {
          amount: 24_500,
          type: 'margin',
          timeframe: '10 days'
        }
      }
    ],
    connections: [
      {
        from: 'node-event',
        to: 'node-supplier',
        label: 'Affects',
        strength: 1.0
      },
      {
        from: 'node-supplier',
        to: 'node-component',
        label: 'Supplies',
        strength: 1.0
      },
      {
        from: 'node-component',
        to: 'node-product-1',
        label: 'Required by',
        strength: 0.8
      },
      {
        from: 'node-component',
        to: 'node-product-2',
        label: 'Required by',
        strength: 0.6
      },
      {
        from: 'node-product-1',
        to: 'node-impact',
        label: '$16,300',
        strength: 0.67
      },
      {
        from: 'node-product-2',
        to: 'node-impact',
        label: '$8,200',
        strength: 0.33
      }
    ]
  },

  calculationBreakdown: [
    {
      step: 1,
      description: 'Calculate Classic Cola daily margin',
      formula: '(Monthly Units ÷ 30 days) × Margin per Unit',
      values: {
        monthlyUnits: 8000,
        days: 30,
        marginPerUnit: 17.5
      },
      result: 4666.67
    },
    {
      step: 2,
      description: 'Calculate Zero Cola daily margin',
      formula: '(Monthly Units ÷ 30 days) × Margin per Unit',
      values: {
        monthlyUnits: 5400,
        days: 30,
        marginPerUnit: 15.1
      },
      result: 2718.0
    },
    {
      step: 3,
      description: 'Calculate combined daily margin loss',
      formula: 'Classic Cola daily margin + Zero Cola daily margin',
      values: {
        classicDaily: 4666.67,
        zeroDaily: 2718.0
      },
      result: 7384.67
    },
    {
      step: 4,
      description: 'Calculate total margin at risk over disruption period',
      formula: 'Daily margin loss × Disruption duration',
      values: {
        dailyLoss: 7384.67,
        disruptionDays: 10
      },
      result: 24_500
    }
  ]
};
