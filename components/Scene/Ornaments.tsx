import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AppState, ParticleData } from '../../types';
import { PARTICLE_COUNT, TREE_HEIGHT, TREE_RADIUS, SCATTER_RADIUS, COLORS } from '../../constants';

interface OrnamentsProps {
  appState: AppState;
}

const Ornaments: React.FC<OrnamentsProps> = ({ appState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate particle data once
  const particles = useMemo(() => {
    const temp: ParticleData[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Tree Position (Cone Spiral)
      const y = (i / PARTICLE_COUNT) * TREE_HEIGHT - (TREE_HEIGHT / 2);
      const radiusAtY = ((TREE_HEIGHT / 2 - y) / TREE_HEIGHT) * TREE_RADIUS;
      const angle = i * 0.5; // Spiral density
      const treePos = new THREE.Vector3(
        Math.cos(angle) * radiusAtY,
        y,
        Math.sin(angle) * radiusAtY
      );

      // Scatter Position (Random Sphere)
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = SCATTER_RADIUS * Math.cbrt(Math.random());
      const scatterPos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      // Attributes
      const typeRand = Math.random();
      const type = typeRand > 0.6 ? 'box' : 'sphere';
      
      const colorRand = Math.random();
      let color = COLORS.GOLD;
      if (colorRand < 0.33) color = COLORS.MATTE_GREEN;
      else if (colorRand < 0.66) color = COLORS.RED;

      temp.push({
        id: i,
        type,
        color,
        treePos,
        scatterPos,
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        scale: Math.random() * 0.4 + 0.1
      });
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Determine target based on state
    // Zoom state acts like Scatter for background particles, but we might push them back slightly
    const isTree = appState === AppState.TREE;
    
    // Smooth transition speed
    const lerpFactor = THREE.MathUtils.clamp(delta * 2, 0, 1);

    particles.forEach((particle, i) => {
      const targetPos = isTree ? particle.treePos : particle.scatterPos;

      // Current instance matrix
      meshRef.current!.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      // Interpolate position
      dummy.position.lerp(targetPos, lerpFactor);
      
      // Rotate constantly for life
      dummy.rotation.x += delta * 0.2;
      dummy.rotation.y += delta * 0.2;

      // Pulse scale in Tree mode
      const pulse = isTree ? Math.sin(state.clock.elapsedTime * 2 + i) * 0.1 + 1 : 1;
      dummy.scale.setScalar(particle.scale * pulse);

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, particle.color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        roughness={0.2} 
        metalness={0.8} 
        emissive={new THREE.Color('#333333')}
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  );
};

export default Ornaments;
