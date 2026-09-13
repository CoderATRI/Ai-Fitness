import { Landmark, RepFeedback } from '../../types';

export interface ExerciseDetectorResult {
  isRepCompleted: boolean;
  isInvalidRep: boolean;
  feedback: RepFeedback;
  repDurationSeconds?: number;
  qualityScore: number; // 0 - 100
  stage: string;
  progressPercent: number; // 0 - 100 for visual progress bar
}

export interface IExerciseDetector {
  readonly exerciseType: string;
  processFrame(landmarks: Landmark[], timestampMs: number): ExerciseDetectorResult;
  reset(): void;
  getCurrentStage(): string;
  getGuidance(): string;
}
