export type ExerciseType = 'squats' | 'jumping_jacks' | 'lunges' | 'high_knees' | 'pushups';

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseLandmarks {
  landmarks: Landmark[];
  worldLandmarks?: Landmark[];
  timestamp: number;
}

export interface CalibrationStatus {
  isCalibrated: boolean;
  headVisible: boolean;
  shouldersVisible: boolean;
  hipsVisible: boolean;
  kneesVisible: boolean;
  feetVisible: boolean;
  progress: number; // 0 - 100
  message: string;
}

export interface RepFeedback {
  isValid: boolean;
  message: string;
  postureScore: number;
  depth?: number;
  stage: string;
  isRepCompleted?: boolean;
}

export interface ExerciseDefinition {
  type: ExerciseType;
  name: string;
  icon: string;
  description: string;
  targetMuscles: string;
  defaultReps: number;
  defaultTime: number;
  baseDamage: number;
}

export type MonsterId = 'goblin' | 'cyber_beast' | 'iron_titan' | 'shadow_warrior' | 'nexus_prime';

export interface Monster {
  id: MonsterId;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  attackDamage: number;
  difficulty: number;
  accentColor: string;
  secondaryColor: string;
  glowColor: string;
  quote: string;
  defeatQuote: string;
  phase?: number;
  maxPhases?: number;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  combo: number;
  highestCombo: number;
  score: number;
  totalDamageDealt: number;
  isAttacking: boolean;
  isHit: boolean;
}

export interface Challenge {
  id: string;
  exercise: ExerciseType;
  targetReps: number;
  currentReps: number;
  invalidReps: number;
  timeLimit: number;
  timeRemaining: number;
  difficulty: number; // 1 to 5
  damageReward: number;
  reason: string;
  coachNote: string;
}

export interface PerformanceMetrics {
  repAccuracy: number; // 0 - 100
  completionRate: number; // 0 - 100
  movementQuality: number; // 0 - 100
  speedScore: number; // 0 - 100
  consistencyScore: number; // 0 - 100
  overallScore: number; // 0 - 100
  averageRepDuration: number; // seconds
  fatigueIndicator: number; // 0 - 1
}

export interface AIDecision {
  nextExercise: ExerciseType;
  targetReps: number;
  timeLimit: number;
  difficulty: number;
  reason: string;
  coachMessage: string;
  monsterThreat: string;
}

export interface RoundHistoryRecord {
  round: number;
  monsterId: MonsterId;
  exercise: ExerciseType;
  repsCompleted: number;
  targetReps: number;
  invalidReps: number;
  accuracy: number;
  durationSeconds: number;
  damageDealt: number;
  performanceScore: number;
  timestamp: number;
}

export interface PlayerCareerStats {
  totalBattles: number;
  victories: number;
  defeats: number;
  totalReps: number;
  repsByExercise: Record<ExerciseType, number>;
  highestCombo: number;
  highestScore: number;
  maxDifficultyReached: number;
}

export type MirrorOutcome = 'perfect' | 'partial' | 'failed';

export type GameStatus =
  | 'landing'
  | 'calibration'
  | 'battle'
  | 'round_transition'
  | 'player_attack'
  | 'monster_attack'
  | 'mirror_phase'
  | 'victory'
  | 'defeat';

