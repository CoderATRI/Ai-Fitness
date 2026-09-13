import React, { useState, useEffect } from 'react';
import { Coins, Sparkles, Award, Target, Zap } from 'lucide-react';
import { CoinRewardBreakdown } from '../types/rewards';

interface CoinRewardAnimationProps {
  awardedCoins: number;
  breakdown?: CoinRewardBreakdown;
}

export const CoinRewardAnimation: React.FC<CoinRewardAnimationProps> = ({
  awardedCoins,
  breakdown,
}) => {
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [isScaled, setIsScaled] = useState<boolean>(false);

  useEffect(() => {
    // Pop-in animation trigger
    const scaleTimer = setTimeout(() => {
      setIsScaled(true);
    }, 100);

    // Smooth count-up animation
    if (awardedCoins > 0) {
      let current = 0;
      const stepTime = Math.max(50, Math.floor(1200 / awardedCoins));
      const interval = setInterval(() => {
        current += 1;
        setDisplayCount(current);
        if (current >= awardedCoins) {
          clearInterval(interval);
        }
      }, stepTime);

      return () => {
        clearTimeout(scaleTimer);
        clearInterval(interval);
      };
    } else {
      setDisplayCount(0);
      return () => clearTimeout(scaleTimer);
    }
  }, [awardedCoins]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
        background: 'radial-gradient(circle, rgba(255, 230, 0, 0.12) 0%, rgba(7, 10, 19, 0.6) 70%)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 230, 0, 0.4)',
        boxShadow: '0 0 35px rgba(255, 230, 0, 0.25)',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '480px',
      }}
    >
      {/* Background ambient glow pulse */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 230, 0, 0.3) 0%, transparent 70%)',
          filter: 'blur(25px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          color: 'var(--neon-yellow)',
          fontFamily: 'var(--font-gaming)',
          fontSize: '0.85rem',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}
      >
        <Sparkles size={16} />
        BATTLE VICTORY REWARD
      </div>

      {/* Main Spinning & Glowing Animated Coin Icon */}
      <div
        style={{
          transform: isScaled ? 'scale(1)' : 'scale(0.3)',
          opacity: isScaled ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ffe600, #ffaa00)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(255, 230, 0, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.6)',
          border: '3px solid #ffffff',
          marginBottom: '14px',
        }}
      >
        <Coins size={44} color="#070a13" strokeWidth={2.2} />
      </div>

      {/* Animated Coin Counter */}
      <div
        style={{
          fontFamily: 'var(--font-gaming)',
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          fontWeight: 900,
          color: 'var(--neon-yellow)',
          textShadow: '0 0 20px rgba(255, 230, 0, 0.8)',
          letterSpacing: '2px',
          marginBottom: '4px',
        }}
      >
        +{displayCount} COINS
      </div>

      <p
        style={{
          fontFamily: 'var(--font-sub)',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          letterSpacing: '1px',
          marginBottom: breakdown ? '16px' : '0',
        }}
      >
        Awarded based on motion accuracy and athletic performance
      </p>

      {/* Calculation Performance Breakdown Badges */}
      {breakdown && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '8px',
            width: '100%',
            marginTop: '8px',
            borderTop: '1px solid rgba(255, 230, 0, 0.2)',
            paddingTop: '12px',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 230, 0, 0.15)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BASE</span>
            <div style={{ fontFamily: 'var(--font-gaming)', color: 'var(--neon-yellow)', fontSize: '0.9rem' }}>
              +{breakdown.baseCompletion}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 230, 0, 0.15)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ACCURACY</span>
            <div style={{ fontFamily: 'var(--font-gaming)', color: 'var(--neon-green)', fontSize: '0.9rem' }}>
              +{breakdown.accuracyBonus}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 230, 0, 0.15)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SCORE</span>
            <div style={{ fontFamily: 'var(--font-gaming)', color: 'var(--neon-cyan)', fontSize: '0.9rem' }}>
              +{breakdown.performanceBonus}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 230, 0, 0.15)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>COMBO</span>
            <div style={{ fontFamily: 'var(--font-gaming)', color: 'var(--neon-magenta)', fontSize: '0.9rem' }}>
              +{breakdown.comboBonus}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
