import type { ResponseOption } from '../types/mock';

export const allResponses: ResponseOption[] = [
  // Port Disruption Responses
  {
    id: 'response-port-switch',
    scenarioId: 'scenario-port-001',
    name: 'Switch Supplier',
    description:
      'Temporarily source aluminum cans from alternative supplier (Metro Aluminum) to maintain production continuity during port closure.',
    cost: 7_200,
    revenueProtected: 61_000,
    expectedBenefit: 17_300,
    netImpact: 10_100, // benefit - cost
    timeToImplement: 3, // days
    liquidityImpact: 'low',
    risk: 'low',
    risks: [
      'Slightly higher per-unit cost from alternative supplier',
      'Potential quality variance in packaging',
      'Logistics coordination required'
    ],
    requirements: [
      'Verify Metro Aluminum has available capacity',
      'Negotiate expedited delivery terms',
      'Update production schedules'
    ],
    recommended: true,
    recommendationReason:
      'Switching suppliers protects similar revenue while requiring less immediate cash than expedited inventory. Fastest implementation with lowest risk profile.'
  },
  {
    id: 'response-port-expedite',
    scenarioId: 'scenario-port-001',
    name: 'Expedite Inventory',
    description:
      'Pre-purchase and expedite shipping of aluminum can inventory before port closure fully impacts supply chain.',
    cost: 12_400,
    revenueProtected: 61_000,
    expectedBenefit: 12_100,
    netImpact: -300, // benefit - cost
    timeToImplement: 5, // days
    liquidityImpact: 'medium',
    risk: 'medium',
    risks: [
      'Higher upfront capital required',
      'Premium freight costs',
      'Inventory carrying costs',
      'May not arrive in time if port delays extend'
    ],
    requirements: [
      'Secure expedited shipping arrangement',
      'Allocate warehouse space for additional inventory',
      'Approve emergency procurement budget'
    ],
    recommended: false
  },
  {
    id: 'response-port-wait',
    scenarioId: 'scenario-port-001',
    name: 'Do Nothing',
    description:
      'Accept production disruption and wait for port operations to resume. Absorb margin loss and potential customer impact.',
    cost: 0,
    revenueProtected: 0,
    expectedBenefit: -24_500,
    netImpact: -24_500,
    timeToImplement: 0,
    liquidityImpact: 'low',
    risk: 'high',
    risks: [
      'Complete loss of estimated margin ($24,500)',
      'Production downtime',
      'Potential customer dissatisfaction',
      'Market share loss to competitors',
      'Risk of extended port closure beyond 10 days'
    ],
    requirements: [
      'Communication plan for customers',
      'Prepare for production halt'
    ],
    recommended: false
  },

  // Commodity Price Responses (placeholder for future)
  {
    id: 'response-commodity-lock',
    scenarioId: 'scenario-commodity-001',
    name: 'Lock in Current Prices',
    description:
      'Enter into forward contract to lock current aluminum prices for next 6 months before increase takes effect.',
    cost: 3_500,
    revenueProtected: 45_000,
    expectedBenefit: 12_800,
    netImpact: 9_300,
    timeToImplement: 2,
    liquidityImpact: 'low',
    risk: 'low',
    risks: ['Price protection ends after contract term'],
    requirements: ['Negotiate forward contract', 'Legal review'],
    recommended: true,
    recommendationReason:
      'Provides price certainty and protects margins with minimal cash outlay.'
  },
  {
    id: 'response-commodity-absorb',
    scenarioId: 'scenario-commodity-001',
    name: 'Absorb Cost Increase',
    description:
      'Accept higher input costs and absorb into existing margins without passing to customers.',
    cost: 8_200,
    revenueProtected: 45_000,
    expectedBenefit: 0,
    netImpact: -8_200,
    timeToImplement: 0,
    liquidityImpact: 'medium',
    risk: 'high',
    risks: ['Permanent margin compression', 'Reduced profitability'],
    requirements: ['Adjust financial projections'],
    recommended: false
  },

  // Supplier Outage Responses (placeholder for future)
  {
    id: 'response-outage-inventory',
    scenarioId: 'scenario-supplier-001',
    name: 'Use Safety Stock',
    description:
      'Utilize existing safety stock of components while Atlantic Packaging facility undergoes maintenance.',
    cost: 0,
    revenueProtected: 52_000,
    expectedBenefit: 15_800,
    netImpact: 15_800,
    timeToImplement: 1,
    liquidityImpact: 'low',
    risk: 'low',
    risks: ['Safety stock will need replenishment', 'Limited buffer remaining'],
    requirements: ['Monitor inventory levels', 'Plan for restocking'],
    recommended: true,
    recommendationReason:
      'No additional cost while maintaining production. Safety stock is designed for exactly this scenario.'
  }
];

// Helper to get responses for a specific scenario
export const getResponsesByScenario = (scenarioId: string) => {
  return allResponses.filter((response) => response.scenarioId === scenarioId);
};

// Helper to get recommended response
export const getRecommendedResponse = (scenarioId: string) => {
  return allResponses.find(
    (response) => response.scenarioId === scenarioId && response.recommended
  );
};
