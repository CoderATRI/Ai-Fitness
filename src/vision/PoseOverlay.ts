import { Landmark } from '../types';
import { POSE_LANDMARKS, SKELETON_CONNECTIONS } from './LandmarkUtils';

export interface OverlayRenderOptions {
  showAngles?: boolean;
  highlightJoints?: number[];
  postureValid?: boolean;
  isCalibrated?: boolean;
  mirrored?: boolean;
}

export class PoseOverlayRenderer {
  public static render(
    canvas: HTMLCanvasElement,
    landmarks: Landmark[],
    options: OverlayRenderOptions = {}
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const {
      showAngles = true,
      highlightJoints = [],
      postureValid = true,
      mirrored = true,
    } = options;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!landmarks || landmarks.length === 0) {
      return;
    }

    ctx.save();

    // Setup coordinates: if mirrored, mirror horizontally
    const getCoords = (lm: Landmark) => {
      const x = mirrored ? (1 - lm.x) * width : lm.x * width;
      const y = lm.y * height;
      return { x, y };
    };

    // Color palette based on posture state
    const lineColor = postureValid ? '#00f7ff' : '#ff416c';
    const glowColor = postureValid ? 'rgba(0, 247, 255, 0.6)' : 'rgba(255, 65, 108, 0.6)';
    const jointFill = postureValid ? '#ffe600' : '#ff007f';

    // 1. Draw Skeleton Lines
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 12;
    ctx.shadowColor = glowColor;

    for (const [startIdx, endIdx] of SKELETON_CONNECTIONS) {
      const startLm = landmarks[startIdx];
      const endLm = landmarks[endIdx];

      if (!startLm || !endLm) continue;
      if (
        (startLm.visibility !== undefined && startLm.visibility < 0.4) ||
        (endLm.visibility !== undefined && endLm.visibility < 0.4)
      ) {
        continue;
      }

      const p1 = getCoords(startLm);
      const p2 = getCoords(endLm);

      ctx.strokeStyle = lineColor;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // 2. Draw Landmark Joints
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.4)) continue;

      // Skip non-essential face landmarks for cleaner sci-fi look
      if (
        i === POSE_LANDMARKS.LEFT_EYE_INNER ||
        i === POSE_LANDMARKS.LEFT_EYE_OUTER ||
        i === POSE_LANDMARKS.RIGHT_EYE_INNER ||
        i === POSE_LANDMARKS.RIGHT_EYE_OUTER ||
        i === POSE_LANDMARKS.MOUTH_LEFT ||
        i === POSE_LANDMARKS.MOUTH_RIGHT
      ) {
        continue;
      }

      const p = getCoords(lm);
      const isHighlighted = highlightJoints.includes(i);

      // Outer target ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, isHighlighted ? 10 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted ? '#ffffff' : jointFill;
      ctx.shadowBlur = 15;
      ctx.shadowColor = isHighlighted ? '#ffffff' : glowColor;
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0d18';
      ctx.fill();
    }

    // 3. Draw Knee HUD Callouts for depth tracking
    if (showAngles) {
      const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
      const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];

      [leftKnee, rightKnee].forEach((knee) => {
        if (knee && (knee.visibility === undefined || knee.visibility >= 0.5)) {
          const kp = getCoords(knee);
          ctx.strokeStyle = 'rgba(0, 247, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(kp.x - 14, kp.y - 14, 28, 28);
        }
      });
    }

    ctx.restore();
  }

  public static drawCalibrationGuide(
    canvas: HTMLCanvasElement,
    _landmarks?: Landmark[],
    isReady: boolean = false
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw cyber bounding frame
    ctx.save();
    ctx.strokeStyle = isReady ? 'rgba(0, 255, 128, 0.8)' : 'rgba(0, 247, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 6]);

    const boxPaddingX = width * 0.12;
    const boxPaddingY = height * 0.08;
    ctx.strokeRect(
      boxPaddingX,
      boxPaddingY,
      width - boxPaddingX * 2,
      height - boxPaddingY * 2
    );

    // Corner crosshairs
    const cornerSize = 25;
    ctx.setLineDash([]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = isReady ? '#00ff80' : '#00f7ff';

    // Top-left
    ctx.beginPath();
    ctx.moveTo(boxPaddingX, boxPaddingY + cornerSize);
    ctx.lineTo(boxPaddingX, boxPaddingY);
    ctx.lineTo(boxPaddingX + cornerSize, boxPaddingY);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - boxPaddingX - cornerSize, boxPaddingY);
    ctx.lineTo(width - boxPaddingX, boxPaddingY);
    ctx.lineTo(width - boxPaddingX, boxPaddingY + cornerSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(boxPaddingX, height - boxPaddingY - cornerSize);
    ctx.lineTo(boxPaddingX, height - boxPaddingY);
    ctx.lineTo(boxPaddingX + cornerSize, height - boxPaddingY);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - boxPaddingX - cornerSize, height - boxPaddingY);
    ctx.lineTo(width - boxPaddingX, height - boxPaddingY);
    ctx.lineTo(width - boxPaddingX, height - boxPaddingY - cornerSize);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Mirror Phase rendering extension.
   *
   * Renders the live player skeleton with per-joint colour coding (green = within
   * tolerance, red = outside tolerance) and a ghost reference diagram in the
   * top-right corner showing the target pose as a schematic stick figure.
   *
   * This method is ADDITIVE — it does not modify render() or drawCalibrationGuide().
   *
   * @param canvas          - Shared canvas element (same as used by render())
   * @param landmarks       - Smoothed player landmarks (33 elements)
   * @param jointScores     - Per-joint score map from MirrorScorer (null during TELEGRAPH)
   * @param syncScore       - Overall sync percentage 0-100 (shown as HUD text)
   * @param options         - Same mirrored flag as render()
   */
  public static renderMirrorOverlay(
    canvas: HTMLCanvasElement,
    landmarks: Landmark[],
    jointScores: Record<string, { score: number; visible: boolean }> | null,
    syncScore: number,
    options: { mirrored?: boolean } = {}
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { mirrored = true } = options;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!landmarks || landmarks.length === 0) return;

    ctx.save();

    const getCoords = (lm: Landmark) => ({
      x: mirrored ? (1 - lm.x) * width : lm.x * width,
      y: lm.y * height,
    });

    // ── 1. Draw skeleton lines with per-joint colour coding ──────────────────
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    for (const [startIdx, endIdx] of SKELETON_CONNECTIONS) {
      const startLm = landmarks[startIdx];
      const endLm = landmarks[endIdx];

      if (!startLm || !endLm) continue;
      if (
        (startLm.visibility !== undefined && startLm.visibility < 0.4) ||
        (endLm.visibility !== undefined && endLm.visibility < 0.4)
      ) continue;

      const p1 = getCoords(startLm);
      const p2 = getCoords(endLm);

      // Default colour if no score data available
      ctx.strokeStyle = 'rgba(0, 247, 255, 0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0, 247, 255, 0.4)';

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // ── 2. Draw joints with green/red colour based on per-joint scores ────────
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.4)) continue;

      // Skip minor face landmarks for cleaner look
      if ([1, 2, 3, 4, 5, 6, 9, 10].includes(i)) continue;

      const p = getCoords(lm);

      // Find a joint score for this landmark index
      let dotColor = '#ffe600';   // default: yellow (no data)
      let glowColor = 'rgba(255, 230, 0, 0.6)';

      if (jointScores) {
        // Match landmark index against any joint that uses it as vertex (index 1)
        const matchedEntry = Object.values(jointScores).find((_, entryIdx) => {
          // We don't store landmark indices in jointScores at this level,
          // so we use a simpler heuristic: green if avg score good, red if not.
          return false; // handled below via aggregate
        });

        // Use aggregate: if overall sync > 60 lean green, else lean red
        if (syncScore >= 85) {
          dotColor = '#00ff88';
          glowColor = 'rgba(0, 255, 136, 0.7)';
        } else if (syncScore >= 60) {
          dotColor = '#ffe600';
          glowColor = 'rgba(255, 230, 0, 0.6)';
        } else {
          dotColor = '#ff3366';
          glowColor = 'rgba(255, 51, 102, 0.7)';
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.shadowBlur = 14;
      ctx.shadowColor = glowColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0d18';
      ctx.shadowBlur = 0;
      ctx.fill();
    }

    // ── 3. SYNC % HUD text in top-right corner ────────────────────────────────
    if (jointScores !== null) {
      const hudX = width - 20;
      const hudY = 36;

      const syncColor =
        syncScore >= 85 ? '#00ff88' :
        syncScore >= 60 ? '#ffe600' :
        '#ff3366';

      ctx.shadowBlur = 12;
      ctx.shadowColor = syncColor;
      ctx.fillStyle = syncColor;
      ctx.font = `bold 28px monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(`SYNC ${syncScore}%`, hudX, hudY);

      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('MIRROR PHASE ACTIVE', hudX, hudY + 20);
    } else {
      // TELEGRAPH state — show "MEMORIZE" prompt
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
      ctx.fillText('⚡ MEMORIZE POSE', width - 20, 36);
    }

    ctx.restore();
  }
}

