import type { ExternalEvent } from '../types/mock';

export const allEvents: ExternalEvent[] = [
  // Port Disruption Event (Primary Scenario)
  {
    id: 'event-port-001',
    title: 'East Coast Port Disruption',
    description: 'Major East Coast port operations expected to be suspended for approximately 10 days due to equipment failure affecting cargo handling operations.',
    occurred: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    type: 'port_disruption',
    severity: 'HIGH',
    source: 'Maritime News Network',
    sourceUrl: 'https://maritime-news.example.com/port-closure',
    affectedEntity: 'Atlantic Packaging',
    financialExposure: 24_500
  },

  // Commodity Price Increase Event
  {
    id: 'event-commodity-001',
    title: 'Aluminum Prices Increase 7%',
    description: 'Global aluminum prices surge 7% following production cuts at major smelting facilities. Industry analysts expect prices to remain elevated for Q2.',
    occurred: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    type: 'commodity_price',
    severity: 'MEDIUM',
    source: 'Commodity Market Report',
    sourceUrl: 'https://commodities.example.com/aluminum-prices',
    affectedEntity: 'Metro Aluminum',
    financialExposure: 8_200
  },

  // Supplier Outage Event
  {
    id: 'event-supplier-001',
    title: 'Atlantic Packaging Facility Closure',
    description: 'Atlantic Packaging announces temporary facility closure for maintenance and equipment upgrades. Expected duration: 5-7 days.',
    occurred: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    type: 'supplier_outage',
    severity: 'MEDIUM',
    source: 'Supplier Notification',
    affectedEntity: 'Atlantic Packaging',
    financialExposure: 15_800
  },

  // Low Priority Event
  {
    id: 'event-expansion-001',
    title: 'Atlantic Packaging Announces Facility Expansion',
    description: 'Atlantic Packaging announces plans for new production facility in Pennsylvania, expected to increase capacity by 30% by Q3 2027.',
    occurred: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    type: 'other',
    severity: 'LOW',
    source: 'Business Wire',
    sourceUrl: 'https://business-wire.example.com/atlantic-expansion'
  },

  // Another Low Priority Event
  {
    id: 'event-weather-001',
    title: 'Winter Storm Forecast for Midwest',
    description: 'Weather forecasts predict moderate winter storm affecting Midwest transportation corridors over the next 48 hours. Minor delays expected.',
    occurred: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    type: 'other',
    severity: 'LOW',
    source: 'Weather Service'
  },

  // Medium Priority
  {
    id: 'event-regulations-001',
    title: 'New Packaging Regulations Proposed',
    description: 'EPA proposes new sustainability standards for beverage packaging. Public comment period ends in 60 days.',
    occurred: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    type: 'other',
    severity: 'MEDIUM',
    source: 'Regulatory News',
    sourceUrl: 'https://regulations.example.com/epa-packaging'
  },

  // Critical Priority
  {
    id: 'event-recall-001',
    title: 'Aluminum Can Quality Issue Detected',
    description: 'Quality control testing reveals potential defect in recent batch of aluminum cans from Metro Aluminum. Investigation underway.',
    occurred: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    type: 'other',
    severity: 'CRITICAL',
    source: 'Internal Quality Report',
    affectedEntity: 'Metro Aluminum',
    financialExposure: 35_000
  }
];

// Helper function to get events by severity
export const getEventsBySeverity = (severity: string) => {
  return allEvents.filter(event => event.severity === severity);
};

// Helper function to get recent events
export const getRecentEvents = (count: number = 5) => {
  return [...allEvents]
    .sort((a, b) => b.occurred.getTime() - a.occurred.getTime())
    .slice(0, count);
};
