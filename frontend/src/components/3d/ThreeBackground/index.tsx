import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count: number;
  mousePosition: { x: number; y: number };
}

// Particle field component
const ParticleField: React.FC<ParticleFieldProps> = ({ count, mousePosition }) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate particle positions
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 50; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50; // z

      // Color - varying shades of blue
      const colorVariation = 0.5 + Math.random() * 0.5;
      colors[i * 3] = 0.23 * colorVariation; // R
      colors[i * 3 + 1] = 0.65 * colorVariation; // G
      colors[i * 3 + 2] = 0.91 * colorVariation; // B
    }

    return { positions, colors };
  }, [count]);

  // Animate particles
  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.elapsedTime;

    // Subtle rotation
    pointsRef.current.rotation.y = time * 0.015;
    pointsRef.current.rotation.x = time * 0.01;

    // Mouse parallax effect
    pointsRef.current.rotation.x += mousePosition.y * 0.02;
    pointsRef.current.rotation.z = mousePosition.x * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

interface ThreeBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}

const ThreeBackground: React.FC<ThreeBackgroundProps> = ({
  intensity = 'low',
  interactive = true
}) => {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  // Track mouse movement for parallax
  React.useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  // Particle count based on intensity
  const particleCount = {
    low: 1500,
    medium: 2500,
    high: 3500
  }[intensity];

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: 'low-power'
        }}
      >
        <ambientLight intensity={0.1} />
        <ParticleField count={particleCount} mousePosition={mousePosition} />
        <fog attach="fog" args={['#0A0E14', 20, 50]} />
      </Canvas>
    </div>
  );
};

export default ThreeBackground;
