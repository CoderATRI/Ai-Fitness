import React from 'react';
import { Tag, ShoppingCart, Check, Percent, Sparkles } from 'lucide-react';
import { RewardProduct } from '../types/rewards';
import { CoinDisplay } from './CoinDisplay';

interface RewardCardProps {
  reward: RewardProduct;
  isOwned: boolean;
  onSelectBuy: (reward: RewardProduct) => void;
}

export const RewardCard: React.FC<RewardCardProps> = ({ reward, isOwned, onSelectBuy }) => {
  const isCoupon = reward.type === 'coupon';

  return (
    <div
      className="cyber-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '22px',
        position: 'relative',
        borderRadius: '12px',
        borderColor: isOwned ? 'rgba(0, 255, 136, 0.4)' : undefined,
        background: isOwned
          ? 'linear-gradient(180deg, rgba(0, 255, 136, 0.04) 0%, rgba(13, 19, 34, 0.8) 100%)'
          : undefined,
      }}
    >
      {/* Top Badges (Category & Discount) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span
          style={{
            fontFamily: 'var(--font-gaming)',
            fontSize: '0.75rem',
            color: 'var(--neon-cyan)',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Tag size={13} />
          {reward.brand}
        </span>

        {reward.discountPercentage ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '12px',
              background: 'rgba(255, 0, 127, 0.15)',
              border: '1px solid var(--neon-magenta)',
              color: 'var(--neon-magenta)',
              fontFamily: 'var(--font-gaming)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            <Percent size={12} />
            {reward.discountPercentage}% OFF
          </span>
        ) : (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '12px',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: 'var(--neon-cyan)',
              fontFamily: 'var(--font-sub)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
            }}
          >
            {reward.category}
          </span>
        )}
      </div>

      {/* Product Title & Details */}
      <div style={{ marginBottom: '18px' }}>
        <h4
          style={{
            fontFamily: 'var(--font-gaming)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '8px',
            lineHeight: 1.3,
          }}
        >
          {reward.name}
        </h4>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            minHeight: '52px',
          }}
        >
          {reward.description}
        </p>

        {reward.originalValue && (
          <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Est. Real-world value: <span style={{ color: '#fff', fontWeight: 600 }}>{reward.originalValue}</span>
          </div>
        )}
      </div>

      {/* Bottom Bar: Price & Action */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <CoinDisplay amount={reward.coinPrice} size="sm" />

        {isOwned ? (
          <button
            disabled
            className="cyber-button cyber-button-sm"
            style={{
              borderColor: 'var(--neon-green)',
              color: 'var(--neon-green)',
              background: 'rgba(0, 255, 136, 0.12)',
              gap: '6px',
              cursor: 'default',
              opacity: 1,
            }}
          >
            <Check size={14} />
            OWNED
          </button>
        ) : (
          <button
            onClick={() => onSelectBuy(reward)}
            className={`cyber-button cyber-button-sm ${isCoupon ? 'cyber-button-magenta' : ''}`}
            style={{ padding: '8px 16px', gap: '6px' }}
          >
            <ShoppingCart size={14} />
            REDEEM
          </button>
        )}
      </div>
    </div>
  );
};
