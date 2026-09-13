import { ExerciseDefinition, ExerciseType, Landmark } from '../../types';
import { IExerciseDetector, ExerciseDetectorResult } from './IExerciseDetector';
import { SquatDetector } from './SquatDetector';
import { JumpingJackDetector } from './JumpingJackDetector';
import { LungeDetector } from './LungeDetector';
import { HighKneeDetector } from './HighKneeDetector';
import { PushupDetector } from './PushupDetector';

export const EXERCISE_DEFINITIONS: Record<ExerciseType, ExerciseDefinition> = {
  squats: {
    type: 'squats',
    name: 'Power Squats',
    icon: '🏋️',
    description: 'Drive hips back and sink until thighs are parallel to the floor.',
    targetMuscles: 'Quadriceps, Glutes, Hamstrings',
    defaultReps: 8,
    defaultTime: 45,
    baseDamage: 25,
  },
  jumping_jacks: {
    type: 'jumping_jacks',
    name: 'Cyber Jacks',
    icon: '⚡',
    description: 'Jump feet wide while raising arms high overhead in explosive cadence.',
    targetMuscles: 'Full Body Cardio, Calves, Deltoids',
    defaultReps: 12,
    defaultTime: 40,
    baseDamage: 20,
  },
  lunges: {
    type: 'lunges',
    name: 'Hyper Lunges',
    icon: '🦵',
    description: 'Take deep alternating steps forward, dropping knees to 90 degrees.',
    targetMuscles: 'Quads, Calves, Hip Stabilizers',
    defaultReps: 8,
    defaultTime: 50,
    baseDamage: 28,
  },
  high_knees: {
    type: 'high_knees',
    name: 'Velocity High Knees',
    icon: '🏃',
    description: 'Rapidly drive alternating knees up past hip level with maximum tempo.',
    targetMuscles: 'Hip Flexors, Core, Cardio',
    defaultReps: 14,
    defaultTime: 35,
    baseDamage: 22,
  },
  pushups: {
    type: 'pushups',
    name: 'Titan Push-ups',
    icon: '🛡️',
    description: 'Maintain rigid plank posture and lower chest to floor.',
    targetMuscles: 'Chest, Triceps, Shoulders, Core',
    defaultReps: 6,
    defaultTime: 45,
    baseDamage: 30,
  },
};

export class ExerciseManager {
  private detectors: Map<ExerciseType, IExerciseDetector> = new Map();
  private currentExercise: ExerciseType = 'squats';

  constructor() {
    this.detectors.set('squats', new SquatDetector());
    this.detectors.set('jumping_jacks', new JumpingJackDetector());
    this.detectors.set('lunges', new LungeDetector());
    this.detectors.set('high_knees', new HighKneeDetector());
    this.detectors.set('pushups', new PushupDetector());
  }

  public setExercise(exercise: ExerciseType): void {
    if (this.currentExercise !== exercise) {
      this.currentExercise = exercise;
      const detector = this.detectors.get(exercise);
      if (detector) {
        detector.reset();
      }
    }
  }

  public getActiveExercise(): ExerciseType {
    return this.currentExercise;
  }

  public processFrame(landmarks: Landmark[], timestampMs: number): ExerciseDetectorResult {
    const detector = this.detectors.get(this.currentExercise);
    if (!detector) {
      return {
        isRepCompleted: false,
        isInvalidRep: false,
        feedback: {
          isValid: false,
          message: 'Unknown exercise detector',
          postureScore: 0,
          stage: 'IDLE',
        },
        stage: 'IDLE',
        qualityScore: 0,
        progressPercent: 0,
      };
    }

    return detector.processFrame(landmarks, timestampMs);
  }

  public resetCurrent(): void {
    const detector = this.detectors.get(this.currentExercise);
    if (detector) {
      detector.reset();
    }
  }

  public getDefinition(type?: ExerciseType): ExerciseDefinition {
    const target = type || this.currentExercise;
    return EXERCISE_DEFINITIONS[target];
  }

  public getGuidance(): string {
    const detector = this.detectors.get(this.currentExercise);
    return detector ? detector.getGuidance() : '';
  }

  public getCurrentStage(): string {
    const detector = this.detectors.get(this.currentExercise);
    return detector ? detector.getCurrentStage() : 'IDLE';
  }
}
