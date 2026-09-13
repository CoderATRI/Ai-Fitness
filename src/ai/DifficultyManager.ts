import { PerformanceMetrics, RoundHistoryRecord } from '../types';

export class DifficultyManager {
  /**
   * Computes normalized performance score (0 - 100) based on formula:
   * 40% accuracy + 20% completion rate + 15% quality + 15% speed + 10% consistency
   */
  public static calculatePerformanceScore(params: {
    validReps: number;
    invalidReps: number;
    targetReps: number;
    averageRepDuration: number;
    expectedRepDuration?: number;
    qualityScores?: number[];
    roundDuration: number;
    timeLimit: number;
  }): PerformanceMetrics {
    const {
      validReps,
      invalidReps,
      targetReps,
      averageRepDuration,
      expectedRepDuration = 2.5,
      qualityScores = [],
      roundDuration,
      timeLimit,
    } = params;

    const totalAttempts = validReps + invalidReps;

    // 1. Accuracy: ratio of valid reps to total attempts (0 - 100)
    const repAccuracy =
      totalAttempts > 0
        ? Math.min(100, Math.max(0, (validReps / totalAttempts) * 100))
        : 0;

    // 2. Completion rate: valid reps vs target reps (0 - 100)
    const completionRate =
      targetReps > 0
        ? Math.min(100, Math.max(0, (validReps / targetReps) * 100))
        : 0;

    // 3. Movement quality: average of detector posture/depth scores
    const movementQuality =
      qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 75;

    // 4. Speed score: comparison to expected cadence
    // If completed within time limit and good cadence:
    let speedScore = 70;
    if (averageRepDuration > 0) {
      const ratio = expectedRepDuration / averageRepDuration;
      // 0.8 to 1.5 ratio is ideal
      speedScore = Math.min(100, Math.max(20, Math.round(ratio * 75)));
    }
    if (roundDuration > timeLimit) {
      speedScore = Math.max(20, speedScore - 30);
    }

    // 5. Consistency score: variance check or smooth pacing
    const timeUsedRatio = roundDuration / Math.max(1, timeLimit);
    const consistencyScore =
      timeUsedRatio <= 0.8 ? 95 : timeUsedRatio <= 1.0 ? 80 : 50;

    // Weighted Overall Performance Score (0 - 100)
    const overallScore = Math.round(
      0.40 * repAccuracy +
      0.20 * completionRate +
      0.15 * movementQuality +
      0.15 * speedScore +
      0.10 * consistencyScore
    );

    // Fatigue indicator estimates cumulative exhaustion based on rep volume and speed degradation
    const fatigueIndicator = Math.min(
      1.0,
      Math.max(0.0, (totalAttempts * 0.03) + (averageRepDuration > 4.0 ? 0.25 : 0))
    );

    return {
      repAccuracy: Math.round(repAccuracy),
      completionRate: Math.round(completionRate),
      movementQuality: Math.round(movementQuality),
      speedScore: Math.round(speedScore),
      consistencyScore: Math.round(consistencyScore),
      overallScore: Math.min(100, Math.max(0, overallScore)),
      averageRepDuration: Number(averageRepDuration.toFixed(2)),
      fatigueIndicator: Number(fatigueIndicator.toFixed(2)),
    };
  }

  /**
   * Evaluates overall trend across recent rounds to detect fatigue or mastery
   */
  public static analyzeTrend(history: RoundHistoryRecord[]): {
    averageAccuracy: number;
    trend: 'improving' | 'stable' | 'fatigued';
    favoriteExercise?: string;
    weakestExercise?: string;
  } {
    if (history.length === 0) {
      return { averageAccuracy: 80, trend: 'stable' };
    }

    const avgAcc =
      history.reduce((sum, h) => sum + h.accuracy, 0) / history.length;

    if (history.length >= 2) {
      const last = history[history.length - 1];
      const prev = history[history.length - 2];
      if (last.accuracy < prev.accuracy - 15 || last.performanceScore < prev.performanceScore - 20) {
        return { averageAccuracy: Math.round(avgAcc), trend: 'fatigued' };
      }
      if (last.performanceScore > prev.performanceScore + 10) {
        return { averageAccuracy: Math.round(avgAcc), trend: 'improving' };
      }
    }

    return { averageAccuracy: Math.round(avgAcc), trend: 'stable' };
  }
}
