import React from 'react';
import { motion } from 'framer-motion';
import { Tilt3D } from '../../utility/Tilt3D';
import type { Supplier } from '../../../types/mock';

interface SupplierExposureProps {
  suppliers: Supplier[];
  delay?: number;
}

export const SupplierExposure: React.FC<SupplierExposureProps> = ({
  suppliers,
  delay = 0,
}) => {
  const sorted = [...suppliers].sort(
    (a, b) => b.dependencyPercentage - a.dependencyPercentage
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Tilt3D tiltMax={6} scale={1.01} perspective={900}>
        <div
          className="relative overflow-hidden rounded-xl border border-border bg-bg-tertiary"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Glass reflection */}
          <div
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%)',
            }}
          />

          <div className="flex items-center justify-between border-b border-border px-5 py-4"
            style={{ transform: 'translateZ(10px)' }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-sm font-semibold text-text-primary">How dependent are we on each supplier?</h3>
            </div>
            <span className="text-xs text-text-tertiary">{suppliers.length} suppliers</span>
          </div>

          <div className="p-5 space-y-4" style={{ transform: 'translateZ(15px)' }}>
            {sorted.map((supplier, index) => {
              const isHigh = supplier.dependencyPercentage > 30;
              const barColor = isHigh ? 'bg-error' : 'bg-success';
              const textColor = 'text-text-primary';
              const glowColor = isHigh ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)';

              return (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: delay + 0.1 * index }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary">{supplier.name}</p>
                      <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium px-1.5 py-0.5 rounded bg-bg-hover">
                        {supplier.relationship}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${textColor}`}>
                      {supplier.dependencyPercentage}%
                    </span>
                  </div>
                  {supplier.location && (
                    <p className="text-xs text-text-tertiary mb-2">{supplier.location}</p>
                  )}
                  <div className="h-2 w-full rounded-full bg-bg-primary overflow-hidden"
                    style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
                  >
                    <motion.div
                      className={`h-full rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${supplier.dependencyPercentage}%` }}
                      transition={{ duration: 1.2, delay: delay + 0.15 * index, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ boxShadow: `0 0 10px ${glowColor}` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Tilt3D>
    </motion.div>
  );
};
