import { ExerciseType, PlayerCareerStats, RoundHistoryRecord } from '../types';

export interface BattleRunSummary {
  id: string;
  date: string;
  result: 'VICTORY' | 'DEFEAT';
  monstersDefeated: number;
  totalReps: number;
  accuracy: number;
  highestCombo: number;
  score: number;
  durationSeconds: number;
  rounds: RoundHistoryRecord[];
}

const CAREER_STATS_KEY = 'ai_fitness_career_stats_v1';
const BATTLE_HISTORY_KEY = 'ai_fitness_battle_history_v1';

export class StorageService {
  public static getCareerStats(): PlayerCareerStats {
    try {
      const data = localStorage.getItem(CAREER_STATS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {}

    const defaultStats: PlayerCareerStats = {
      totalBattles: 0,
      victories: 0,
      defeats: 0,
      totalReps: 0,
      repsByExercise: {
        squats: 0,
        jumping_jacks: 0,
        lunges: 0,
        high_knees: 0,
        pushups: 0,
      },
      highestCombo: 0,
      highestScore: 0,
      maxDifficultyReached: 1,
    };
    return defaultStats;
  }

  public static saveCareerStats(stats: PlayerCareerStats): void {
    try {
      localStorage.setItem(CAREER_STATS_KEY, JSON.stringify(stats));
    } catch (e) {}
  }

  public static updateStatsAfterBattle(summary: BattleRunSummary): PlayerCareerStats {
    const stats = StorageService.getCareerStats();

    stats.totalBattles += 1;
    if (summary.result === 'VICTORY') {
      stats.victories += 1;
    } else {
      stats.defeats += 1;
    }

    stats.totalReps += summary.totalReps;
    stats.highestCombo = Math.max(stats.highestCombo, summary.highestCombo);
    stats.highestScore = Math.max(stats.highestScore, summary.score);

    summary.rounds.forEach((round) => {
      const ex = round.exercise;
      if (stats.repsByExercise[ex] !== undefined) {
        stats.repsByExercise[ex] += round.repsCompleted;
      } else {
        stats.repsByExercise[ex] = round.repsCompleted;
      }
    });

    StorageService.saveCareerStats(stats);
    StorageService.addBattleToHistory(summary);

    return stats;
  }

  public static getBattleHistory(): BattleRunSummary[] {
    try {
      const data = localStorage.getItem(BATTLE_HISTORY_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {}
    return [];
  }

  public static addBattleToHistory(summary: BattleRunSummary): void {
    try {
      const history = StorageService.getBattleHistory();
      history.unshift(summary);
      // Keep last 25 battles
      const trimmed = history.slice(0, 25);
      localStorage.setItem(BATTLE_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {}
  }
}
