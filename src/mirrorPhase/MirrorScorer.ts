/**
 * MirrorScorer.ts
 *
 * Pure, stateless scoring functions for the Mirror Phase.
 * No side effects. No React. Fully unit-testable in isolation.
 *
 * Scoring model:
 *   - For each joint in the PoseTarget:
 *       rawDev  = |playerAngle - target|
 *       clamped = min(rawDev, 2 * tolerance)
 *       score   = 1 - (clamped / (2 * tolerance))   → [0, 1]
 *   - Per-joint scores are combined via weighted average → overall [0, 100]
 *   - If a landmark has visibility < MIN_LANDMARK_VISIBILITY, its joint score = 0
 *     (penalises leaving frame — treated as failed joint, not ignored).
 */

import { Landmark } from '../types';
import { calculateAngle } from '../vision/AngleUtils';
import { JointId, PoseTarget } from './PoseTargetLibrary';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Below this visibility a landmark is considered out-of-frame. Joint score = 0. */
export const MIN_LANDMARK_VISIBILITY = 0.35;

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface JointScore {
  /** Normalized score for this joint: 0 (no match) → 1 (perfect) */
  score: number;
  /** Player's measured angle in degrees */
  playerAngle: number;
  /** Target angle from PoseTarget */
  targetAngle: number;
  /** Whether the landmark was visible enough to score */
  visible: boolean;
}

export interface PoseScoreResult {
  /** Weighted overall similarity score 0–100 */
  overallScore: number;
  /** Per-joint breakdowns, keyed by JointId */
  jointScores: Partial<Record<JointId, JointScore>>;
  /** True if ALL relevant landmarks had sufficient visibility */
  allVisible: boolean;
}

// ─── Core Scoring Function ────────────────────────────────────────────────────

/**
 * Score the player's current pose against a PoseTarget.
 *
 * @param landmarks - Smoothed MediaPipe landmarks (33 elements)
 * @param target    - The PoseTarget to score against
 * @returns         - PoseScoreResult with per-joint and overall scores
 */
export function scorePose(landmarks: Landmark[], target: PoseTarget): PoseScoreResult {
  const jointScores: Partial<Record<JointId, JointScore>> = {};

  // Guard: empty or malformed landmarks
  if (!landmarks || landmarks.length < 33) {
    const emptyScores: Partial<Record<JointId, JointScore>> = {};
    for (const jointId of Object.keys(target.joints) as JointId[]) {
      const spec = target.joints[jointId]!;
      emptyScores[jointId] = {
        score: 0,
        playerAngle: 0,
        targetAngle: spec.target,
        visible: false,
      };
    }
    return { overallScore: 0, jointScores: emptyScores, allVisible: false };
  }

  let weightedSum = 0;
  let totalWeight = 0;
  let allVisible = true;

  for (const [jointIdStr, spec] of Object.entries(target.joints)) {
    const jointId = jointIdStr as JointId;
    const [idxA, idxB, idxC] = spec.landmarks;

    const lmA = landmarks[idxA];
    const lmB = landmarks[idxB];
    const lmC = landmarks[idxC];

    // Check visibility for all three landmarks involved
    const visible = isVisible(lmA) && isVisible(lmB) && isVisible(lmC);

    if (!visible) {
      allVisible = false;
      jointScores[jointId] = {
        score: 0,
        playerAngle: 0,
        targetAngle: spec.target,
        visible: false,
      };
      // Still add weight (score=0) so out-of-frame joints penalise total score
      weightedSum += 0;
      totalWeight += spec.weight;
      continue;
    }

    const playerAngle = calculateAngle(lmA, lmB, lmC);
    const rawDev = Math.abs(playerAngle - spec.target);

    // Decay: perfect at 0 deviation, 0 at 2×tolerance deviation
    const maxDev = 2 * spec.tolerance;
    const clamped = Math.min(rawDev, maxDev);
    const jointScore = 1.0 - clamped / maxDev;

    jointScores[jointId] = {
      score: jointScore,
      playerAngle,
      targetAngle: spec.target,
      visible: true,
    };

    weightedSum += jointScore * spec.weight;
    totalWeight += spec.weight;
  }

  const overallScore = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 100)
    : 0;

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    jointScores,
    allVisible,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isVisible(lm: Landmark | undefined): boolean {
  if (!lm) return false;
  if (lm.visibility === undefined) return true; // assume visible if no confidence data
  return lm.visibility >= MIN_LANDMARK_VISIBILITY;
}
