/**
 * PoseTargetLibrary.ts
 *
 * Static configuration for Mirror Phase target poses.
 * Each PoseTarget is authored as a set of joint-angle constraints measured in degrees,
 * with per-joint importance weights and tolerance bands.
 *
 * All poses are designed to be legible from a frontal 2D webcam view —
 * no depth-axis (Z) poses are used.
 *
 * DO NOT modify joint angle scoring logic here — that lives in MirrorScorer.ts.
 */

import { POSE_LANDMARKS } from '../vision/LandmarkUtils';

// ─── Joint Identifiers ───────────────────────────────────────────────────────

/** A human-readable joint key used in PoseTarget definitions. */
export type JointId =
  | 'leftElbow'
  | 'rightElbow'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftHip'
  | 'rightHip';

// ─── Joint Angle Specification ────────────────────────────────────────────────

export interface JointAngleSpec {
  /** Target angle in degrees (0–180) */
  target: number;
  /** Acceptable deviation in degrees. Similarity decays from 1.0 → 0 over ±tolerance */
  tolerance: number;
  /**
   * Importance weight (0–1). Used in weighted average for overall score.
   * Higher = this joint matters more for recognizing the pose.
   */
  weight: number;
  /**
   * MediaPipe landmark indices: [A, B (vertex), C] for calculateAngle(A, B, C)
   */
  landmarks: [number, number, number];
}

// ─── Pose Target Data Structure ───────────────────────────────────────────────

export interface PoseTarget {
  /** Unique machine-readable ID */
  id: string;
  /** Human-readable display name shown in the UI */
  displayName: string;
  /** Emoji/icon used in the telegraph panel */
  silhouetteEmoji: string;
  /** Short instruction shown to the player during TELEGRAPH */
  instruction: string;
  /** Joint angle constraints that define this pose */
  joints: Partial<Record<JointId, JointAngleSpec>>;
}

// ─── Pose Library ─────────────────────────────────────────────────────────────

/**
 * Library of 4 camera-angle-forgiving frontal-plane poses.
 * Add new poses here without touching any control-flow code.
 */
export const POSE_LIBRARY: PoseTarget[] = [
  // ─── 1. Power Stance ───────────────────────────────────────────────────────
  // Wide legs, arms stretched fully out to the sides (T-pose style)
  {
    id: 'power_stance',
    displayName: 'POWER STANCE',
    silhouetteEmoji: '🦾',
    instruction: 'Spread your legs wide and stretch arms straight out to the sides!',
    joints: {
      leftElbow: {
        target: 170,     // nearly straight arm
        tolerance: 18,
        weight: 0.30,
        landmarks: [
          POSE_LANDMARKS.LEFT_SHOULDER,
          POSE_LANDMARKS.LEFT_ELBOW,
          POSE_LANDMARKS.LEFT_WRIST,
        ],
      },
      rightElbow: {
        target: 170,
        tolerance: 18,
        weight: 0.30,
        landmarks: [
          POSE_LANDMARKS.RIGHT_SHOULDER,
          POSE_LANDMARKS.RIGHT_ELBOW,
          POSE_LANDMARKS.RIGHT_WRIST,
        ],
      },
      leftKnee: {
        target: 155,     // legs spread but not fully locked
        tolerance: 20,
        weight: 0.20,
        landmarks: [
          POSE_LANDMARKS.LEFT_HIP,
          POSE_LANDMARKS.LEFT_KNEE,
          POSE_LANDMARKS.LEFT_ANKLE,
        ],
      },
      rightKnee: {
        target: 155,
        tolerance: 20,
        weight: 0.20,
        landmarks: [
          POSE_LANDMARKS.RIGHT_HIP,
          POSE_LANDMARKS.RIGHT_KNEE,
          POSE_LANDMARKS.RIGHT_ANKLE,
        ],
      },
    },
  },

  // ─── 2. Cross Guard ────────────────────────────────────────────────────────
  // Arms crossed tightly at chest, legs together
  {
    id: 'cross_guard',
    displayName: 'CROSS GUARD',
    silhouetteEmoji: '🛡️',
    instruction: 'Cross your arms tightly over your chest and stand tall!',
    joints: {
      leftElbow: {
        target: 55,      // tight elbow flex crossing chest
        tolerance: 20,
        weight: 0.35,
        landmarks: [
          POSE_LANDMARKS.LEFT_SHOULDER,
          POSE_LANDMARKS.LEFT_ELBOW,
          POSE_LANDMARKS.LEFT_WRIST,
        ],
      },
      rightElbow: {
        target: 55,
        tolerance: 20,
        weight: 0.35,
        landmarks: [
          POSE_LANDMARKS.RIGHT_SHOULDER,
          POSE_LANDMARKS.RIGHT_ELBOW,
          POSE_LANDMARKS.RIGHT_WRIST,
        ],
      },
      leftKnee: {
        target: 170,     // standing straight
        tolerance: 15,
        weight: 0.15,
        landmarks: [
          POSE_LANDMARKS.LEFT_HIP,
          POSE_LANDMARKS.LEFT_KNEE,
          POSE_LANDMARKS.LEFT_ANKLE,
        ],
      },
      rightKnee: {
        target: 170,
        tolerance: 15,
        weight: 0.15,
        landmarks: [
          POSE_LANDMARKS.RIGHT_HIP,
          POSE_LANDMARKS.RIGHT_KNEE,
          POSE_LANDMARKS.RIGHT_ANKLE,
        ],
      },
    },
  },

  // ─── 3. Wide V Arms ────────────────────────────────────────────────────────
  // Arms raised in a wide V above head, legs shoulder-width
  {
    id: 'wide_v_arms',
    displayName: 'WIDE V ARMS',
    silhouetteEmoji: '✌️',
    instruction: 'Raise both arms up in a wide V shape above your head!',
    joints: {
      leftShoulder: {
        target: 145,     // arm raised ~45° past horizontal
        tolerance: 20,
        weight: 0.30,
        landmarks: [
          POSE_LANDMARKS.LEFT_ELBOW,
          POSE_LANDMARKS.LEFT_SHOULDER,
          POSE_LANDMARKS.LEFT_HIP,
        ],
      },
      rightShoulder: {
        target: 145,
        tolerance: 20,
        weight: 0.30,
        landmarks: [
          POSE_LANDMARKS.RIGHT_ELBOW,
          POSE_LANDMARKS.RIGHT_SHOULDER,
          POSE_LANDMARKS.RIGHT_HIP,
        ],
      },
      leftElbow: {
        target: 160,     // elbow nearly straight for V shape
        tolerance: 18,
        weight: 0.20,
        landmarks: [
          POSE_LANDMARKS.LEFT_SHOULDER,
          POSE_LANDMARKS.LEFT_ELBOW,
          POSE_LANDMARKS.LEFT_WRIST,
        ],
      },
      rightElbow: {
        target: 160,
        tolerance: 18,
        weight: 0.20,
        landmarks: [
          POSE_LANDMARKS.RIGHT_SHOULDER,
          POSE_LANDMARKS.RIGHT_ELBOW,
          POSE_LANDMARKS.RIGHT_WRIST,
        ],
      },
    },
  },

  // ─── 4. Warrior Lunge ──────────────────────────────────────────────────────
  // Left knee bent in a deep lunge, right arm punched forward (extended)
  {
    id: 'warrior_lunge',
    displayName: 'WARRIOR LUNGE',
    silhouetteEmoji: '⚔️',
    instruction: 'Step into a deep lunge and punch one arm straight forward!',
    joints: {
      leftKnee: {
        target: 105,     // deep front knee bend ~105°
        tolerance: 18,
        weight: 0.35,
        landmarks: [
          POSE_LANDMARKS.LEFT_HIP,
          POSE_LANDMARKS.LEFT_KNEE,
          POSE_LANDMARKS.LEFT_ANKLE,
        ],
      },
      rightKnee: {
        target: 160,     // back leg nearly straight
        tolerance: 15,
        weight: 0.20,
        landmarks: [
          POSE_LANDMARKS.RIGHT_HIP,
          POSE_LANDMARKS.RIGHT_KNEE,
          POSE_LANDMARKS.RIGHT_ANKLE,
        ],
      },
      rightElbow: {
        target: 165,     // punching arm nearly fully extended
        tolerance: 18,
        weight: 0.25,
        landmarks: [
          POSE_LANDMARKS.RIGHT_SHOULDER,
          POSE_LANDMARKS.RIGHT_ELBOW,
          POSE_LANDMARKS.RIGHT_WRIST,
        ],
      },
      leftElbow: {
        target: 80,      // back arm bent back / guard
        tolerance: 22,
        weight: 0.20,
        landmarks: [
          POSE_LANDMARKS.LEFT_SHOULDER,
          POSE_LANDMARKS.LEFT_ELBOW,
          POSE_LANDMARKS.LEFT_WRIST,
        ],
      },
    },
  },
];

/**
 * Helper: get a pose by ID. Returns undefined if not found.
 */
export function getPoseById(id: string): PoseTarget | undefined {
  return POSE_LIBRARY.find((p) => p.id === id);
}

/**
 * The default gauntlet sequence used for NEXUS PRIME's Mirror Phase.
 * 3 poses selected for variety: V arms (high difficulty), power stance (moderate), cross guard (easy).
 */
export const DEFAULT_NEXUS_GAUNTLET: PoseTarget[] = [
  POSE_LIBRARY[0], // power_stance
  POSE_LIBRARY[2], // wide_v_arms
  POSE_LIBRARY[1], // cross_guard
];
