import * as THREE from 'three';

export enum AppState {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  ZOOM = 'ZOOM'
}

export interface ParticleData {
  id: number;
  type: 'sphere' | 'box' | 'candy';
  color: THREE.Color;
  treePos: THREE.Vector3;
  scatterPos: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
}

export interface PhotoData {
  id: string;
  url: string;
  treePos: THREE.Vector3;
  scatterPos: THREE.Vector3;
  ratio: number;
}

export type GestureType = 'NONE' | 'FIST' | 'OPEN_PALM' | 'PINCH';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}
