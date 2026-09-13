import React from 'react';
import { Coins } from 'lucide-react';

interface CoinDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const CoinDisplay: React.FC<CoinDisplayProps> = ({
  amount,
  size = 'md',
  showLabel = true,
  animated = false,
  className = '',
  onClick,
  title,
}) => {
  const sizeStyles = {
    sm: {
      fontSize: '0.85rem',
      iconSize: 14,
      gap: '5px',
      padding: '3px 8px',
    },
    md: {
      fontSize: '1rem',
      iconSize: 18,
      gap: '7px',
      padding: '5px 12px',
    },
    lg: {
      fontSize: '1.4rem',
      iconSize: 24,
      gap: '9px',
      padding: '8px 18px',
    },
  }[size];

  return (
    <div
      onClick={onClick}
      title={title || `${amount.toLocaleString()} Virtual Coins`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeStyles.gap,
        background: 'rgba(255, 230, 0, 0.08)',
        border: '1px solid rgba(255, 230, 0, 0.35)',
        borderRadius: '20px',
        padding: sizeStyles.padding,
        color: 'var(--neon-yellow)',
        fontFamily: 'var(--font-gaming)',
        fontWeight: 700,
        letterSpacing: '1px',
        boxShadow: '0 0 12px rgba(255, 230, 0, 0.15)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        userSelect: 'none',
      }}
      className={`coin-display ${animated ? 'animate-pulse' : ''} ${className}`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--neon-yellow)',
          filter: 'drop-shadow(0 0 6px rgba(255, 230, 0, 0.6))',
        }}
      >
        <Coins size={sizeStyles.iconSize} />
      </div>
      <span style={{ fontSize: sizeStyles.fontSize }}>{amount.toLocaleString()}</span>
      {showLabel && (
        <span
          style={{
            fontSize: `calc(${sizeStyles.fontSize} * 0.75)`,
            color: 'rgba(255, 230, 0, 0.8)',
            fontFamily: 'var(--font-sub)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          {amount === 1 ? 'COIN' : 'COINS'}
        </span>
      )}
    </div>
  );
};
