import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from '../../utility/AnimatedNumber';
import { Tilt3D } from '../../utility/Tilt3D';

interface MetricCardProps {
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percentage';
  icon: React.ReactNode;
  trend?: { direction: 'up' | 'down' | 'neutral'; value: string; sentiment?: 'positive' | 'negative' };
  accentColor: string;
  delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  format,
  icon,
  trend,
  accentColor,
  delay = 0,
}) => {
  const trendColor = trend?.sentiment === 'positive'
    ? 'text-success'
    : trend?.sentiment === 'negative'
      ? 'text-error'
      : 'text-text-tertiary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Tilt3D tiltMax={15} scale={1.03} perspective={600}>
        <div
          className="relative overflow-hidden rounded-xl border border-border bg-bg-tertiary p-5"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Top accent gradient bar */}
          <div
            className="absolute top-0 left-0 h-1 w-full"
            style={{ background: accentColor }}
          />

          {/* Glass inner highlight */}
          <div
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
            }}
          />

          {/* Floating icon and trend */}
          <div className="flex items-start justify-between mb-3" style={{ transform: 'translateZ(20px)' }}>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg shadow-lg"
              style={{
                backgroundColor: `${accentColor}18`,
                color: accentColor,
                boxShadow: `0 4px 15px ${accentColor}20`,
              }}
            >
              {icon}
            </div>
            {trend && (
              <span className={`text-xs font-medium flex items-center gap-1 ${trendColor}`}>
                {trend.direction === 'up' && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {trend.direction === 'down' && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {trend.value}
              </span>
            )}
          </div>

          {/* Value - pops forward in 3D */}
          <div style={{ transform: 'translateZ(30px)' }}>
            <AnimatedNumber
              value={value}
              format={format}
              decimals={format === 'currency' ? 0 : 0}
              className="text-2xl font-bold text-text-primary block"
              duration={1400}
            />
          </div>

          <p
            className="text-xs text-text-tertiary font-medium uppercase tracking-wider mt-1"
            style={{ transform: 'translateZ(10px)' }}
          >
            {label}
          </p>

          {/* Background orb glow */}
          <div
            className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-10"
            style={{ background: accentColor }}
          />
          {/* Secondary depth orb */}
          <div
            className="pointer-events-none absolute -top-6 -left-6 h-16 w-16 rounded-full blur-xl opacity-5"
            style={{ background: accentColor }}
          />
        </div>
      </Tilt3D>
    </motion.div>
  );
};
