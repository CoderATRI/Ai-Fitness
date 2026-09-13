import React from 'react';
import { X, Camera, Dumbbell, Zap, Flame, Shield, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(7, 10, 19, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="cyber-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={24} color="var(--neon-cyan)" />
            <h3 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.4rem' }}>HOW TO PLAY</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* 4 Step Combat Protocol */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(0, 240, 255, 0.05)',
              borderLeft: '4px solid var(--neon-cyan)',
              display: 'flex',
              gap: '16px',
            }}
          >
            <Camera size={26} color="var(--neon-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1rem', marginBottom: '4px' }}>
                1. CAMERA CALIBRATION
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Position yourself 6 to 8 feet from the webcam so your head, torso, knees, and feet are all inside the frame. When the skeleton locks on, the battle initiates automatically!
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(255, 0, 127, 0.05)',
              borderLeft: '4px solid var(--neon-magenta)',
              display: 'flex',
              gap: '16px',
            }}
          >
            <Dumbbell size={26} color="var(--neon-magenta)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1rem', marginBottom: '4px' }}>
                2. EXERCISE MOTION DETECTION
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Execute the assigned exercise:
                <br />• <strong>Squats:</strong> Sink your hips until thighs are parallel to the ground (knee angle ≤ 100°), then stand fully upright.
                <br />• <strong>Cyber Jacks:</strong> Jump feet wide while raising hands above head, then snap back to center.
                <br />• <strong>Hyper Lunges:</strong> Step forward, bending front knee to 90°, then push back to standing.
                <br />• <strong>Velocity High Knees:</strong> Pump knees alternatingly up to hip level in rapid tempo.
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(255, 230, 0, 0.05)',
              borderLeft: '4px solid var(--neon-yellow)',
              display: 'flex',
              gap: '16px',
            }}
          >
            <Flame size={26} color="var(--neon-yellow)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1rem', marginBottom: '4px' }}>
                3. COMBO STREAKS & ATTACK REWARDS
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Every valid rep charges your attack meter and builds your Combo multiplier (up to 2.0x at 10 reps). Completing the target reps launches a kinetic blast that depletes monster HP! Shallow or cheated reps reset your combo.
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(0, 255, 136, 0.05)',
              borderLeft: '4px solid var(--neon-green)',
              display: 'flex',
              gap: '16px',
            }}
          >
            <Zap size={26} color="var(--neon-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1rem', marginBottom: '4px' }}>
                4. ADAPTIVE AI GAME MASTER
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                After every round, our AI calculates your rep accuracy, movement quality score, speed cadence, and fatigue curve. It dynamically chooses the next exercise and adjusts difficulty so you stay challenged without burning out!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose} className="cyber-button">
            GOT IT, LET'S BATTLE!
          </button>
        </div>
      </div>
    </div>
  );
};
