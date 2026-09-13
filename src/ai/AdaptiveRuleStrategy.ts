import { AIDecision, ExerciseType, Monster, PerformanceMetrics, RoundHistoryRecord } from '../types';

export interface DecisionInput {
  playerPerformance: PerformanceMetrics;
  currentDifficulty: number;
  exerciseHistory: RoundHistoryRecord[];
  currentHealth: number;
  monsterHealth: number;
  fatigueIndicator: number;
  previousExercises: ExerciseType[];
  currentMonster: Monster;
  round: number;
  isBossBattle?: boolean;
  bossPhase?: number;
  /** Optional Mirror Phase context surfaced for AI decision-making (NEXUS PRIME only) */
  mirrorPhaseContext?: {
    avgScore: number;       // 0–100 weighted avg similarity across the gauntlet
    outcome: 'perfect' | 'partial' | 'failed';
  };
}


export class AdaptiveRuleStrategy {
  private static readonly EXERCISE_POOL: ExerciseType[] = [
    'squats',
    'jumping_jacks',
    'lunges',
    'high_knees',
  ];

  public decideNextChallenge(input: DecisionInput): AIDecision {
    const {
      playerPerformance,
      currentDifficulty,
      exerciseHistory,
      currentHealth,
      monsterHealth,
      previousExercises,
      currentMonster,
      round,
      isBossBattle = false,
      bossPhase = 1,
    } = input;

    const score = playerPerformance.overallScore;
    let newDifficulty = currentDifficulty;
    let reason = '';

    // 1. Difficulty Scaling based on mathematical score
    if (score >= 85) {
      newDifficulty = Math.min(5, currentDifficulty + 1);
      reason = `Player dominated with ${score}% performance score. Difficulty escalated to Level ${newDifficulty}!`;
    } else if (score >= 65) {
      newDifficulty = currentDifficulty;
      reason = `Solid performance (${score}% score). Maintaining steady difficulty Level ${newDifficulty}.`;
    } else {
      newDifficulty = Math.max(1, currentDifficulty - 1);
      reason = `Player struggled (${score}% score). Calibrating down to Level ${newDifficulty} for pacing.`;
    }

    // Adjust for low player health: provide achievable survival challenge
    if (currentHealth < 30 && newDifficulty > 2) {
      newDifficulty = Math.max(1, newDifficulty - 1);
      reason += ' Player health critical: adjusting challenge for survival rally.';
    }

    // 2. Intelligent Exercise Selection
    // Prevent 3 consecutive identical exercises; balance cardio & strength
    const lastExercise = previousExercises[previousExercises.length - 1];
    const secondLastExercise = previousExercises[previousExercises.length - 2];

    let candidateExercises = AdaptiveRuleStrategy.EXERCISE_POOL.filter(
      (ex) => !(ex === lastExercise && ex === secondLastExercise)
    );

    // If fatigued, prefer jumping jacks or high knees with short bursts over heavy lunges
    if (input.fatigueIndicator > 0.6) {
      candidateExercises = candidateExercises.filter((ex) => ex !== 'lunges');
      if (candidateExercises.length === 0) candidateExercises = ['jumping_jacks'];
    }

    // Pick next exercise
    let nextExercise: ExerciseType = 'squats';
    if (isBossBattle) {
      // Boss battle phase progression
      const bossExerciseMap: Record<number, ExerciseType> = {
        1: 'squats',
        2: 'jumping_jacks',
        3: 'lunges',
        4: 'high_knees',
        5: 'squats',
      };
      nextExercise = bossExerciseMap[bossPhase] || 'squats';
    } else {
      // Choose exercise least recently performed
      const historyTypes = exerciseHistory.map((h) => h.exercise);
      const leastUsed = candidateExercises.reduce((prev, curr) => {
        const countPrev = historyTypes.filter((t) => t === prev).length;
        const countCurr = historyTypes.filter((t) => t === curr).length;
        return countCurr < countPrev ? curr : prev;
      }, candidateExercises[0]);

      nextExercise = leastUsed;
    }

    // 3. Rep Target & Time Limit Calculation
    // Base reps by exercise
    const baseRepsByExercise: Record<ExerciseType, number> = {
      squats: 6,
      jumping_jacks: 10,
      lunges: 6,
      high_knees: 12,
      pushups: 5,
    };

    const baseReps = baseRepsByExercise[nextExercise] || 8;
    const diffMultiplier = 1 + (newDifficulty - 1) * 0.28;
    let targetReps = Math.round(baseReps * diffMultiplier);

    // Boss fight modifiers
    if (isBossBattle) {
      targetReps = Math.round(targetReps * (1 + bossPhase * 0.12));
    }

    // Clamp reps to safe human hackathon limits
    targetReps = Math.min(25, Math.max(5, targetReps));

    // Dynamic Time limit (generous for accessibility)
    const secondsPerRep: Record<ExerciseType, number> = {
      squats: 3.5,
      jumping_jacks: 1.8,
      lunges: 4.0,
      high_knees: 1.5,
      pushups: 4.0,
    };

    const estTime = targetReps * secondsPerRep[nextExercise];
    let timeLimit = Math.round(estTime + (6 - newDifficulty) * 4 + 8);
    timeLimit = Math.min(80, Math.max(25, timeLimit));

    // 4. Personalized AI Coach Message
    let coachMessage = '';
    if (score >= 85) {
      coachMessage = `Spectacular cadence! Your neural link is surging. Drive hard into ${nextExercise.replace('_', ' ')}!`;
    } else if (score >= 65) {
      coachMessage = `Great rhythm! Keep consistent depth and push through this next set.`;
    } else {
      coachMessage = `Catch your breath and focus on clean form. Quality beats speed every time!`;
    }

    // 5. Monster Threat
    const monsterThreat = `${currentMonster.name}: "${this.generateMonsterThreat(currentMonster, monsterHealth)}"`;

    return {
      nextExercise,
      targetReps,
      timeLimit,
      difficulty: newDifficulty,
      reason,
      coachMessage,
      monsterThreat,
    };
  }

  private generateMonsterThreat(monster: Monster, hp: number): string {
    const hpRatio = hp / monster.maxHp;
    if (hpRatio > 0.6) {
      return `Is that all your carbon muscles can muster? Face my onslaught!`;
    } else if (hpRatio > 0.25) {
      return `Warning: Core integrity degrading... but my fire burns hotter!`;
    } else {
      return `Impossible! My armor is cracking... but I will not yield!`;
    }
  }
}
