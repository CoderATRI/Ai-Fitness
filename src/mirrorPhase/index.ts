/**
 * Barrel export for the mirrorPhase module.
 */

export { MirrorPhaseController, MIRROR_THRESHOLD_PERFECT, MIRROR_THRESHOLD_PARTIAL, scoreToOutcome } from './MirrorPhaseController';
export type { MirrorOutcome, MirrorPhaseState, MirrorPhaseConfig } from './MirrorPhaseController';

export { scorePose, MIN_LANDMARK_VISIBILITY } from './MirrorScorer';
export type { PoseScoreResult, JointScore } from './MirrorScorer';

export { POSE_LIBRARY, DEFAULT_NEXUS_GAUNTLET, getPoseById } from './PoseTargetLibrary';
export type { PoseTarget, JointId, JointAngleSpec } from './PoseTargetLibrary';

export { MirrorPhaseOverlay } from './MirrorPhaseOverlay';
export type { MirrorRenderState } from './MirrorPhaseOverlay';
