export type EventType = 'MARGIN_CALL' | 'EARNINGS' | 'FILING' | 'NEWS' | 'OTHER';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SourceStatus = 'PENDING' | 'PROCESSED' | 'FAILED';
export type AnalysisStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';

export interface Company {
  companyId: string;
  name: string;
  ticker?: string;
  sector?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  eventId: string;
  companyId: string;
  type: EventType;
  severity: Severity;
  title: string;
  description?: string;
  occurredAt: string;
  createdAt: string;
}

export interface Source {
  sourceId: string;
  companyId: string;
  fileName: string;
  contentType: string;
  s3Key: string;
  status: SourceStatus;
  createdAt: string;
}

export interface ScenarioParameters {
  stressLevel?: number;
  horizonDays?: number;
  customFactors?: Record<string, number>;
}

export interface Scenario {
  scenarioId: string;
  name: string;
  parameters: ScenarioParameters;
}

export interface MarginBreakdown {
  category: string;
  current: number;
  projected: number;
  delta: number;
}

export interface AnalysisResult {
  marginImpact: number;
  riskScore: number;
  recommendations: string[];
  breakdown: MarginBreakdown[];
}

export interface Analysis {
  analysisId: string;
  companyId: string;
  sourceIds: string[];
  scenarioId?: string;
  status: AnalysisStatus;
  result?: AnalysisResult;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSourceRequest {
  companyId: string;
  fileName: string;
  contentType: string;
}

export interface CreateSourceResponse {
  sourceId: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface CreateAnalysisRequest {
  companyId: string;
  sourceIds: string[];
  scenarioId?: string;
}

export interface RunScenarioRequest {
  companyId: string;
  parameters?: ScenarioParameters;
}
