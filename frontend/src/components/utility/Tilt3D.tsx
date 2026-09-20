import React from 'react';

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
  style,
}) => (
  <div className={`relative ${className}`} style={style}>
    {children}
  </div>
);
