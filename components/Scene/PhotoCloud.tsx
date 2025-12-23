import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { Image as DreiImage } from '@react-three/drei';
import { AppState, PhotoData } from '../../types';
import { TREE_HEIGHT, TREE_RADIUS, SCATTER_RADIUS } from '../../constants';

interface PhotoCloudProps {
  appState: AppState;
  photos: string[]; // URLs
}

// Wrapper for individual photo to handle its own animation
const PhotoItem: React.FC<{ 
  url: string; 
  index: number; 
  total: number; 
  appState: AppState 
}> = ({ url, index, total, appState }) => {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);

  const positions = useMemo(() => {
    // Tree Position (Outer layer of cone)
    const y = (index / total) * TREE_HEIGHT - (TREE_HEIGHT / 2) + 2; // Offset slightly
    const radiusAtY = ((TREE_HEIGHT / 2 - y) / TREE_HEIGHT) * TREE_RADIUS + 1.5; // Push out
    const angle = index * (Math.PI * 2 / 1.618); // Golden ratio for distribution
    const treePos = new THREE.Vector3(
      Math.cos(angle) * radiusAtY,
      y,
      Math.sin(angle) * radiusAtY
    );

    // Scatter Position
    const scatterPos = new THREE.Vector3(
      (Math.random() - 0.5) * SCATTER_RADIUS * 1.5,
      (Math.random() - 0.5) * SCATTER_RADIUS * 1.5,
      (Math.random() - 0.5) * SCATTER_RADIUS * 0.5
    );

    return { treePos, scatterPos };
  }, [index, total]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    const isTree = appState === AppState.TREE;
    const isZoom = appState === AppState.ZOOM;

    let targetPos = isTree ? positions.treePos : positions.scatterPos;
    let targetScale = isTree ? 1.5 : 2;
    let targetRot = new THREE.Euler(0, 0, 0);

    // Zoom Logic: First photo goes to center, others scatter back
    if (isZoom) {
      if (index === 0) {
        // Active photo
        targetPos = new THREE.Vector3(0, 0, 8); // Close to camera
        targetScale = 5;
        // Look at camera is handled by Drei Image usually, but we enforce upright
      } else {
        // Push others away
        targetPos = positions.scatterPos.clone().multiplyScalar(1.2);
        targetScale = 1;
      }
    }

    // Billboarding effect: simple lookAt camera for tree mode
    if (isTree || (isZoom && index !== 0)) {
        ref.current.lookAt(state.camera.position);
    } else if (isZoom && index === 0) {
        ref.current.rotation.set(0,0,0);
    }

    // Interpolation
    ref.current.position.lerp(targetPos, delta * 3);
    
    // Smooth Scale
    const currentScale = ref.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 3);
    ref.current.scale.setScalar(nextScale);

    // Hover effect (only if not zoom)
    if (hovered && !isZoom && !isTree) {
       ref.current.scale.setScalar(nextScale * 1.2);
    }
  });

  return (
    <group ref={ref}>
      <DreiImage 
        url={url} 
        transparent 
        opacity={1}
        side={THREE.DoubleSide}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      />
      {/* Golden Frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[1.05, 1.05, 0.05]} />
        <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
};

const PhotoCloud: React.FC<PhotoCloudProps> = ({ appState, photos }) => {
  return (
    <group>
      {photos.map((url, i) => (
        <PhotoItem 
          key={`${url}-${i}`} 
          url={url} 
          index={i} 
          total={photos.length} 
          appState={appState} 
        />
      ))}
    </group>
  );
};

export default PhotoCloud;
