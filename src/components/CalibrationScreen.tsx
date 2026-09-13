import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Camera, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { PoseEstimator } from '../vision/PoseEstimator';
import { PoseOverlayRenderer } from '../vision/PoseOverlay';
import { CalibrationStatus, Landmark } from '../types';
import { AudioSystem } from '../game/AudioSystem';
import { AICoachService } from '../ai/AICoach';

interface CalibrationScreenProps {
  onCalibrationComplete: () => void;
  onCancel: () => void;
  isDemoMode: boolean;
}

export const CalibrationScreen: React.FC<CalibrationScreenProps> = ({
  onCalibrationComplete,
  onCancel,
  isDemoMode,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseEstimatorRef = useRef<PoseEstimator | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [calibration, setCalibration] = useState<CalibrationStatus>({
    isCalibrated: false,
    headVisible: false,
    shouldersVisible: false,
    hipsVisible: false,
    kneesVisible: false,
    feetVisible: false,
    progress: 0,
    message: 'Initializing camera neural net...',
  });

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function setupVision() {
      if (isDemoMode) {
        setIsLoadingModel(false);
        setCalibration({
          isCalibrated: true,
          headVisible: true,
          shouldersVisible: true,
          hipsVisible: true,
          kneesVisible: true,
          feetVisible: true,
          progress: 100,
          message: 'Simulation Mode Active: Systems ready!',
        });
        return;
      }

      try {
        setIsLoadingModel(true);
        const estimator = new PoseEstimator();
        poseEstimatorRef.current = estimator;

        await estimator.initialize();

        if (!isMounted) return;
        setIsLoadingModel(false);

        if (videoRef.current) {
          await estimator.startCamera(videoRef.current);
        }

        estimator.setOnResults((landmarks: Landmark[]) => {
          if (!isMounted) return;

          const status = PoseEstimator.checkCalibration(landmarks);
          setCalibration(status);

          if (canvasRef.current) {
            PoseOverlayRenderer.render(canvasRef.current, landmarks, {
              showAngles: false,
              isCalibrated: status.isCalibrated,
              postureValid: status.isCalibrated,
            });
            PoseOverlayRenderer.drawCalibrationGuide(
              canvasRef.current,
              landmarks,
              status.isCalibrated
            );
          }
        });
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Camera/Pose initialization error:', err);
        setCameraError(err.message || 'Unable to access camera or load pose model.');
        setIsLoadingModel(false);
      }
    }

    setupVision();

    return () => {
      isMounted = false;
      if (poseEstimatorRef.current) {
        poseEstimatorRef.current.stop();
        poseEstimatorRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [isDemoMode]);

  // Handle countdown when full body calibrated
  useEffect(() => {
    if (calibration.isCalibrated && countdown === null) {
      AICoachService.speak('Full body locked. Hold still!');
      AudioSystem.playRepSuccess(3);
      setCountdown(3);

      let counter = 3;
      countdownTimerRef.current = setInterval(() => {
        counter -= 1;
        if (counter > 0) {
          setCountdown(counter);
          AudioSystem.playRepSuccess(2);
        } else {
          clearInterval(countdownTimerRef.current);
          setCountdown(0);
          AudioSystem.playAttackReady();
          AICoachService.speak('Calibration complete! Entering battle!');
          setTimeout(() => {
            if (poseEstimatorRef.current) {
              poseEstimatorRef.current.stop();
            }
            onCalibrationComplete();
          }, 800);
        }
      }, 1000);
    } else if (!calibration.isCalibrated && countdown !== null && countdown > 0) {
      // Player stepped out during countdown
      clearInterval(countdownTimerRef.current);
      setCountdown(null);
    }
  }, [calibration.isCalibrated, countdown, onCalibrationComplete]);

  const checklistItems = [
    { label: 'Head & Face Visible', valid: calibration.headVisible },
    { label: 'Shoulders Tracked', valid: calibration.shouldersVisible },
    { label: 'Hips Centered', valid: calibration.hipsVisible },
    { label: 'Knees in Frame', valid: calibration.kneesVisible },
    { label: 'Feet & Ankles Grounded', valid: calibration.feetVisible },
  ];

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '30px 20px',
        minHeight: 'calc(100vh - 90px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-gaming)',
            fontSize: '1.8rem',
            letterSpacing: '2px',
            color: 'var(--neon-cyan)',
            marginBottom: '8px',
          }}
        >
          CALIBRATION CHAMBER
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Stand 6-8 feet away until your entire body is framed inside the cyber grid.
        </p>
      </div>

      {/* Main Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          width: '100%',
          alignItems: 'start',
        }}
      >
        {/* Camera Viewport */}
        <div
          className="cyber-panel"
          style={{
            padding: '12px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '440px',
            justifyContent: 'center',
          }}
        >
          {cameraError ? (
            <div
              style={{
                textAlign: 'center',
                padding: '30px 20px',
                color: 'var(--neon-red)',
              }}
            >
              <AlertTriangle size={48} style={{ marginBottom: '16px' }} />
              <h3 style={{ fontFamily: 'var(--font-gaming)', marginBottom: '10px' }}>
                CAMERA ACCESS ERROR
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {cameraError}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Please allow camera permissions in your browser or enable Simulation Mode in the top bar.
              </p>
              <button
                onClick={() => {
                  if (poseEstimatorRef.current) {
                    poseEstimatorRef.current.stop();
                  }
                  onCalibrationComplete();
                }}
                className="cyber-button cyber-button-magenta"
              >
                PROCEED ANYWAY (SIMULATION)
              </button>
            </div>
          ) : (
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#000',
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirrored
                }}
              />
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              />

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(7, 10, 19, 0.75)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-gaming)',
                      fontSize: '6rem',
                      fontWeight: 900,
                      color: countdown === 0 ? 'var(--neon-green)' : 'var(--neon-cyan)',
                      textShadow: '0 0 30px currentColor',
                      animation: 'popIn 0.3s ease-out',
                    }}
                  >
                    {countdown === 0 ? 'READY!' : countdown}
                  </span>
                  <p
                    style={{
                      fontFamily: 'var(--font-sub)',
                      fontSize: '1.2rem',
                      color: 'var(--text-primary)',
                      letterSpacing: '2px',
                    }}
                  >
                    {countdown === 0 ? 'COMMENCING BATTLE' : 'HOLD POSITION'}
                  </p>
                </div>
              )}

              {/* Loading Spinner */}
              {isLoadingModel && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(7, 10, 19, 0.85)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(0, 240, 255, 0.2)',
                      borderTopColor: 'var(--neon-cyan)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <p style={{ fontFamily: 'var(--font-gaming)', fontSize: '0.9rem', color: 'var(--neon-cyan)' }}>
                    LOADING POSE RECOGNITION...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Feedback Banner */}
          <div
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '10px 16px',
              borderRadius: '6px',
              background: calibration.isCalibrated
                ? 'rgba(0, 255, 136, 0.15)'
                : 'rgba(0, 240, 255, 0.1)',
              border: `1px solid ${calibration.isCalibrated ? 'var(--neon-green)' : 'var(--neon-cyan)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Camera size={18} color={calibration.isCalibrated ? 'var(--neon-green)' : 'var(--neon-cyan)'} />
              <span
                style={{
                  fontFamily: 'var(--font-sub)',
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {calibration.message}
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '0.85rem',
                color: calibration.isCalibrated ? 'var(--neon-green)' : 'var(--neon-cyan)',
              }}
            >
              {calibration.progress}%
            </span>
          </div>
        </div>

        {/* Checklist and Action Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="cyber-panel" style={{ padding: '24px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '1.1rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldCheck size={20} color="var(--neon-cyan)" />
              SKELETON LOCK STATUS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: item.valid ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${item.valid ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  }}
                >
                  <span style={{ fontSize: '0.9rem', color: item.valid ? '#fff' : 'var(--text-secondary)' }}>
                    {item.label}
                  </span>
                  {item.valid ? (
                    <CheckCircle2 size={18} color="var(--neon-green)" />
                  ) : (
                    <XCircle size={18} color="var(--text-muted)" />
                  )}
                </div>
              ))}
            </div>

            {/* Calibration Tips */}
            <div
              style={{
                padding: '12px',
                borderRadius: '6px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderLeft: '3px solid var(--neon-cyan)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <strong>Tips for Best Detection:</strong>
              <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
                <li>Ensure your room is well lit.</li>
                <li>Stand far enough so feet and ankles are within camera view.</li>
                <li>Wear clothes that contrast with your background.</li>
              </ul>
            </div>
          </div>

          {/* Quick Start / Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                if (poseEstimatorRef.current) {
                  poseEstimatorRef.current.stop();
                }
                onCalibrationComplete();
              }}
              className="cyber-button"
              style={{ flex: 1, padding: '14px' }}
            >
              ENTER BATTLE <ArrowRight size={18} />
            </button>
            <button
              onClick={() => {
                if (poseEstimatorRef.current) {
                  poseEstimatorRef.current.stop();
                }
                onCancel();
              }}
              className="cyber-button cyber-button-magenta"
              style={{ padding: '14px 20px' }}
            >
              BACK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
