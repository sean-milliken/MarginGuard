import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Tilt3DProps {
  children: React.ReactNode;
  className?: string;
  tiltMax?: number;
  scale?: number;
  glare?: boolean;
  perspective?: number;
  style?: React.CSSProperties;
}

export const Tilt3D: React.FC<Tilt3DProps> = ({
  children,
  className = '',
  tiltMax = 12,
  scale = 1.02,
  glare = true,
  perspective = 800,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotateX = (0.5 - y) * tiltMax;
      const rotateY = (x - 0.5) * tiltMax;

      setTransform({ rotateX, rotateY, scale });
      setGlarePos({ x: x * 100, y: y * 100, opacity: 0.15 });
    },
    [tiltMax, scale]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
    setGlarePos({ x: 50, y: 50, opacity: 0 });
  }, []);

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: transform.rotateX,
        rotateY: transform.rotateY,
        scale: transform.scale,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
      style={{
        transformStyle: 'preserve-3d',
        perspective,
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
      {glare && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl"
          animate={{ opacity: glarePos.opacity }}
          transition={{ duration: 0.2 }}
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
            zIndex: 10,
          }}
        />
      )}
    </motion.div>
  );
};
