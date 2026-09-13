import { Landmark } from '../../types';
import { POSE_LANDMARKS, areKeyLandmarksVisible } from '../LandmarkUtils';
import { calculateAngle } from '../AngleUtils';
import { ExerciseDetectorResult, IExerciseDetector } from './IExerciseDetector';

type LungeStage = 'STANDING' | 'LUNGING' | 'BOTTOM' | 'RETURNING';

export class LungeDetector implements IExerciseDetector {
  readonly exerciseType = 'lunges';

  private stage: LungeStage = 'STANDING';
  private repStartTime: number = 0;
  private minLeadKneeAngle: number = 180;
  private currentFeedbackMessage: string = 'Stand ready to step into a lunge';

  private readonly STANDING_ANGLE = 155;
  private readonly LUNGE_START_ANGLE = 135;
  private readonly VALID_LUNGE_DEPTH = 105;
  private readonly RETURN_THRESHOLD = 135;

  public processFrame(landmarks: Landmark[], timestampMs: number): ExerciseDetectorResult {
    const requiredIndices = [
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ];

    if (!areKeyLandmarksVisible(landmarks, requiredIndices, 0.4)) {
      return {
        isRepCompleted: false,
        isInvalidRep: false,
        feedback: {
          isValid: false,
          message: 'Step back into frame so legs are visible',
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

    // The working (front) leg will have the sharper flexion
    const activeLeadAngle = Math.min(leftKneeAngle, rightKneeAngle);
    const bothStanding = leftKneeAngle >= this.STANDING_ANGLE && rightKneeAngle >= this.STANDING_ANGLE;

    const progressPercent = Math.min(
      100,
      Math.max(0, ((this.STANDING_ANGLE - activeLeadAngle) / (this.STANDING_ANGLE - this.VALID_LUNGE_DEPTH)) * 100)
    );

    let isRepCompleted = false;
    let isInvalidRep = false;
    let repDuration = 0;

    switch (this.stage) {
      case 'STANDING':
        if (activeLeadAngle <= this.LUNGE_START_ANGLE) {
          this.stage = 'LUNGING';
          this.repStartTime = timestampMs;
          this.minLeadKneeAngle = activeLeadAngle;
          this.currentFeedbackMessage = 'Stepping down...';
        } else {
          this.currentFeedbackMessage = 'Step forward into a lunge!';
        }
        break;

      case 'LUNGING':
        this.minLeadKneeAngle = Math.min(this.minLeadKneeAngle, activeLeadAngle);

        if (activeLeadAngle <= this.VALID_LUNGE_DEPTH) {
          this.stage = 'BOTTOM';
          this.currentFeedbackMessage = 'Great depth! Push back to start!';
        } else if (bothStanding) {
          // Returned without hitting depth
          isInvalidRep = true;
          this.stage = 'STANDING';
          this.currentFeedbackMessage = 'LUNGE DEEPER! Drop front knee to 90 degrees';
        } else {
          this.currentFeedbackMessage = 'Drop your hips lower...';
        }
        break;

      case 'BOTTOM':
        this.minLeadKneeAngle = Math.min(this.minLeadKneeAngle, activeLeadAngle);
        if (activeLeadAngle >= this.RETURN_THRESHOLD) {
          this.stage = 'RETURNING';
          this.currentFeedbackMessage = 'Drive through front heel!';
        }
        break;

      case 'RETURNING':
        if (bothStanding) {
          isRepCompleted = true;
          repDuration = (timestampMs - this.repStartTime) / 1000;
          this.stage = 'STANDING';
          this.currentFeedbackMessage = 'EXCELLENT LUNGE!';
        } else {
          this.currentFeedbackMessage = 'Step feet back together!';
        }
        break;
    }

    const depthScore = Math.min(100, Math.max(0, 100 - (this.minLeadKneeAngle - 90) * 1.8));
    const qualityScore = Math.round(depthScore);

    return {
      isRepCompleted,
      isInvalidRep,
      feedback: {
        isValid: isRepCompleted,
        message: this.currentFeedbackMessage,
        postureScore: qualityScore,
        depth: activeLeadAngle,
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
    this.stage = 'STANDING';
    this.repStartTime = 0;
    this.minLeadKneeAngle = 180;
    this.currentFeedbackMessage = 'Stand tall ready to lunge';
  }

  public getCurrentStage(): string {
    return this.stage;
  }

  public getGuidance(): string {
    return 'Take a big step forward and bend both knees until front thigh is parallel!';
  }
}
