/**
 * MirrorPhaseController.ts
 *
 * Finite State Machine for the NEXUS PRIME Mirror Phase mechanic.
 *
 * States:
 *   IDLE → TELEGRAPH → COUNTDOWN → ACTIVE_MATCHING → RESOLVED → (loop or EXIT)
 *
 * This controller is completely decoupled from React and the existing exercise
 * state machines. It communicates exclusively via typed events / callbacks.
 * No global state is mutated. Callers integrate via the public event API.
 *
 * Fail-safes:
 *   - All timers stored and cleared in cancel().
 *   - If no valid frames are scored during ACTIVE_MATCHING → auto-resolve as 'failed'.
 *   - If cancel() is called mid-phase, onCancel fires, all timers cleared immediately.
 *   - Multiple rapid re-entries are safe: cancel() fully resets before start() can run.
 */

import { Landmark } from '../types';
import { PoseTarget } from './PoseTargetLibrary';
import { scorePose, PoseScoreResult } from './MirrorScorer';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Minimum overall score (0-100) required for a Perfect Mirror outcome */
export const MIRROR_THRESHOLD_PERFECT = 85;
/** Minimum overall score for a Partial Match outcome (below = Failed) */
export const MIRROR_THRESHOLD_PARTIAL = 60;

// ─── Types ────────────────────────────────────────────────────────────────────

export type MirrorOutcome = 'perfect' | 'partial' | 'failed';

export type MirrorPhaseState =
  | 'IDLE'
  | 'TELEGRAPH'
  | 'COUNTDOWN'
  | 'ACTIVE_MATCHING'
  | 'RESOLVED'
  | 'COMPLETE'
  | 'CANCELLED';

export interface MirrorPhaseConfig {
  /** Duration (ms) to show the target pose silhouette before countdown. Default: 3000 */
  telegraphDurationMs?: number;
  /** Duration (ms) of animated countdown ring. Default: 2000 */
  countdownDurationMs?: number;
  /** Duration (ms) of the live scoring window. Default: 3000 */
  matchingWindowMs?: number;
  /** Pause (ms) after resolution before next pose. Default: 1000 */
  resolvedPauseDurationMs?: number;

  // ─── Required Callbacks ────────────────────────────────────────────────────
  /** Called when NEXUS PRIME announces the Mirror Phase and shows the target pose */
  onTelegraphStart: (pose: PoseTarget, poseIndex: number, total: number) => void;
  /** Called each second during COUNTDOWN. secondsLeft counts down from N to 1 */
  onCountdownTick: (secondsLeft: number) => void;
  /** Called when the scoring window opens */
  onMatchingWindowOpen: (pose: PoseTarget) => void;
  /** Called each frame during ACTIVE_MATCHING with the latest real-time score */
  onFrameScored: (result: PoseScoreResult) => void;
  /** Called when a single pose is resolved; outcome is applied externally via this callback */
  onPoseResolved: (pose: PoseTarget, bestScore: number, outcome: MirrorOutcome) => void;
  /** Called when the entire gauntlet (all poses) has been completed */
  onSequenceComplete: (avgScore: number, outcomes: MirrorOutcome[]) => void;
  /** Called if cancel() is invoked mid-phase */
  onCancel: () => void;
}

// ─── Controller ───────────────────────────────────────────────────────────────

export class MirrorPhaseController {
  private readonly telegraphMs: number;
  private readonly countdownMs: number;
  private readonly matchingMs: number;
  private readonly resolvedPauseMs: number;
  private readonly config: MirrorPhaseConfig;

  private state: MirrorPhaseState = 'IDLE';
  private poses: PoseTarget[] = [];
  private poseIndex: number = 0;

  /** All collected best scores across the gauntlet */
  private gauntletBestScores: number[] = [];
  private gauntletOutcomes: MirrorOutcome[] = [];

  /** Best score achieved in the CURRENT pose matching window */
  private currentBestScore: number = 0;
  private currentFrameResult: PoseScoreResult | null = null;

  /** Timer handles — ALL must be cleared in cancel() */
  private timers: ReturnType<typeof setTimeout>[] = [];
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private cancelled: boolean = false;

  constructor(config: MirrorPhaseConfig) {
    this.config = config;
    this.telegraphMs = config.telegraphDurationMs ?? 3000;
    this.countdownMs = config.countdownDurationMs ?? 2000;
    this.matchingMs = config.matchingWindowMs ?? 3000;
    this.resolvedPauseMs = config.resolvedPauseDurationMs ?? 1000;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Start a gauntlet sequence. Call cancel() first if reusing the controller. */
  public start(poses: PoseTarget[]): void {
    if (poses.length === 0) {
      console.warn('[MirrorPhase] start() called with empty pose list');
      return;
    }
    this.cancelled = false;
    this.poses = poses;
    this.poseIndex = 0;
    this.gauntletBestScores = [];
    this.gauntletOutcomes = [];
    this.runPose(0);
  }

  /**
   * Route a landmarks frame to the controller during ACTIVE_MATCHING.
   * Safe to call in any state — no-ops outside ACTIVE_MATCHING.
   */
  public processFrame(landmarks: Landmark[]): void {
    if (this.state !== 'ACTIVE_MATCHING' || this.cancelled) return;
    const pose = this.poses[this.poseIndex];
    if (!pose) return;

    const result = scorePose(landmarks, pose);
    this.currentFrameResult = result;

    // Track best (highest) similarity across entire window
    if (result.overallScore > this.currentBestScore) {
      this.currentBestScore = result.overallScore;
    }

    this.config.onFrameScored(result);
  }

  /**
   * Demo Mode: Force an outcome for the current pose, bypassing webcam scoring.
   * Triggers the full RESOLVED flow with a synthetic score.
   */
  public simulateOutcome(tier: 'perfect' | 'partial' | 'failed'): void {
    if (this.state !== 'ACTIVE_MATCHING' && this.state !== 'COUNTDOWN' && this.state !== 'TELEGRAPH') return;
    if (this.cancelled) return;

    // Map tier to a representative synthetic score
    const syntheticScore =
      tier === 'perfect' ? 92 :
      tier === 'partial' ? 72 :
      0;

    // Clear any running timers so they don't fire after simulation
    this.clearAllTimers();

    this.currentBestScore = syntheticScore;
    this.state = 'ACTIVE_MATCHING'; // pretend we were matching so resolve runs
    this.resolveCurrentPose();
  }

  /** Tear down cleanly: clear all timers, emit onCancel. Safe to call any time. */
  public cancel(): void {
    this.cancelled = true;
    this.clearAllTimers();
    this.state = 'CANCELLED';
    this.config.onCancel();
  }

  /** Read current FSM state (for React render decisions). */
  public getState(): MirrorPhaseState {
    return this.state;
  }

  /** Get current live frame result (null if not in ACTIVE_MATCHING). */
  public getCurrentFrameResult(): PoseScoreResult | null {
    return this.currentFrameResult;
  }

  // ─── FSM Transitions ─────────────────────────────────────────────────────

  private runPose(index: number): void {
    if (this.cancelled) return;
    if (index >= this.poses.length) {
      this.finishGauntlet();
      return;
    }

    this.poseIndex = index;
    this.currentBestScore = 0;
    this.currentFrameResult = null;
    this.startTelegraph();
  }

  // IDLE → TELEGRAPH
  private startTelegraph(): void {
    if (this.cancelled) return;
    this.state = 'TELEGRAPH';
    const pose = this.poses[this.poseIndex];
    this.config.onTelegraphStart(pose, this.poseIndex, this.poses.length);

    const t = setTimeout(() => {
      this.startCountdown();
    }, this.telegraphMs);
    this.timers.push(t);
  }

  // TELEGRAPH → COUNTDOWN
  private startCountdown(): void {
    if (this.cancelled) return;
    this.state = 'COUNTDOWN';

    const steps = Math.round(this.countdownMs / 1000);
    let remaining = steps;

    this.config.onCountdownTick(remaining);

    this.countdownInterval = setInterval(() => {
      remaining -= 1;
      this.config.onCountdownTick(remaining);

      if (remaining <= 0) {
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
        this.startMatching();
      }
    }, 1000);
  }

  // COUNTDOWN → ACTIVE_MATCHING
  private startMatching(): void {
    if (this.cancelled) return;
    this.state = 'ACTIVE_MATCHING';
    const pose = this.poses[this.poseIndex];
    this.config.onMatchingWindowOpen(pose);

    // Window expires → resolve no matter what
    const t = setTimeout(() => {
      this.resolveCurrentPose();
    }, this.matchingMs);
    this.timers.push(t);
  }

  // ACTIVE_MATCHING → RESOLVED
  private resolveCurrentPose(): void {
    if (this.cancelled) return;
    this.state = 'RESOLVED';

    const pose = this.poses[this.poseIndex];
    const best = this.currentBestScore;
    const outcome = scoreToOutcome(best);

    this.gauntletBestScores.push(best);
    this.gauntletOutcomes.push(outcome);

    this.config.onPoseResolved(pose, best, outcome);

    // Pause → next pose
    const t = setTimeout(() => {
      this.runPose(this.poseIndex + 1);
    }, this.resolvedPauseMs);
    this.timers.push(t);
  }

  // RESOLVED (all poses done) → COMPLETE
  private finishGauntlet(): void {
    if (this.cancelled) return;
    this.state = 'COMPLETE';

    const avgScore =
      this.gauntletBestScores.length > 0
        ? Math.round(
            this.gauntletBestScores.reduce((a, b) => a + b, 0) /
              this.gauntletBestScores.length
          )
        : 0;

    this.config.onSequenceComplete(avgScore, [...this.gauntletOutcomes]);
  }

  // ─── Utility ──────────────────────────────────────────────────────────────

  private clearAllTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}

// ─── Outcome Helper ───────────────────────────────────────────────────────────

/** Convert a best-score (0–100) to an outcome tier using named thresholds. */
export function scoreToOutcome(score: number): MirrorOutcome {
  if (score >= MIRROR_THRESHOLD_PERFECT) return 'perfect';
  if (score >= MIRROR_THRESHOLD_PARTIAL) return 'partial';
  return 'failed';
}
