import React, { useState } from 'react';
import { Flame, X, AlertTriangle, CheckCircle, Coins } from 'lucide-react';
import { useRewards } from '../context/RewardsContext';
import { CoinDisplay } from './CoinDisplay';

interface StreakRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StreakRestoreModal: React.FC<StreakRestoreModalProps> = ({ isOpen, onClose }) => {
  const { coinBalance, previousStreak, streakInfo, restoreStreak } = useRewards();
  const [restored, setRestored] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const cost = streakInfo.restoreCost || 50;
  const targetStreak = previousStreak > 0 ? previousStreak : 1;
  const balanceAfter = coinBalance - cost;
  const canAfford = coinBalance >= cost;

  const handleConfirmRestore = () => {
    setErrorMessage(null);
    const result = restoreStreak();
    if (result.success) {
      setRestored(true);
      setTimeout(() => {
        setRestored(false);
        onClose();
      }, 2000);
    } else {
      setErrorMessage(result.error || 'Failed to restore streak.');
    }
  };

  const handleClose = () => {
    setRestored(false);
    setErrorMessage(null);
    onClose();
  };

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
        zIndex: 300,
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
          maxWidth: '500px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          borderColor: restored ? 'var(--neon-green)' : 'rgba(255, 136, 0, 0.6)',
          boxShadow: restored
            ? '0 0 35px rgba(0, 255, 136, 0.3)'
            : '0 0 35px rgba(255, 136, 0, 0.25)',
        }}
      >
        {/* Close Button */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {restored ? (
          /* Success Screen */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px 0' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'rgba(0, 255, 136, 0.15)',
                border: '2px solid var(--neon-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(0, 255, 136, 0.4)',
              }}
            >
              <CheckCircle size={42} color="var(--neon-green)" />
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '1.6rem',
                color: 'var(--neon-green)',
                letterSpacing: '1.5px',
              }}
            >
              STREAK RESTORED!
            </h3>

            <div
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '2rem',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Flame size={32} color="var(--neon-magenta)" fill="currentColor" />
              {targetStreak} DAY STREAK
            </div>

            <p style={{ color: 'var(--neon-red)', fontFamily: 'var(--font-gaming)', fontSize: '1.1rem' }}>
              -{cost} COINS
            </p>
          </div>
        ) : (
          /* Confirmation Screen */
          <>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(255, 136, 0, 0.15)',
                border: '2px solid #ff8800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 0 20px rgba(255, 136, 0, 0.4)',
              }}
            >
              <Flame size={38} color="#ff8800" fill="currentColor" />
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '1.5rem',
                color: '#fff',
                letterSpacing: '1.5px',
                marginBottom: '8px',
              }}
            >
              RESTORE YOUR STREAK?
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
              You missed a workout day, but you can salvage your progress! Your{' '}
              <strong style={{ color: '#ff8800' }}>{targetStreak}-day streak</strong> will be completely restored.
            </p>

            {/* Cost Breakdown Card */}
            <div
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 230, 0, 0.2)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Restoration Cost:</span>
                <CoinDisplay amount={cost} size="sm" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Current Balance:</span>
                <CoinDisplay amount={coinBalance} size="sm" />
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingTop: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                  Balance After Restore:
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-gaming)',
                    fontSize: '1rem',
                    color: canAfford ? 'var(--neon-green)' : 'var(--neon-red)',
                  }}
                >
                  {balanceAfter >= 0 ? `${balanceAfter} COINS` : 'INSUFFICIENT COINS'}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div
                style={{
                  color: 'var(--neon-red)',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertTriangle size={16} />
                {errorMessage}
              </div>
            )}

            {!canAfford && (
              <p
                style={{
                  color: 'var(--neon-red)',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-sub)',
                }}
              >
                You need {cost} coins to restore your streak. Complete battles to earn coins!
              </p>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '14px', width: '100%' }}>
              <button
                onClick={handleClose}
                className="cyber-button"
                style={{ flex: 1, borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}
              >
                CANCEL
              </button>

              <button
                onClick={handleConfirmRestore}
                disabled={!canAfford}
                className="cyber-button"
                style={{
                  flex: 1.4,
                  background: canAfford
                    ? 'linear-gradient(135deg, rgba(255, 136, 0, 0.3), rgba(255, 51, 102, 0.4))'
                    : undefined,
                  borderColor: canAfford ? '#ff8800' : undefined,
                  color: canAfford ? '#fff' : undefined,
                  boxShadow: canAfford ? '0 0 20px rgba(255, 136, 0, 0.4)' : 'none',
                }}
              >
                RESTORE STREAK
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
