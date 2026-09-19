import React from 'react';
import { AnimatedNumber } from '../utility/AnimatedNumber';

interface StatProps {
  label: string;
  value: number;
  format?: 'currency' | 'percentage' | 'number' | 'decimal';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const Stat: React.FC<StatProps> = ({
  label,
  value,
  format = 'number',
  trend,
  trendValue,
  size = 'md',
  animated = true,
  className = ''
}) => {
  const sizeStyles = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl'
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-text-tertiary'
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-sm text-text-tertiary font-medium uppercase tracking-wide">
        {label}
      </p>

      <div className="flex items-baseline gap-2">
        {animated ? (
          <AnimatedNumber
            value={value}
            format={format}
            decimals={format === 'currency' ? 0 : format === 'percentage' ? 1 : 0}
            className={`font-bold text-text-primary ${sizeStyles[size]}`}
            duration={1200}
          />
        ) : (
          <span className={`font-bold text-text-primary ${sizeStyles[size]}`}>
            {format === 'currency' ? `$${value.toLocaleString()}` : value.toLocaleString()}
          </span>
        )}

        {trend && trendValue && (
          <span className={`text-sm font-medium flex items-center gap-1 ${trendColors[trend]}`}>
            {trend === 'up' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {trend === 'down' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
};
