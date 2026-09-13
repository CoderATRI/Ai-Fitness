import { Landmark } from '../../types';
import { POSE_LANDMARKS, areKeyLandmarksVisible } from '../LandmarkUtils';
import { calculateAngle, calculateDistance } from '../AngleUtils';
import { ExerciseDetectorResult, IExerciseDetector } from './IExerciseDetector';

type JackStage = 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING';

export class JumpingJackDetector implements IExerciseDetector {
  readonly exerciseType = 'jumping_jacks';

  private stage: JackStage = 'CLOSED';
  private repStartTime: number = 0;
  private maxArmAngle: number = 0;
  private maxAnkleSpread: number = 0;
  private currentFeedbackMessage: string = 'Stand with arms down and feet together';

  public processFrame(landmarks: Landmark[], timestampMs: number): ExerciseDetectorResult {
    const requiredIndices = [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ];

    if (!areKeyLandmarksVisible(landmarks, requiredIndices, 0.4)) {
      return {
        isRepCompleted: false,
        isInvalidRep: false,
        feedback: {
          isValid: false,
          message: 'Ensure full body is visible for jumping jacks',
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
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    const shoulderDist = Math.max(0.08, calculateDistance(leftShoulder, rightShoulder));
    const ankleDist = calculateDistance(leftAnkle, rightAnkle);
    const ankleRatio = ankleDist / shoulderDist;

    // Angle of arms from torso (hip - shoulder - wrist)
    const leftArmAngle = calculateAngle(leftHip, leftShoulder, leftWrist);
    const rightArmAngle = calculateAngle(rightHip, rightShoulder, rightWrist);
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;

    const armsAreHigh = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y && avgArmAngle >= 135;
    const armsAreLow = avgArmAngle <= 45;
    const feetAreWide = ankleRatio >= 1.6;
    const feetAreClosed = ankleRatio <= 1.25;

    // Progress: 0% when closed, 100% when fully open
    const armProgress = Math.min(100, Math.max(0, ((avgArmAngle - 35) / 100) * 100));
    const legProgress = Math.min(100, Math.max(0, ((ankleRatio - 1.1) / 0.6) * 100));
    const combinedProgress = Math.round((armProgress + legProgress) / 2);

    let isRepCompleted = false;
    let isInvalidRep = false;
    let repDuration = 0;

    switch (this.stage) {
      case 'CLOSED':
        if (avgArmAngle > 55 || ankleRatio > 1.35) {
          this.stage = 'OPENING';
          this.repStartTime = timestampMs;
          this.maxArmAngle = avgArmAngle;
          this.maxAnkleSpread = ankleRatio;
          this.currentFeedbackMessage = 'Jump and raise arms high!';
        } else {
          this.currentFeedbackMessage = 'Jump out!';
        }
        break;

      case 'OPENING':
        this.maxArmAngle = Math.max(this.maxArmAngle, avgArmAngle);
        this.maxAnkleSpread = Math.max(this.maxAnkleSpread, ankleRatio);

        if (armsAreHigh && feetAreWide) {
          this.stage = 'OPEN';
          this.currentFeedbackMessage = 'Full extension! Now return to center!';
        } else if (armsAreLow && feetAreClosed) {
          // Returned before reaching full open
          isInvalidRep = true;
          this.stage = 'CLOSED';
          this.currentFeedbackMessage = 'ARMS HIGHER & SPREAD FEET WIDER!';
        } else {
          this.currentFeedbackMessage = 'Arms up, feet wide!';
        }
        break;

      case 'OPEN':
        if (!armsAreHigh || !feetAreWide) {
          this.stage = 'CLOSING';
          this.currentFeedbackMessage = 'Snap back to center!';
        }
        break;

      case 'CLOSING':
        if (armsAreLow && feetAreClosed) {
          isRepCompleted = true;
          repDuration = (timestampMs - this.repStartTime) / 1000;
          this.stage = 'CLOSED';
          this.currentFeedbackMessage = 'PERFECT JACK!';
        } else {
          this.currentFeedbackMessage = 'Close arms and feet together!';
        }
        break;
    }

    const armQuality = Math.min(100, (this.maxArmAngle / 150) * 100);
    const legQuality = Math.min(100, (this.maxAnkleSpread / 1.8) * 100);
    const qualityScore = Math.round((armQuality + legQuality) / 2);

    return {
      isRepCompleted,
      isInvalidRep,
      feedback: {
        isValid: isRepCompleted,
        message: this.currentFeedbackMessage,
        postureScore: qualityScore,
        stage: this.stage,
        isRepCompleted,
      },
      repDurationSeconds: repDuration > 0 ? repDuration : undefined,
      qualityScore,
      stage: this.stage,
      progressPercent: combinedProgress,
    };
  }

  public reset(): void {
    this.stage = 'CLOSED';
    this.repStartTime = 0;
    this.maxArmAngle = 0;
    this.maxAnkleSpread = 0;
    this.currentFeedbackMessage = 'Ready: Feet together, arms down';
  }

  public getCurrentStage(): string {
    return this.stage;
  }

  public getGuidance(): string {
    return 'Jump feet wide while raising hands above head, then snap back!';
  }
}
