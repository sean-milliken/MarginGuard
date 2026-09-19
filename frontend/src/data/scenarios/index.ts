export { portDisruptionScenario } from './portDisruption';
export { commodityPriceScenario } from './commodityPrice';
export { supplierOutageScenario } from './supplierOutage';

import { portDisruptionScenario } from './portDisruption';
import { commodityPriceScenario } from './commodityPrice';
import { supplierOutageScenario } from './supplierOutage';

// Export all scenarios as array
export const allScenarios = [
  portDisruptionScenario,
  commodityPriceScenario,
  supplierOutageScenario
];

// Helper to get scenario by ID
export const getScenarioById = (id: string) => {
  return allScenarios.find((scenario) => scenario.id === id);
};

// Helper to get scenario by event ID
export const getScenarioByEventId = (eventId: string) => {
  return allScenarios.find((scenario) => scenario.eventId === eventId);
};
