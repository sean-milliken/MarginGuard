import type { SourceDocument } from '../types/mock';

export const allSources: SourceDocument[] = [
  // Port Disruption Sources
  {
    id: 'source-port-001',
    eventId: 'event-port-001',
    title: 'Port Authority Announcement - Operations Suspended',
    type: 'news',
    url: 'https://maritime-news.example.com/port-closure',
    publishedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    relevantExcerpt:
      'Operations are expected to remain suspended for approximately ten days due to critical equipment failure in the main cargo handling facility. The Port Authority estimates full restoration of services by the end of the month.',
    usedFor: [
      'Event classification (port disruption)',
      'Disruption duration estimate (10 days)',
      'Affected geography (East Coast)',
      'Impact timing assessment'
    ],
    confidence: 0.92
  },
  {
    id: 'source-port-002',
    eventId: 'event-port-001',
    title: 'Supplier Profile: Atlantic Packaging',
    type: 'internal',
    publishedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    relevantExcerpt:
      'Atlantic Packaging operates primary distribution center in Newark, NJ, with direct rail access to Port of New York/New Jersey. Approximately 85% of inbound shipments arrive via this port facility.',
    usedFor: [
      'Supplier location mapping',
      'Dependency path construction',
      'Port dependency confirmation (85%)',
      'Supply chain risk assessment'
    ],
    confidence: 0.95
  },
  {
    id: 'source-port-003',
    eventId: 'event-port-001',
    title: 'Component Inventory Analysis',
    type: 'internal',
    publishedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    relevantExcerpt:
      'Current aluminum can inventory: 4.2 days of production capacity. Standard reorder point: 7 days. Atlantic Packaging provides 100% of aluminum can supply with weekly deliveries.',
    usedFor: [
      'Inventory buffer assessment',
      'Supplier dependency confirmation (100%)',
      'Impact timeline calculation',
      'Component criticality verification'
    ],
    confidence: 0.98
  },
  {
    id: 'source-port-004',
    eventId: 'event-port-001',
    title: 'Production Schedule & Margin Data',
    type: 'internal',
    publishedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    relevantExcerpt:
      'Classic Cola: 8,000 units/month, $17.50 contribution margin per unit. Zero Cola: 5,400 units/month, $15.10 contribution margin per unit. Both products require aluminum can packaging.',
    usedFor: [
      'Financial impact calculation',
      'Revenue at risk estimation',
      'Product dependency mapping',
      'Margin calculation inputs'
    ],
    confidence: 1.0
  },

  // Commodity Price Sources
  {
    id: 'source-commodity-001',
    eventId: 'event-commodity-001',
    title: 'London Metal Exchange Report',
    type: 'report',
    url: 'https://commodities.example.com/aluminum-prices',
    publishedDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    relevantExcerpt:
      'Aluminum prices reached $2,847 per metric ton, up 7.2% from previous month following production cuts at major global smelters. Analysts project sustained elevated prices through Q2 2026.',
    usedFor: [
      'Event classification (commodity price increase)',
      'Price change magnitude (7%)',
      'Duration forecast (Q2 2026)',
      'Market trend analysis'
    ],
    confidence: 0.89
  },

  // Supplier Outage Sources
  {
    id: 'source-supplier-001',
    eventId: 'event-supplier-001',
    title: 'Atlantic Packaging Maintenance Notice',
    type: 'internal',
    publishedDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
    relevantExcerpt:
      'Scheduled maintenance and equipment upgrade at our Newark facility will require temporary closure from March 15-22. All existing orders will be fulfilled prior to closure. We recommend customers increase safety stock levels.',
    usedFor: [
      'Event type classification',
      'Duration estimate (5-7 days)',
      'Advance notice confirmation',
      'Mitigation planning'
    ],
    confidence: 0.96
  }
];

// Helper to get sources for a specific event
export const getSourcesByEvent = (eventId: string) => {
  return allSources.filter((source) => source.eventId === eventId);
};

// Helper to get sources by confidence level
export const getHighConfidenceSources = (threshold: number = 0.9) => {
  return allSources.filter((source) => source.confidence >= threshold);
};
