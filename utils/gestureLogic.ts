import { HandLandmark, GestureType } from '../types';

// Helper to calculate Euclidean distance
const distance = (a: HandLandmark, b: HandLandmark) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
};

export const detectGesture = (landmarks: HandLandmark[]): GestureType => {
  if (!landmarks || landmarks.length < 21) return 'NONE';

  // Key landmarks
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];

  // 1. PINCH (Grab): Thumb tip is close to Index tip
  const pinchDist = distance(thumbTip, indexTip);
  if (pinchDist < 0.05) {
    return 'PINCH';
  }

  // 2. FIST: All finger tips are close to the wrist (curled)
  // We check distance from tip to wrist compared to MCP (knuckle) to wrist, but a simple threshold works for demo
  const tips = [indexTip, middleTip, ringTip, pinkyTip];
  const avgDistToWrist = tips.reduce((acc, tip) => acc + distance(tip, wrist), 0) / 4;

  // Thresholds are empirical and depend on coordinate space (MediaPipe is usually normalized 0-1)
  if (avgDistToWrist < 0.35) { 
    return 'FIST';
  }

  // 3. OPEN PALM: Fingers are extended
  // Check if tips are far from wrist
  if (avgDistToWrist > 0.45) {
    return 'OPEN_PALM';
  }

  return 'NONE';
};
