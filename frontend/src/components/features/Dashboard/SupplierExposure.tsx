import type { Supplier } from "../../../types/mock";

export function SupplierExposure({
  suppliers,
}: {
  suppliers: Supplier[];
  delay?: number;
}) {
  const sorted = [...suppliers].sort(
    (a, b) => b.dependencyPercentage - a.dependencyPercentage,
  );
  return (
    <div className="space-y-5 py-4">
      <p className="text-sm text-text-secondary">
        Largest component sourcing share per supplier. Detailed allocations are
        in Company Data.
      </p>
      {sorted.map((supplier) => (
        <div key={supplier.id}>
          <div className="flex justify-between gap-4 mb-2">
            <span>{supplier.name}</span>
            <strong>{supplier.dependencyPercentage}%</strong>
          </div>
          <div
            role="meter"
            aria-label={supplier.name + " dependency"}
            aria-valuenow={supplier.dependencyPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 bg-bg-tertiary rounded"
          >
            <div
              className="h-2 bg-primary-600 rounded"
              style={{ width: supplier.dependencyPercentage + "%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
