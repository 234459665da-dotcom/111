import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Sparkles, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, N8AO } from '@react-three/postprocessing';
import * as THREE from 'three';
import Ornaments from './Ornaments';
import PhotoCloud from './PhotoCloud';
import Snow from './Snow';
import { AppState, HandLandmark } from '../../types';

interface ExperienceProps {
  appState: AppState;
  photos: string[];
  handLandmarksRef: React.MutableRefObject<HandLandmark[] | null>;
}

const SceneContent: React.FC<ExperienceProps> = ({ appState, photos, handLandmarksRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Gesture Rotation Logic
    // If in SCATTER or TREE mode, allow rotation based on hand position
    if (appState !== AppState.ZOOM) {
       // Continuous slow rotation
       groupRef.current.rotation.y += delta * 0.1;

       const landmarks = handLandmarksRef.current;
       if (landmarks && landmarks.length > 0) {
         // Map hand X (0-1) to rotation speed
         // 0.5 is center. < 0.5 rotate left, > 0.5 rotate right
         const handX = landmarks[9].x; // Middle finger knuckle
         const rotationForce = (handX - 0.5) * 2; // -1 to 1
         
         // Apply extra rotation from hand
         groupRef.current.rotation.y += rotationForce * delta * 2;
         
         // Slight tilt X based on Y
         const handY = landmarks[9].y;
         const tiltForce = (handY - 0.5) * 0.5;
         groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tiltForce, delta);
       }
    } else {
        // Stop rotation in Zoom
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, delta);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta);
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <Ornaments appState={appState} />
        <PhotoCloud appState={appState} photos={photos} />
        <Snow />
        <Sparkles count={200} scale={20} size={4} speed={0.4} opacity={0.5} color="#FFD700" />
      </group>

      <ambientLight intensity={0.5} color="#ccccff" />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffcc77" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff0000" />
      <spotLight position={[0, 20, 0]} angle={0.5} penumbra={1} intensity={2} color="#ffffff" />
    </>
  );
};

export const Experience: React.FC<ExperienceProps> = (props) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 25], fov: 45 }}
      gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#050505']} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>

      <EffectComposer multisampling={0}>
        <N8AO aoRadius={0.5} intensity={1} color="black" />
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.6} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
      
      {/* Enable OrbitControls for mouse fallback if hand detection is tricky */}
      <OrbitControls enableZoom={false} enablePan={false} dampingFactor={0.05} />
    </Canvas>
  );
};