import React from 'react';
import { motion } from 'framer-motion';
import { Tilt3D } from '../../utility/Tilt3D';
import type { ExternalEvent } from '../../../types/mock';

interface EventTimelineProps {
  events: ExternalEvent[];
  delay?: number;
  onEventClick?: (eventId: string) => void;
}

const severityConfig: Record<string, { color: string; bg: string; border: string; dot: string; glow: string }> = {
  CRITICAL: { color: 'text-error', bg: 'bg-error-bg', border: 'border-error/20', dot: 'bg-error', glow: 'rgba(239,68,68,0.3)' },
  HIGH: { color: 'text-error', bg: 'bg-error-bg', border: 'border-error/20', dot: 'bg-error', glow: 'rgba(239,68,68,0.3)' },
  MEDIUM: { color: 'text-text-secondary', bg: 'bg-bg-hover', border: 'border-border', dot: 'bg-text-secondary', glow: 'rgba(155,163,180,0.2)' },
  LOW: { color: 'text-success', bg: 'bg-success-bg', border: 'border-success/20', dot: 'bg-success', glow: 'rgba(16,185,129,0.2)' },
};

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  delay = 0,
  onEventClick,
}) => {
  const sorted = [...events]
    .sort((a, b) => b.occurred.getTime() - a.occurred.getTime())
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Tilt3D tiltMax={4} scale={1.005} perspective={1200}>
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-sm font-semibold text-text-primary">Recent Intelligence</h3>
            </div>
            <span className="text-xs text-text-tertiary">{events.length} events tracked</span>
          </div>

          <div className="divide-y divide-border">
            {sorted.map((event, index) => {
              const config = severityConfig[event.severity] || severityConfig.LOW;
              return (
                <motion.div
                  key={event.id}
                  className="group relative flex items-start gap-4 px-5 py-3.5 cursor-pointer transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: delay + 0.08 * index }}
                  onClick={() => onEventClick?.(event.id)}
                  whileHover={{ x: 4, backgroundColor: 'rgba(34,42,58,0.5)' }}
                >
                  <div className="flex flex-col items-center pt-1">
                    <motion.div
                      className={`h-2.5 w-2.5 rounded-full ${config.dot}`}
                      whileHover={{ scale: 1.5 }}
                      style={{ boxShadow: `0 0 8px ${config.glow}` }}
                    />
                    {index < sorted.length - 1 && (
                      <div className="mt-1 h-full w-px bg-border flex-1 min-h-[20px]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary-300 transition-colors">
                        {event.title}
                      </p>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.color} ${config.bg} border ${config.border}`}
                      >
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary truncate">{event.description}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-text-tertiary">{getTimeAgo(event.occurred)}</p>
                    {event.financialExposure && (
                      <p className="text-xs font-semibold text-error mt-0.5">
                        ${event.financialExposure.toLocaleString()}
                      </p>
                    )}
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

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
