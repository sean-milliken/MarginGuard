import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import {
  steelCityBeverages,
  allEvents,
  allScenarios,
  allResponses,
  allSources,
  evaluationMetrics,
  getScenarioById,
  getResponsesByScenario,
  getSourcesByEvent,
  type CompanyProfile,
  type ExternalEvent,
  type Scenario,
  type ResponseOption,
  type SourceDocument,
  type EvaluationMetrics
} from '../data';

interface DataContextType {
  // Core data
  company: CompanyProfile;
  events: ExternalEvent[];
  scenarios: Scenario[];
  responses: ResponseOption[];
  sources: SourceDocument[];
  evals: EvaluationMetrics;

  // Selected scenario management
  selectedScenarioId: string;
  setSelectedScenarioId: (id: string) => void;

  // Derived data (computed from selections)
  currentScenario: Scenario | undefined;
  currentEvent: ExternalEvent | undefined;
  currentResponses: ResponseOption[];
  currentSources: SourceDocument[];
  recommendedResponse: ResponseOption | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Default to port disruption scenario (primary demo)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-port-001');

  // Compute derived data based on selected scenario
  const value = useMemo(() => {
    const currentScenario = getScenarioById(selectedScenarioId);
    const currentEvent = currentScenario
      ? allEvents.find((e) => e.id === currentScenario.eventId)
      : undefined;
    const currentResponses = getResponsesByScenario(selectedScenarioId);
    const currentSources = currentScenario
      ? getSourcesByEvent(currentScenario.eventId)
      : [];
    const recommendedResponse = currentResponses.find((r) => r.recommended);

    return {
      // Core data
      company: steelCityBeverages,
      events: allEvents,
      scenarios: allScenarios,
      responses: allResponses,
      sources: allSources,
      evals: evaluationMetrics,

      // Selected scenario
      selectedScenarioId,
      setSelectedScenarioId,

      // Derived data
      currentScenario,
      currentEvent,
      currentResponses,
      currentSources,
      recommendedResponse
    };
  }, [selectedScenarioId]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Custom hook to use the data context
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
