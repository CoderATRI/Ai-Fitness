import { Landmark } from '../types';

export class LandmarkFilter {
  private smoothedLandmarks: Landmark[] = [];
  private alpha: number;

  /**
   * @param alpha Smoothing factor (0 = infinite lag, 1 = no smoothing). 0.65 is optimal for webcam pose.
   */
  constructor(alpha: number = 0.65) {
    this.alpha = alpha;
  }

  public filter(landmarks: Landmark[]): Landmark[] {
    if (!landmarks || landmarks.length === 0) {
      return [];
    }

    if (this.smoothedLandmarks.length !== landmarks.length) {
      this.smoothedLandmarks = landmarks.map((lm) => ({ ...lm }));
      return this.smoothedLandmarks;
    }

    this.smoothedLandmarks = landmarks.map((curr, i) => {
      const prev = this.smoothedLandmarks[i];
      const x = this.alpha * curr.x + (1 - this.alpha) * prev.x;
      const y = this.alpha * curr.y + (1 - this.alpha) * prev.y;
      const z =
        curr.z !== undefined && prev.z !== undefined
          ? this.alpha * curr.z + (1 - this.alpha) * prev.z
          : curr.z;

      return {
        x,
        y,
        z,
        visibility: curr.visibility,
      };
    });

    return this.smoothedLandmarks;
  }

  public reset(): void {
    this.smoothedLandmarks = [];
  }
}
