import React, { useState } from 'react';
import { Flame, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { useRewards } from '../context/RewardsContext';
import { CoinDisplay } from './CoinDisplay';
import { StreakRestoreModal } from './StreakRestoreModal';

interface StreakTrackerProps {
  onOpenStore?: () => void;
  compact?: boolean;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({ onOpenStore, compact = false }) => {
  const { currentStreak, coinBalance, streakInfo } = useRewards();
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState<boolean>(false);

  const { status, previousStreak, canRestore } = streakInfo;

  return (
    <>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: compact ? '10px' : '14px',
          background: 'rgba(7, 10, 19, 0.75)',
          backdropFilter: 'blur(10px)',
          border:
            status === 'broken'
              ? '1px solid rgba(255, 136, 0, 0.5)'
              : status === 'completed_today'
              ? '1px solid rgba(0, 255, 136, 0.4)'
              : '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '12px',
          padding: compact ? '6px 12px' : '8px 16px',
          boxShadow:
            status === 'broken'
              ? '0 0 15px rgba(255, 136, 0, 0.2)'
              : status === 'completed_today'
              ? '0 0 15px rgba(0, 255, 136, 0.15)'
              : '0 0 15px rgba(0, 240, 255, 0.15)',
          userSelect: 'none',
          flexWrap: 'nowrap',
        }}
      >
        {/* Streak Indicator Section */}
        {status === 'broken' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#ff8800',
                filter: 'drop-shadow(0 0 8px rgba(255, 136, 0, 0.6))',
              }}
            >
              <AlertTriangle size={compact ? 16 : 18} />
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: compact ? '0.75rem' : '0.85rem',
                  color: '#ff8800',
                  fontWeight: 700,
                  letterSpacing: '1px',
                }}
              >
                STREAK BROKEN
              </div>
              {!compact && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Prev: {previousStreak} {previousStreak === 1 ? 'day' : 'days'}
                </div>
              )}
            </div>

            {/* Quick Restore Action Button */}
            <button
              onClick={() => setIsRestoreModalOpen(true)}
              className="cyber-button cyber-button-sm"
              style={{
                padding: '3px 8px',
                fontSize: '0.7rem',
                borderColor: '#ff8800',
                color: '#fff',
                background: 'rgba(255, 136, 0, 0.25)',
                gap: '4px',
              }}
              title="Restore your broken workout streak for 50 coins"
            >
              <RotateCcw size={12} />
              RESTORE (50 🪙)
            </button>
          </div>
        ) : status === 'completed_today' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--neon-green)',
                filter: 'drop-shadow(0 0 8px rgba(0, 255, 136, 0.6))',
              }}
            >
              <Flame size={compact ? 18 : 22} fill="currentColor" />
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: compact ? '0.85rem' : '0.95rem',
                  color: 'var(--neon-green)',
                  fontWeight: 700,
                  letterSpacing: '1px',
                }}
              >
                {currentStreak} {currentStreak === 1 ? 'DAY STREAK' : 'DAYS STREAK'}
              </div>
              {!compact && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--neon-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={12} /> WORKOUT COMPLETE TODAY
                </div>
              )}
            </div>
          </div>
        ) : status === 'active' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--neon-magenta)',
                filter: 'drop-shadow(0 0 8px rgba(255, 0, 127, 0.6))',
              }}
            >
              <Flame size={compact ? 18 : 22} fill="currentColor" />
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: compact ? '0.85rem' : '0.95rem',
                  color: 'var(--neon-magenta)',
                  fontWeight: 700,
                  letterSpacing: '1px',
                }}
              >
                {currentStreak} {currentStreak === 1 ? 'DAY STREAK' : 'DAYS STREAK'}
              </div>
              {!compact && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  BATTLE TODAY TO EXTEND
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Flame size={compact ? 18 : 22} />
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: compact ? '0.8rem' : '0.85rem',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  letterSpacing: '1px',
                }}
              >
                START STREAK
              </div>
              {!compact && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Complete a battle today
                </div>
              )}
            </div>
          </div>
        )}

        {/* Separator Divider */}
        <div
          style={{
            width: '1px',
            height: '24px',
            background: 'rgba(255, 255, 255, 0.15)',
          }}
        />

        {/* Coin Balance Section */}
        <CoinDisplay
          amount={coinBalance}
          size={compact ? 'sm' : 'md'}
          onClick={onOpenStore}
          title={onOpenStore ? 'Click to open Rewards Store' : undefined}
        />
      </div>

      {/* Streak Restore Confirmation Modal */}
      <StreakRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
      />
    </>
  );
};
