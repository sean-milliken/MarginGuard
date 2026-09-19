import type {
  Analysis,
  Company,
  IntelligenceEvent,
} from "../../backend/financial-engine/src/types";
import type { AnalysisOutcome } from "../../nemotron/src/analyze";
export interface ScenarioDefinition {
  id: string;
  name: string;
  event: IntelligenceEvent;
}
export interface ApplicationSnapshot {
  company: Company;
  scenarios: ScenarioDefinition[];
  selectedScenarioId: string;
  event: IntelligenceEvent;
  report: Analysis;
  source: { title: string; text: string; synthetic: true };
  intelligenceAvailable: boolean;
}
export interface AnalysisRecord {
  analysisId: string;
  companyId: string;
  createdAt: string;
  snapshot: ApplicationSnapshot;
}
export type IntelligenceOutcome = AnalysisOutcome;
