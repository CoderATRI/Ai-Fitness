import { Landmark } from '../../types';
import { POSE_LANDMARKS, areKeyLandmarksVisible } from '../LandmarkUtils';
import { calculateTorsoLength } from '../AngleUtils';
import { ExerciseDetectorResult, IExerciseDetector } from './IExerciseDetector';

type HighKneeStage = 'NEUTRAL' | 'LEFT_UP' | 'RIGHT_UP';

export class HighKneeDetector implements IExerciseDetector {
  readonly exerciseType = 'high_knees';

  private stage: HighKneeStage = 'NEUTRAL';
  private repStartTime: number = 0;
  private leftKneeDone: boolean = false;
  private rightKneeDone: boolean = false;
  private currentFeedbackMessage: string = 'Drive knees up high!';

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
          message: 'Step back to keep knees in frame',
          postureScore: 50,
          stage: this.stage,
        },
        stage: this.stage,
        qualityScore: 50,
        progressPercent: 0,
      };
    }

    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];

    const torsoLength = calculateTorsoLength(landmarks);

    // Height threshold: knee should reach close to hip height (within 0.15 * torsoLength)
    // Note: y is 0 at top, so higher knee has smaller y!
    const leftElevation = (leftHip.y - leftKnee.y) / torsoLength;
    const rightElevation = (rightHip.y - rightKnee.y) / torsoLength;

    const ELEVATION_TRIGGER = -0.15; // Knee within 15% torso length of hip
    const NEUTRAL_THRESHOLD = -0.55; // Knee well below hip (standing)

    const isLeftHigh = leftElevation >= ELEVATION_TRIGGER;
    const isRightHigh = rightElevation >= ELEVATION_TRIGGER;
    const isLeftDown = leftElevation <= NEUTRAL_THRESHOLD;
    const isRightDown = rightElevation <= NEUTRAL_THRESHOLD;

    const maxElevation = Math.max(leftElevation, rightElevation);
    const progressPercent = Math.min(
      100,
      Math.max(0, ((maxElevation - NEUTRAL_THRESHOLD) / (ELEVATION_TRIGGER - NEUTRAL_THRESHOLD)) * 100)
    );

    let isRepCompleted = false;
    let isInvalidRep = false;
    let repDuration = 0;

    if (this.stage === 'NEUTRAL') {
      if (isLeftHigh) {
        this.stage = 'LEFT_UP';
        this.leftKneeDone = true;
        this.repStartTime = this.repStartTime === 0 ? timestampMs : this.repStartTime;
        this.currentFeedbackMessage = 'Left up! Now switch to right!';
      } else if (isRightHigh) {
        this.stage = 'RIGHT_UP';
        this.rightKneeDone = true;
        this.repStartTime = this.repStartTime === 0 ? timestampMs : this.repStartTime;
        this.currentFeedbackMessage = 'Right up! Now switch to left!';
      } else {
        this.currentFeedbackMessage = 'Pump knees toward your chest!';
      }
    } else if (this.stage === 'LEFT_UP') {
      if (isLeftDown) {
        this.currentFeedbackMessage = 'Now bring right knee UP!';
        if (isRightHigh) {
          this.stage = 'RIGHT_UP';
          this.rightKneeDone = true;
        }
      }
    } else if (this.stage === 'RIGHT_UP') {
      if (isRightDown) {
        this.currentFeedbackMessage = 'Now bring left knee UP!';
        if (isLeftHigh) {
          this.stage = 'LEFT_UP';
          this.leftKneeDone = true;
        }
      }
    }

    // When both left and right high knees have been performed
    if (this.leftKneeDone && this.rightKneeDone) {
      if (isLeftDown && isRightDown) {
        isRepCompleted = true;
        repDuration = (timestampMs - this.repStartTime) / 1000;
        this.stage = 'NEUTRAL';
        this.leftKneeDone = false;
        this.rightKneeDone = false;
        this.repStartTime = 0;
        this.currentFeedbackMessage = 'FAST & STRONG!';
      }
    }

    const qualityScore = Math.min(100, Math.max(60, Math.round(70 + maxElevation * 40)));

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
      progressPercent: Math.round(progressPercent),
    };
  }

  public reset(): void {
    this.stage = 'NEUTRAL';
    this.repStartTime = 0;
    this.leftKneeDone = false;
    this.rightKneeDone = false;
    this.currentFeedbackMessage = 'Drive knees up!';
  }

  public getCurrentStage(): string {
    return this.stage;
  }

  public getGuidance(): string {
    return 'Run in place lifting each knee up to hip level!';
  }
}
