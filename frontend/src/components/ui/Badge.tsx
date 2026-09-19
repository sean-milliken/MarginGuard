import React from 'react';
import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    success: 'bg-success-bg text-success border-success',
    warning: 'bg-warning-bg text-warning border-warning',
    error: 'bg-error-bg text-error border-error',
    info: 'bg-info-bg text-info border-info',
    neutral: 'bg-bg-secondary text-text-secondary border-border'
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  return (
    <motion.span
      className={`inline-flex items-center rounded-full border font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        scale: 1.05,
        y: -2,
        transition: { duration: 0.2 }
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.span>
  );
};
