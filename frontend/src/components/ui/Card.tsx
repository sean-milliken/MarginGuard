import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover3d?: boolean;
}

export function Card({ children, className = '', hover3d = true }: CardProps) {
  if (!hover3d) {
    return (
      <div className={`bg-bg-tertiary rounded-xl shadow-lg p-6 sm:p-8 border border-border ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`bg-bg-tertiary rounded-xl shadow-lg p-6 sm:p-8 border border-border ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        y: -8,
        scale: 1.01,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        transition: { duration: 0.2 }
      }}
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform'
      }}
    >
      {children}
    </motion.div>
  );
}
