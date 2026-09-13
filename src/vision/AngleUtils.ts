import { Landmark } from '../types';
import { POSE_LANDMARKS } from './LandmarkUtils';

/**
 * Calculates angle ABC in degrees (vertex at B)
 * Returns values from 0 to 180 degrees
 */
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

/**
 * 2D Euclidean distance
 */
export function calculateDistance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates midpoint between two landmarks
 */
export function calculateMidpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: a.z !== undefined && b.z !== undefined ? (a.z + b.z) / 2 : undefined,
    visibility:
      a.visibility !== undefined && b.visibility !== undefined
        ? Math.min(a.visibility, b.visibility)
        : undefined,
  };
}

/**
 * Calculates torso length as distance between mid-shoulder and mid-hip.
 * Essential for scale-invariant distance measurements.
 */
export function calculateTorsoLength(landmarks: Landmark[]): number {
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return 0.3; // Default reasonable fallback
  }

  const midShoulder = calculateMidpoint(leftShoulder, rightShoulder);
  const midHip = calculateMidpoint(leftHip, rightHip);

  const length = calculateDistance(midShoulder, midHip);
  return Math.max(0.1, length);
}

/**
 * Calculates the deviation of the spine from vertical.
 * 0 degrees = perfectly upright.
 * > 35 degrees = leaning forward too much.
 */
export function calculateBackInclination(shoulder: Landmark, hip: Landmark): number {
  const dy = Math.abs(hip.y - shoulder.y);
  const dx = Math.abs(shoulder.x - hip.x);
  const angleRad = Math.atan2(dx, dy);
  return (angleRad * 180) / Math.PI;
}
