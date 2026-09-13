import { Landmark } from '../../types';
import { POSE_LANDMARKS, areKeyLandmarksVisible } from '../LandmarkUtils';
import { calculateAngle, calculateBackInclination } from '../AngleUtils';
import { ExerciseDetectorResult, IExerciseDetector } from './IExerciseDetector';

type SquatStage = 'STANDING' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING';

export class SquatDetector implements IExerciseDetector {
  readonly exerciseType = 'squats';

  private stage: SquatStage = 'STANDING';
  private repStartTime: number = 0;
  private minAngleReached: number = 180;
  private backStraightScore: number = 100;
  private currentFeedbackMessage: string = 'Stand tall to start';

  // Angle thresholds (degrees)
  private readonly STANDING_ANGLE = 160;
  private readonly DESCENDING_ANGLE = 145;
  private readonly VALID_DEPTH_ANGLE = 102;
  private readonly ASCENDING_ANGLE = 135;

  public processFrame(landmarks: Landmark[], timestampMs: number): ExerciseDetectorResult {
    const requiredIndices = [
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ];

    if (!areKeyLandmarksVisible(landmarks, requiredIndices, 0.45)) {
      return {
        isRepCompleted: false,
        isInvalidRep: false,
        feedback: {
          isValid: false,
          message: 'Move back into full camera view',
          postureScore: 50,
          stage: this.stage,
        },
        stage: this.stage,
        qualityScore: 50,
        progressPercent: 0,
      };
    }

    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];

    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const currentKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // Posture check: back tilt
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    let backAngle = 0;
    if (leftShoulder && rightShoulder) {
      const avgShoulder = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2,
      };
      const avgHip = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2,
      };
      backAngle = calculateBackInclination(avgShoulder, avgHip);
      if (backAngle > 38) {
        this.backStraightScore = Math.max(40, this.backStraightScore - 5);
      }
    }

    // Depth progress: 160 deg -> 0%, 100 deg -> 100%
    const progressPercent = Math.min(
      100,
      Math.max(0, ((this.STANDING_ANGLE - currentKneeAngle) / (this.STANDING_ANGLE - this.VALID_DEPTH_ANGLE)) * 100)
    );

    let isRepCompleted = false;
    let isInvalidRep = false;
    let repDuration = 0;

    switch (this.stage) {
      case 'STANDING':
        if (currentKneeAngle <= this.DESCENDING_ANGLE) {
          this.stage = 'DESCENDING';
          this.repStartTime = timestampMs;
          this.minAngleReached = currentKneeAngle;
          this.backStraightScore = 100;
          this.currentFeedbackMessage = 'Sinking down...';
        } else {
          this.currentFeedbackMessage = 'Ready: Squat down!';
        }
        break;

      case 'DESCENDING':
        this.minAngleReached = Math.min(this.minAngleReached, currentKneeAngle);
        if (currentKneeAngle <= this.VALID_DEPTH_ANGLE) {
          this.stage = 'BOTTOM';
          this.currentFeedbackMessage = 'Great depth! Now push up!';
        } else if (currentKneeAngle > this.DESCENDING_ANGLE + 5) {
          // Ascended before reaching proper depth
          isInvalidRep = true;
          this.stage = 'STANDING';
          this.currentFeedbackMessage = 'GO LOWER! Hit parallel depth';
        } else if (backAngle > 38) {
          this.currentFeedbackMessage = 'Keep your chest up & back straight!';
        } else {
          this.currentFeedbackMessage = 'Go lower...';
        }
        break;

      case 'BOTTOM':
        this.minAngleReached = Math.min(this.minAngleReached, currentKneeAngle);
        if (currentKneeAngle >= this.ASCENDING_ANGLE) {
          this.stage = 'ASCENDING';
          this.currentFeedbackMessage = 'Push through heels!';
        } else {
          this.currentFeedbackMessage = 'Hold and drive up!';
        }
        break;

      case 'ASCENDING':
        if (currentKneeAngle >= this.STANDING_ANGLE) {
          isRepCompleted = true;
          repDuration = (timestampMs - this.repStartTime) / 1000;
          this.stage = 'STANDING';
          this.currentFeedbackMessage = this.backStraightScore > 80 ? 'POWERFUL REP!' : 'Good rep! Watch back posture';
        } else {
          this.currentFeedbackMessage = 'Stand all the way up!';
        }
        break;
    }

    // Quality calculation based on depth and posture
    const depthScore = Math.min(100, Math.max(0, 100 - (this.minAngleReached - 90) * 1.5));
    const overallQuality = Math.round((depthScore * 0.6) + (this.backStraightScore * 0.4));

    return {
      isRepCompleted,
      isInvalidRep,
      feedback: {
        isValid: isRepCompleted,
        message: this.currentFeedbackMessage,
        postureScore: overallQuality,
        depth: currentKneeAngle,
        stage: this.stage,
        isRepCompleted,
      },
      repDurationSeconds: repDuration > 0 ? repDuration : undefined,
      qualityScore: overallQuality,
      stage: this.stage,
      progressPercent: Math.round(progressPercent),
    };
  }

  public reset(): void {
    this.stage = 'STANDING';
    this.repStartTime = 0;
    this.minAngleReached = 180;
    this.backStraightScore = 100;
    this.currentFeedbackMessage = 'Stand ready';
  }

  public getCurrentStage(): string {
    return this.stage;
  }

  public getGuidance(): string {
    return 'Lower your hips until thighs are parallel to ground, keep chest up!';
  }
}
