import { Landmark } from '../../types';
import { POSE_LANDMARKS, areKeyLandmarksVisible } from '../LandmarkUtils';
import { calculateAngle } from '../AngleUtils';
import { ExerciseDetectorResult, IExerciseDetector } from './IExerciseDetector';

type PushupStage = 'PLANK' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';

export class PushupDetector implements IExerciseDetector {
  readonly exerciseType = 'pushups';

  private stage: PushupStage = 'PLANK';
  private repStartTime: number = 0;
  private minElbowAngle: number = 180;
  private currentFeedbackMessage: string = 'Assume push-up plank position';

  private readonly PLANK_ELBOW_ANGLE = 150;
  private readonly BOTTOM_ELBOW_ANGLE = 95;

  public processFrame(landmarks: Landmark[], timestampMs: number): ExerciseDetectorResult {
    const requiredIndices = [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
    ];

    if (!areKeyLandmarksVisible(landmarks, requiredIndices, 0.4)) {
      return {
        isRepCompleted: false,
        isInvalidRep: false,
        feedback: {
          isValid: false,
          message: 'Position camera to see upper body plank',
          postureScore: 50,
          stage: this.stage,
        },
        stage: this.stage,
        qualityScore: 50,
        progressPercent: 0,
      };
    }

    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
    const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    const progressPercent = Math.min(
      100,
      Math.max(0, ((this.PLANK_ELBOW_ANGLE - avgElbowAngle) / (this.PLANK_ELBOW_ANGLE - this.BOTTOM_ELBOW_ANGLE)) * 100)
    );

    let isRepCompleted = false;
    let isInvalidRep = false;
    let repDuration = 0;

    switch (this.stage) {
      case 'PLANK':
        if (avgElbowAngle <= 135) {
          this.stage = 'DESCENDING';
          this.repStartTime = timestampMs;
          this.minElbowAngle = avgElbowAngle;
          this.currentFeedbackMessage = 'Lowering chest...';
        } else {
          this.currentFeedbackMessage = 'Ready: Lower down!';
        }
        break;

      case 'DESCENDING':
        this.minElbowAngle = Math.min(this.minElbowAngle, avgElbowAngle);
        if (avgElbowAngle <= this.BOTTOM_ELBOW_ANGLE) {
          this.stage = 'BOTTOM';
          this.currentFeedbackMessage = 'Deep push-up! Now press up!';
        } else if (avgElbowAngle > 140) {
          isInvalidRep = true;
          this.stage = 'PLANK';
          this.currentFeedbackMessage = 'CHEST LOWER! Bend elbows to 90°';
        }
        break;

      case 'BOTTOM':
        if (avgElbowAngle >= 125) {
          this.stage = 'ASCENDING';
          this.currentFeedbackMessage = 'Push the floor away!';
        }
        break;

      case 'ASCENDING':
        if (avgElbowAngle >= this.PLANK_ELBOW_ANGLE) {
          isRepCompleted = true;
          repDuration = (timestampMs - this.repStartTime) / 1000;
          this.stage = 'PLANK';
          this.currentFeedbackMessage = 'SOLID PUSH-UP!';
        }
        break;
    }

    const qualityScore = Math.min(100, Math.max(50, Math.round(100 - (this.minElbowAngle - 85) * 1.5)));

    return {
      isRepCompleted,
      isInvalidRep,
      feedback: {
        isValid: isRepCompleted,
        message: this.currentFeedbackMessage,
        postureScore: qualityScore,
        depth: avgElbowAngle,
        stage: this.stage,
        isRepCompleted,
      },
      repDurationSeconds: repDuration > 0 ? repDuration : undefined,
      qualityScore,
      stage: this.stage,
      progressPercent: Math.round(progressPercent),
    };
  }

  public reset(): void {
    this.stage = 'PLANK';
    this.repStartTime = 0;
    this.minElbowAngle = 180;
    this.currentFeedbackMessage = 'Plank position ready';
  }

  public getCurrentStage(): string {
    return this.stage;
  }

  public getGuidance(): string {
    return 'Keep straight body line, lower chest until elbows bend to 90 degrees!';
  }
}
