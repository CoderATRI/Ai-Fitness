import React from 'react';
import { Play, Sparkles, Camera, Cpu, Award, Zap, ShoppingBag, Flame, Coins } from 'lucide-react';
import { EXERCISE_DEFINITIONS } from '../vision/detectors/ExerciseManager';
import { MonsterManager } from '../game/MonsterManager';
import { MonsterVisual } from './MonsterVisual';
import { StreakTracker } from './StreakTracker';

interface LandingPageProps {
  onStartBattle: () => void;
  onStartMirrorBattle?: () => void;
  onOpenHelp: () => void;
  onOpenStore?: () => void;
  isDemoMode: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartBattle,
  onStartMirrorBattle,
  onOpenHelp,
  onOpenStore,
  isDemoMode,
}) => {
  const exercises = Object.values(EXERCISE_DEFINITIONS);
  const sampleMonster = MonsterManager.getMonsterByIndex(0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Hero Section */}
      <div
        className="cyber-panel"
        style={{
          padding: '48px 36px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'center',
          marginBottom: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ zIndex: 2 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
              }}
            >
              <Sparkles size={16} color="var(--neon-cyan)" />
              <span
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: '0.75rem',
                  color: 'var(--neon-cyan)',
                  letterSpacing: '1px',
                }}
              >
                HACKATHON SHOWCASE: REAL CV + DYNAMIC AI
              </span>
            </div>

            {/* Streak & Coin Tracker in Hero */}
            <StreakTracker compact onOpenStore={onOpenStore} />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-gaming)',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: '18px',
              textTransform: 'uppercase',
            }}
          >
            FIGHT MONSTERS WITH YOUR <span style={{ color: 'var(--neon-cyan)' }}>REAL BODY</span>.
          </h2>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              marginBottom: '32px',
              maxWidth: '540px',
            }}
          >
            Step in front of your camera. Your movements are tracked by a 33-point computer vision neural net.
            Valid repetitions charge devastating attacks against adaptive AI bosses.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={onStartBattle}
              className="cyber-button"
              style={{
                padding: '16px 32px',
                fontSize: '1.1rem',
              }}
            >
              <Play size={20} fill="currentColor" />
              START BATTLE
            </button>

            <button
              onClick={onStartMirrorBattle || onStartBattle}
              className="cyber-button"
              style={{
                padding: '16px 32px',
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.25), rgba(255, 230, 0, 0.25))',
                borderColor: 'var(--neon-yellow)',
                color: '#fff',
                boxShadow: '0 0 20px rgba(255, 230, 0, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
              }}
              title="Launch directly into NEXUS PRIME Mirror Phase Boss Gauntlet"
            >
              <Zap size={20} color="var(--neon-yellow)" fill="currentColor" />
              BATTLE IN STYLE
            </button>

            {onOpenStore && (
              <button
                onClick={onOpenStore}
                className="cyber-button"
                style={{
                  padding: '16px 28px',
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, rgba(255, 230, 0, 0.2), rgba(0, 240, 255, 0.2))',
                  borderColor: 'var(--neon-yellow)',
                  color: '#fff',
                  boxShadow: '0 0 20px rgba(255, 230, 0, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <ShoppingBag size={20} color="var(--neon-yellow)" />
                REWARDS STORE
              </button>
            )}

            <button
              onClick={onOpenHelp}
              className="cyber-button cyber-button-magenta"
              style={{ padding: '16px 26px' }}
            >
              HOW TO PLAY
            </button>
          </div>

          <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-gaming)',
                color: 'var(--neon-yellow)',
                background: 'rgba(255, 230, 0, 0.1)',
                border: '1px solid rgba(255, 230, 0, 0.35)',
                padding: '4px 12px',
                borderRadius: '12px',
                letterSpacing: '1px',
              }}
            >
              ⚡ BATTLE IN STYLE: DIRECT NEXUS PRIME MIRROR PHASE GAUNTLET
            </span>
          </div>


          {isDemoMode && (
            <div
              style={{
                marginTop: '16px',
                color: 'var(--neon-yellow)',
                fontFamily: 'var(--font-sub)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ⚡ Simulation Mode is ACTIVE. You can test workouts with or without a physical webcam!
            </div>
          )}
        </div>

        {/* Hero Monster Showcase */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 240, 255, 0.25) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
          <MonsterVisual id={sampleMonster.id} name={sampleMonster.name} size={260} />
          <div
            style={{
              marginTop: '12px',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '6px 18px',
              borderRadius: '20px',
              border: '1px solid rgba(0, 240, 255, 0.3)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '0.85rem',
                color: 'var(--neon-cyan)',
              }}
            >
              TARGET 1: {sampleMonster.name}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Pillar Features */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '48px',
        }}
      >
        <div className="cyber-panel" style={{ padding: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid var(--neon-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}
          >
            <Camera size={26} color="var(--neon-cyan)" />
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-gaming)',
              fontSize: '1.1rem',
              marginBottom: '10px',
              color: 'var(--text-primary)',
            }}
          >
            Real Computer Vision
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Direct browser pose landmarker with 33 anatomical landmarks. Tracks joint angles, squat depth,
            and back posture in real-time. Zero fake button clicks.
          </p>
        </div>

        <div className="cyber-panel" style={{ padding: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'rgba(255, 0, 127, 0.1)',
              border: '1px solid var(--neon-magenta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}
          >
            <Cpu size={26} color="var(--neon-magenta)" />
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-gaming)',
              fontSize: '1.1rem',
              marginBottom: '10px',
              color: 'var(--text-primary)',
            }}
          >
            Dynamic AI Challenge Engine
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Analyzes rep cadence, depth quality, accuracy, and fatigue curves. LLM backend + offline adaptive
            algorithm dynamically tunes difficulty and exercise selection.
          </p>
        </div>

        <div className="cyber-panel" style={{ padding: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'rgba(255, 230, 0, 0.1)',
              border: '1px solid var(--neon-yellow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}
          >
            <Award size={26} color="var(--neon-yellow)" />
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-gaming)',
              fontSize: '1.1rem',
              marginBottom: '10px',
              color: 'var(--text-primary)',
            }}
          >
            Full Battle Progression
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            5 distinct animated monsters, combo multipliers, screen shake, procedural Web Audio SFX,
            and a multi-phase AI Singularity Boss fight!
          </p>
        </div>
      </div>

      {/* Exercises Section */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-gaming)',
              fontSize: '1.6rem',
              color: 'var(--neon-cyan)',
              marginBottom: '8px',
            }}
          >
            TRAINING MOVEMENTS
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Each exercise has dedicated joint-angle state machines and form correction feedback.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {exercises.map((ex) => (
            <div
              key={ex.type}
              className="cyber-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>{ex.icon}</div>
                <h4
                  style={{
                    fontFamily: 'var(--font-gaming)',
                    fontSize: '1.05rem',
                    marginBottom: '8px',
                  }}
                >
                  {ex.name}
                </h4>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                  }}
                >
                  {ex.description}
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-sub)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  TARGET:
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-sub)',
                    fontSize: '0.8rem',
                    color: 'var(--neon-cyan)',
                    fontWeight: 600,
                  }}
                >
                  {ex.targetMuscles}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
