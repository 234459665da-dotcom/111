import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Snow: React.FC = () => {
  const count = 1500;
  const mesh = useRef<THREE.Points>(null);

  // Generate initial positions and velocities
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vels: { x: number; y: number; z: number }[] = [];
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;     // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60; // z
      
      vels.push({
        x: (Math.random() - 0.5) * 0.05,
        y: Math.random() * 0.1 + 0.05,
        z: (Math.random() - 0.5) * 0.05,
      });
    }
    return { positions: pos, velocities: vels };
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    
    const posAttribute = mesh.current.geometry.attributes.position;
    const currentPositions = posAttribute.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Apply Velocity
      currentPositions[i * 3 + 1] -= velocities[i].y;
      currentPositions[i * 3] += velocities[i].x; // Slight drift
      currentPositions[i * 3 + 2] += velocities[i].z;

      // Reset when below ground
      if (currentPositions[i * 3 + 1] < -20) {
        currentPositions[i * 3 + 1] = 30; // Reset to top
        currentPositions[i * 3] = (Math.random() - 0.5) * 60;
        currentPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      }
    }
    
    posAttribute.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FFFFFF"
        size={0.15}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

export default Snow;