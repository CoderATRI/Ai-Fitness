import React, { useState, useEffect } from 'react';
import { X, Trophy, Trash2 } from 'lucide-react';
import { StorageService } from '../data/StorageService';

interface CareerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CareerStatsModal: React.FC<CareerStatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(() => StorageService.getCareerStats());
  const [history, setHistory] = useState(() => StorageService.getBattleHistory());

  useEffect(() => {
    if (isOpen) {
      setStats(StorageService.getCareerStats());
      setHistory(StorageService.getBattleHistory());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (window.confirm('Reset all career workout data and history?')) {
      localStorage.clear();
      setStats(StorageService.getCareerStats());
      setHistory([]);
    }
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
          maxWidth: '750px',
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
            <Trophy size={24} color="var(--neon-yellow)" />
            <h3 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.4rem' }}>CAREER WORKOUT LOG</h3>
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

        {/* Lifetime Key Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(0, 240, 255, 0.05)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL BATTLES</span>
            <h4 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.4rem', color: 'var(--neon-cyan)' }}>
              {stats.totalBattles}
            </h4>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(0, 255, 136, 0.05)',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>VICTORIES</span>
            <h4 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.4rem', color: 'var(--neon-green)' }}>
              {stats.victories}
            </h4>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 230, 0, 0.05)',
              border: '1px solid rgba(255, 230, 0, 0.2)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL REPS</span>
            <h4 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.4rem', color: 'var(--neon-yellow)' }}>
              {stats.totalReps}
            </h4>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 0, 127, 0.05)',
              border: '1px solid rgba(255, 0, 127, 0.2)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BEST COMBO</span>
            <h4 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.4rem', color: 'var(--neon-magenta)' }}>
              x{stats.highestCombo}
            </h4>
          </div>
        </div>

        {/* Reps by Exercise */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-gaming)',
              fontSize: '1rem',
              color: 'var(--neon-cyan)',
              marginBottom: '10px',
            }}
          >
            LIFETIME EXERCISE TOTALS
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px',
            }}
          >
            {Object.entries(stats.repsByExercise).map(([ex, count]) => (
              <div
                key={ex}
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
                  {ex.replace('_', ' ')}
                </span>
                <span style={{ fontFamily: 'var(--font-gaming)', color: 'var(--neon-cyan)' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Past Battle Runs History */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-gaming)',
              fontSize: '1rem',
              color: 'var(--neon-cyan)',
              marginBottom: '10px',
            }}
          >
            RECENT BATTLES
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
            {history.length > 0 ? (
              history.map((h) => (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-gaming)',
                        background:
                          h.result === 'VICTORY'
                            ? 'rgba(0, 255, 136, 0.15)'
                            : 'rgba(255, 51, 102, 0.15)',
                        color: h.result === 'VICTORY' ? 'var(--neon-green)' : 'var(--neon-red)',
                      }}
                    >
                      {h.result}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{h.date}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                    <span>{h.totalReps} Reps</span>
                    <span style={{ color: 'var(--neon-yellow)' }}>{h.score.toLocaleString()} pts</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px' }}>
                No completed battles recorded yet. Start your first fight!
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <button
            onClick={handleClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={14} /> Clear Career Data
          </button>
          <button onClick={onClose} className="cyber-button cyber-button-sm">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
