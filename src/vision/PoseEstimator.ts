import { CalibrationStatus, Landmark } from '../types';
import { POSE_LANDMARKS, areKeyLandmarksVisible } from './LandmarkUtils';
import { LandmarkFilter } from './Smoothing';

export type PoseResultsCallback = (landmarks: Landmark[], rawResults?: any) => void;

export class PoseEstimator {
  private poseInstance: any = null;
  private isModelLoaded: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private onResultsCallback: PoseResultsCallback | null = null;
  private filter: LandmarkFilter = new LandmarkFilter(0.68);
  private isProcessing: boolean = false;

  public async initialize(): Promise<void> {
    if (this.isModelLoaded && this.poseInstance) {
      return;
    }

    // Wait for window.Pose to be available if loaded via CDN
    const getPoseConstructor = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        if ((window as any).Pose) {
          resolve((window as any).Pose);
          return;
        }

        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if ((window as any).Pose) {
            clearInterval(interval);
            resolve((window as any).Pose);
          } else if (attempts > 50) {
            clearInterval(interval);
            reject(new Error('MediaPipe Pose failed to load from network within timeout.'));
          }
        }, 100);
      });
    };

    try {
      const PoseClass = await getPoseConstructor();
      this.poseInstance = new PoseClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      this.poseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.poseInstance.onResults((results: any) => {
        if (results && results.poseLandmarks) {
          const smoothed = this.filter.filter(results.poseLandmarks);
          if (this.onResultsCallback) {
            this.onResultsCallback(smoothed, results);
          }
        } else {
          if (this.onResultsCallback) {
            this.onResultsCallback([], results);
          }
        }
      });

      this.isModelLoaded = true;
    } catch (err) {
      console.error('PoseEstimator initialization failed:', err);
      throw err;
    }
  }

  public async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    this.videoElement = videoElement;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam is not supported on this browser or platform.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      videoElement.srcObject = this.stream;
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve();
        };
      });

      this.startFrameLoop();
      return this.stream;
    } catch (err) {
      console.error('Failed to access webcam:', err);
      throw err;
    }
  }

  private startFrameLoop(): void {
    const loop = async () => {
      if (
        this.videoElement &&
        this.videoElement.readyState >= 2 &&
        this.poseInstance &&
        !this.isProcessing
      ) {
        try {
          this.isProcessing = true;
          await this.poseInstance.send({ image: this.videoElement });
        } catch (e) {
          // Frame error handling
        } finally {
          this.isProcessing = false;
        }
      }
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public setOnResults(callback: PoseResultsCallback): void {
    this.onResultsCallback = callback;
  }

  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.filter.reset();
  }

  /**
   * Evaluates if the player's full body is visible for calibration
   */
  public static checkCalibration(landmarks: Landmark[]): CalibrationStatus {
    if (!landmarks || landmarks.length === 0) {
      return {
        isCalibrated: false,
        headVisible: false,
        shouldersVisible: false,
        hipsVisible: false,
        kneesVisible: false,
        feetVisible: false,
        progress: 0,
        message: 'No player detected. Step into view!',
      };
    }

    const headVisible = areKeyLandmarksVisible(
      landmarks,
      [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.RIGHT_EYE],
      0.5
    );

    const shouldersVisible = areKeyLandmarksVisible(
      landmarks,
      [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
      0.5
    );

    const hipsVisible = areKeyLandmarksVisible(
      landmarks,
      [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
      0.5
    );

    const kneesVisible = areKeyLandmarksVisible(
      landmarks,
      [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE],
      0.45
    );

    const feetVisible = areKeyLandmarksVisible(
      landmarks,
      [
        POSE_LANDMARKS.LEFT_ANKLE,
        POSE_LANDMARKS.RIGHT_ANKLE,
        POSE_LANDMARKS.LEFT_FOOT_INDEX,
        POSE_LANDMARKS.RIGHT_FOOT_INDEX,
      ],
      0.4
    );

    const checks = [headVisible, shouldersVisible, hipsVisible, kneesVisible, feetVisible];
    const passedCount = checks.filter(Boolean).length;
    const progress = Math.round((passedCount / checks.length) * 100);

    let message = 'All body systems locked! Ready for battle.';
    if (!headVisible) {
      message = 'Cannot see your face/head clearly. Raise or tilt camera.';
    } else if (!feetVisible) {
      message = 'Step back! Your feet and ankles must be visible.';
    } else if (!kneesVisible) {
      message = 'Step back! Your knees are cut off by the frame.';
    } else if (!hipsVisible) {
      message = 'Ensure your hips and mid-body are in frame.';
    } else if (!shouldersVisible) {
      message = 'Position your shoulders in the camera frame.';
    }

    return {
      isCalibrated: passedCount === 5,
      headVisible,
      shouldersVisible,
      hipsVisible,
      kneesVisible,
      feetVisible,
      progress,
      message,
    };
  }
}
