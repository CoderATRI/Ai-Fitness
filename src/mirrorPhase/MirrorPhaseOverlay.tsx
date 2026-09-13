/**
 * MirrorPhaseOverlay.tsx
 *
 * React UI component for the Mirror Phase — renders on top of the battle arena
 * while MirrorPhaseController is active. Uses only existing CSS custom properties
 * and the cyber-panel/cyber-button class system. No new design language.
 *
 * This component is DISPLAY-ONLY — it receives all state as props from BattleArena.
 * It has no internal game logic.
 */

import React from 'react';
import { MirrorPhaseState, MirrorOutcome } from './MirrorPhaseController';
import { PoseTarget } from './PoseTargetLibrary';
import { PoseScoreResult } from './MirrorScorer';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MirrorRenderState {
  /** Current FSM state string */
  phase: MirrorPhaseState;
  /** The target pose being shown/matched */
  activePose: PoseTarget | null;
  /** Current pose index (0-based) */
  poseIndex: number;
  /** Total poses in gauntlet */
  totalPoses: number;
  /** Seconds remaining in countdown (only meaningful in COUNTDOWN state) */
  countdownSeconds: number;
  /** Real-time best score so far in current window (0-100) */
  currentScore: number;
  /** Live frame score result for joint color display */
  frameResult: PoseScoreResult | null;
  /** Outcome of the just-resolved pose (shown in RESOLVED state) */
  resolvedOutcome: MirrorOutcome | null;
  /** Resolved best score (shown in RESOLVED state) */
  resolvedScore: number;
}

interface MirrorPhaseOverlayProps {
  state: MirrorRenderState;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MirrorPhaseOverlay: React.FC<MirrorPhaseOverlayProps> = ({ state }) => {
  const { phase, activePose, poseIndex, totalPoses, countdownSeconds, currentScore, resolvedOutcome, resolvedScore } = state;

  // Full-screen wrapper — sits above the battle grid via z-index
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(4, 6, 14, 0.88)',
        backdropFilter: 'blur(10px)',
        gap: '24px',
        padding: '20px',
      }}
    >
      {/* ── NEXUS PRIME Protocol Banner ── */}
      <div
        style={{
          textAlign: 'center',
          borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
          paddingBottom: '16px',
          width: '100%',
          maxWidth: '640px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-gaming)',
            fontSize: '0.75rem',
            color: '#ef4444',
            letterSpacing: '3px',
            marginBottom: '6px',
          }}
        >
          ⚡ NEXUS PRIME INITIATES SYNCHRONIZATION PROTOCOL
        </div>
        <div
          style={{
            fontFamily: 'var(--font-gaming)',
            fontSize: '1.6rem',
            color: '#fff',
            textShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
          }}
        >
          MIRROR PHASE — GAUNTLET
        </div>
        <div
          style={{
            marginTop: '6px',
            fontFamily: 'var(--font-sub)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          POSE {poseIndex + 1} / {totalPoses}
        </div>
      </div>

      {/* ── Main card ── */}
      <div
        className="cyber-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.2)',
        }}
      >
        {/* Pose silhouette + name */}
        {activePose && (
          <>
            <div style={{ fontSize: '4rem', lineHeight: 1 }}>{activePose.silhouetteEmoji}</div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: '1.8rem',
                  color: 'var(--neon-cyan)',
                  textShadow: '0 0 12px rgba(0, 247, 255, 0.6)',
                  marginBottom: '8px',
                }}
              >
                {activePose.displayName}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sub)',
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {activePose.instruction}
              </div>
            </div>
          </>
        )}

        {/* State-specific content */}
        {phase === 'TELEGRAPH' && <TelegraphPanel />}
        {phase === 'COUNTDOWN' && <CountdownPanel seconds={countdownSeconds} />}
        {phase === 'ACTIVE_MATCHING' && <MatchingPanel score={currentScore} />}
        {phase === 'RESOLVED' && resolvedOutcome && (
          <ResolvedPanel outcome={resolvedOutcome} score={resolvedScore} />
        )}
      </div>

      {/* ── Pose progress dots ── */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {Array.from({ length: totalPoses }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background:
                i < poseIndex
                  ? 'var(--neon-green)'
                  : i === poseIndex
                  ? 'var(--neon-cyan)'
                  : 'rgba(255,255,255,0.15)',
              boxShadow:
                i === poseIndex
                  ? '0 0 10px rgba(0, 247, 255, 0.8)'
                  : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Sub-panels ───────────────────────────────────────────────────────────────

const TelegraphPanel: React.FC = () => (
  <div
    style={{
      padding: '12px 24px',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      borderRadius: '8px',
      background: 'rgba(239, 68, 68, 0.08)',
      fontFamily: 'var(--font-gaming)',
      fontSize: '0.9rem',
      color: '#ef4444',
      letterSpacing: '2px',
      animation: 'pulseGlow 1.5s infinite',
    }}
  >
    MEMORIZE THIS POSE...
  </div>
);

const CountdownPanel: React.FC<{ seconds: number }> = ({ seconds }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
    {/* Countdown ring */}
    <div
      style={{
        width: '90px',
        height: '90px',
        borderRadius: '50%',
        border: '4px solid var(--neon-cyan)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 24px rgba(0, 247, 255, 0.6)',
        animation: 'pulseGlow 0.8s infinite',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-gaming)',
          fontSize: '2.4rem',
          fontWeight: 900,
          color: 'var(--neon-cyan)',
        }}
      >
        {seconds}
      </span>
    </div>
    <div
      style={{
        fontFamily: 'var(--font-gaming)',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        letterSpacing: '2px',
      }}
    >
      GET READY...
    </div>
  </div>
);

const MatchingPanel: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct >= 85 ? 'var(--neon-green)' : pct >= 60 ? 'var(--neon-yellow)' : 'var(--neon-red)';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      {/* MIRROR NOW banner */}
      <div
        style={{
          fontFamily: 'var(--font-gaming)',
          fontSize: '1.4rem',
          fontWeight: 900,
          color: 'var(--neon-cyan)',
          textShadow: '0 0 20px rgba(0, 247, 255, 0.9)',
          letterSpacing: '3px',
          animation: 'pulseGlow 0.6s infinite',
        }}
      >
        ⚡ MIRROR NOW!
      </div>

      {/* Sync score */}
      <div
        style={{
          fontFamily: 'var(--font-gaming)',
          fontSize: '2.6rem',
          fontWeight: 900,
          color,
          textShadow: `0 0 16px ${color}`,
        }}
      >
        {pct}%
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '10px',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '5px',
          overflow: 'hidden',
          border: `1px solid ${color}`,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            boxShadow: `0 0 10px ${color}`,
            transition: 'width 0.12s ease-out',
          }}
        />
      </div>

      <div
        style={{
          fontFamily: 'var(--font-sub)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}
      >
        SYNCHRONIZATION IN PROGRESS — HOLD YOUR FORM
      </div>
    </div>
  );
};

const ResolvedPanel: React.FC<{ outcome: MirrorOutcome; score: number }> = ({ outcome, score }) => {
  const config =
    outcome === 'perfect'
      ? { label: '🔥 PERFECT MIRROR!', color: 'var(--neon-green)', glow: 'rgba(0, 255, 136, 0.6)' }
      : outcome === 'partial'
      ? { label: '⚡ PARTIAL MATCH', color: 'var(--neon-yellow)', glow: 'rgba(255, 230, 0, 0.5)' }
      : { label: '✕ MIRROR FAILED', color: 'var(--neon-red)', glow: 'rgba(255, 51, 102, 0.6)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          fontFamily: 'var(--font-gaming)',
          fontSize: '1.6rem',
          fontWeight: 900,
          color: config.color,
          textShadow: `0 0 20px ${config.glow}`,
        }}
      >
        {config.label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sub)',
          fontSize: '1rem',
          color: 'var(--text-secondary)',
        }}
      >
        SYNC SCORE: <span style={{ color: config.color, fontWeight: 700 }}>{score}%</span>
      </div>
    </div>
  );
};

export type { MirrorOutcome };
