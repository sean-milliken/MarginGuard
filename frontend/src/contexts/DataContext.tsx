import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import type {
  ApplicationSnapshot,
  AnalysisRecord,
  IntelligenceOutcome,
} from "../../../shared/src/application";
import type { CompanyProfile, ExternalEvent, Scenario } from "../types/mock";
import { request } from "../lib/api";
import { useSetup } from "./SetupContext";
import { useAuth } from "./AuthContext";
interface DataContextType {
  snapshot: ApplicationSnapshot;
  analysisRevision: number;
  intelligenceSource: string | null;
  company: Pick<
    CompanyProfile,
    "id" | "name" | "industry" | "suppliers" | "products"
  >;
  events: ExternalEvent[];
  currentScenario: Scenario;
  currentEvent: ExternalEvent;
  busy: boolean;
  error: string | null;
  runScenario: (
    id: string,
    days?: number,
    severityPercent?: number,
    supplierId?: string,
  ) => Promise<ApplicationSnapshot | undefined>;
  intelligence: IntelligenceOutcome | null;
  analyzeText: (text: string) => Promise<void>;
}
const DataContext = createContext<DataContextType | undefined>(undefined);
export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { done, companyName } = useSetup();
  const [snapshot, setSnapshot] = useState<ApplicationSnapshot | null>(null);
  const [analysisRevision, setAnalysisRevision] = useState(0);
  const [intelligenceSource, setIntelligenceSource] = useState<string | null>(
    null,
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [intelligence, setIntelligence] = useState<IntelligenceOutcome | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);
  const requestVersion = useRef(0);
  useEffect(() => {
    requestVersion.current++;
    setBusy(false);
    if (!isAuthenticated || !done) {
      setSnapshot(null);
      setIntelligence(null);
      setIntelligenceSource(null);
      setError(null);
      return;
    }
    let active = true;
    setError(null);
    request<ApplicationSnapshot>("/dashboard")
      .then((data) => {
        if (active) setSnapshot(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
      requestVersion.current++;
    };
  }, [isAuthenticated, done, companyName, attempt]);
  const runScenario = useCallback(
    async (
      id: string,
      days?: number,
      severityPercent?: number,
      supplierId?: string,
    ) => {
      if (!snapshot) return;
      const version = ++requestVersion.current;
      setBusy(true);
      setError(null);
      try {
        const input =
          days === undefined
            ? { scenarioId: id }
            : {
                event: {
                  ...snapshot.event,
                  type: "logistics-disruption",
                  id: "custom-disruption",
                  disruptionDays: days,
                  unavailableBps: Math.round((severityPercent ?? 100) * 100),
                  supplierIds: supplierId
                    ? [supplierId]
                    : snapshot.event.supplierIds,
                  description: `User scenario: ${days} days of disruption at ${severityPercent ?? 100}% unavailable deliveries.`,
                },
              };
        const result = await request<AnalysisRecord>("/analyses", input);
        if (version !== requestVersion.current) return;
        setSnapshot(result.snapshot);
        setAnalysisRevision((previous) => previous + 1);
        setIntelligence(null);
        setIntelligenceSource(null);
        return result.snapshot;
      } catch (err) {
        if (version !== requestVersion.current) return;
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        if (version === requestVersion.current) setBusy(false);
      }
    },
    [snapshot],
  );
  const analyzeText = useCallback(
    async (text: string) => {
      if (!snapshot) return;
      const version = ++requestVersion.current;
      setBusy(true);
      setError(null);
      setIntelligence(null);
      setIntelligenceSource(text);
      try {
        const outcome = await request<IntelligenceOutcome>("/intelligence", {
          articleText: text,
          analysis: { event: snapshot.event },
        });
        if (version === requestVersion.current) setIntelligence(outcome);
      } catch (err) {
        if (version !== requestVersion.current) return;
        setError(
          err instanceof Error ? err.message : "Intelligence analysis failed",
        );
      } finally {
        if (version === requestVersion.current) setBusy(false);
      }
    },
    [snapshot],
  );
  if (!isAuthenticated || isLoading || !done) return <>{children}</>;
  if (!snapshot)
    return (
      <main className="p-12 text-text-primary">
        <h1>MarginGuard</h1>
        {error ? (
          <div role="alert">
            {error}
            <button
              className="ml-4 underline"
              onClick={() => setAttempt((x) => x + 1)}
            >
              Retry
            </button>
          </div>
        ) : (
          <p role="status">Loading company and financial analysis…</p>
        )}
      </main>
    );
  const { company: raw, event, report } = snapshot;
  const company: DataContextType["company"] = {
    id: raw.id,
    name: companyName || raw.name,
    industry: "Beverage manufacturing · synthetic dataset",
    suppliers: raw.suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      category: "Manufacturing supply",
      dependencyPercentage: Math.max(
        0,
        ...raw.components.flatMap((c) =>
          c.sources
            .filter((source) => source.supplierId === s.id)
            .map((source) => source.dependencyBps / 100),
        ),
      ),
      relationship: raw.components.some((c) =>
        c.sources.some(
          (source) =>
            source.supplierId === s.id && source.dependencyBps >= 5000,
        ),
      )
        ? "primary"
        : "secondary",
      components: raw.components
        .filter((c) => c.sources.some((source) => source.supplierId === s.id))
        .map((c) => c.id),
    })),
    products: raw.products.map((p) => ({
      id: p.id,
      name: p.name,
      unitsPerMonth: p.monthlyVolume,
      marginPerUnit: (p.sellingPriceCents - p.variableCostCents) / 100,
      totalMargin:
        (p.monthlyVolume * (p.sellingPriceCents - p.variableCostCents)) / 100,
      components: p.billOfMaterials.map((b) => b.componentId),
    })),
  };
  const currentEvent: ExternalEvent = {
    id: event.id,
    title:
      event.type === "irrelevant"
        ? "No material exposure detected"
        : "Supplier freight disruption",
    description: event.description,
    occurred: new Date("2026-09-19T12:00:00Z"),
    type: "port_disruption",
    severity: report.affectedUnits ? "HIGH" : "LOW",
    source: "Synthetic scenario",
    affectedEntity: event.supplierIds
      .map((id) => raw.suppliers.find((s) => s.id === id)?.name)
      .join(", "),
    financialExposure: report.contributionMarginAtRiskCents / 100,
  };
  const currentScenario: Scenario = {
    id: snapshot.selectedScenarioId,
    eventId: event.id,
    name: "Logistics disruption",
    summary: event.description,
    impactedSuppliers: report.affectedSuppliers,
    impactedComponents: report.affectedComponents.map((c) => c.componentId),
    impactedProducts: report.affectedProducts.map((p) => p.productId),
    financialImpact: {
      marginAtRisk: report.contributionMarginAtRiskCents / 100,
      revenueAtRisk: report.revenueAtRiskCents / 100,
      affectedUnits: report.affectedUnits,
      timeHorizon: event.disruptionDays,
      cashImpactRange: {
        min: report.cashImpactCents / 100,
        max: report.cashImpactCents / 100,
      },
    },
    dependencyPath: { nodes: [], connections: [] },
    calculationBreakdown: report.calculationSteps.map((s, i) => ({
      step: i + 1,
      description: s.formula,
      result: s.result,
      values: { unit: s.unit },
    })),
  };
  return (
    <DataContext.Provider
      value={{
        snapshot,
        analysisRevision,
        intelligenceSource,
        company,
        events: [currentEvent],
        currentScenario,
        currentEvent,
        busy,
        error,
        runScenario,
        intelligence,
        analyzeText,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
export function useData() {
  const context = useContext(DataContext);
  if (!context)
    throw new Error("useData requires an authenticated DataProvider");
  return context;
}
