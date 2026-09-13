import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, ShoppingBag, Check, Copy, AlertCircle, Sparkles } from 'lucide-react';
import { RewardProduct } from '../types/rewards';
import { useRewards } from '../context/RewardsContext';
import { CoinDisplay } from './CoinDisplay';

interface CheckoutModalProps {
  reward: RewardProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onViewInventory?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  reward,
  isOpen,
  onClose,
  onViewInventory,
}) => {
  const { coinBalance, purchaseReward } = useRewards();
  const [purchasedCode, setPurchasedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !reward) return null;

  const canAfford = coinBalance >= reward.coinPrice;
  const balanceAfter = coinBalance - reward.coinPrice;

  const handleConfirmPurchase = () => {
    setError(null);
    const result = purchaseReward(reward);
    if (result.success && result.code) {
      setPurchasedCode(result.code);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#ffe600', '#ff007f'],
      });
    } else {
      setError(result.error || 'Failed to complete transaction.');
    }
  };

  const handleCopyCode = async () => {
    if (purchasedCode) {
      try {
        await navigator.clipboard.writeText(purchasedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (e) {
        console.error('Failed to copy', e);
      }
    }
  };

  const handleClose = () => {
    setPurchasedCode(null);
    setCopied(false);
    setError(null);
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
          maxWidth: '520px',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={22} color="var(--neon-cyan)" />
            <h3 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.25rem', color: '#fff' }}>
              {purchasedCode ? 'REWARD UNLOCKED!' : 'CONFIRM REDEMPTION'}
            </h3>
          </div>

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

        {purchasedCode ? (
          /* Post-Purchase Success Screen */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', textAlign: 'center' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(0, 255, 136, 0.15)',
                border: '2px solid var(--neon-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(0, 255, 136, 0.4)',
              }}
            >
              <Check size={38} color="var(--neon-green)" />
            </div>

            <div>
              <h4 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.2rem', color: '#fff', marginBottom: '6px' }}>
                {reward.name}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Purchased from <strong style={{ color: 'var(--neon-cyan)' }}>{reward.brand}</strong>
              </p>
            </div>

            {/* Reward Mock Code Box */}
            <div
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px dashed var(--neon-cyan)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                YOUR DEMO REDEMPTION CODE:
              </span>
              <div
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: '1.4rem',
                  letterSpacing: '3px',
                  color: 'var(--neon-yellow)',
                }}
              >
                {purchasedCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="cyber-button cyber-button-sm"
                style={{
                  alignSelf: 'center',
                  marginTop: '6px',
                  borderColor: copied ? 'var(--neon-green)' : 'var(--neon-cyan)',
                  color: copied ? 'var(--neon-green)' : 'var(--neon-cyan)',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'COPIED TO CLIPBOARD!' : 'COPY CODE'}
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Item added to your virtual inventory. You can view all codes anytime in the "My Rewards" tab.
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button onClick={handleClose} className="cyber-button" style={{ flex: 1 }}>
                CLOSE
              </button>
              {onViewInventory && (
                <button
                  onClick={() => {
                    handleClose();
                    onViewInventory();
                  }}
                  className="cyber-button cyber-button-magenta"
                  style={{ flex: 1 }}
                >
                  VIEW INVENTORY
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Confirmation Flow */
          <>
            {/* Product Summary Card */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '20px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: '0.75rem',
                  color: 'var(--neon-cyan)',
                  letterSpacing: '1px',
                }}
              >
                {reward.brand} &bull; {reward.category}
              </span>
              <h4
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: '1.15rem',
                  color: '#fff',
                  marginTop: '4px',
                  marginBottom: '8px',
                }}
              >
                {reward.name}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                {reward.description}
              </p>
            </div>

            {/* Financial Breakdown */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid rgba(0, 240, 255, 0.15)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reward Cost:</span>
                <CoinDisplay amount={reward.coinPrice} size="sm" />
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
                  Remaining Balance:
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-gaming)',
                    fontSize: '1rem',
                    color: canAfford ? 'var(--neon-green)' : 'var(--neon-red)',
                  }}
                >
                  {canAfford ? `${balanceAfter} COINS` : 'INSUFFICIENT COINS'}
                </span>
              </div>
            </div>

            {error && (
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
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {!canAfford && (
              <div
                style={{
                  color: 'var(--neon-red)',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-sub)',
                  textAlign: 'center',
                }}
              >
                You need {reward.coinPrice - coinBalance} more coins. Complete battles to earn coins!
              </div>
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
                onClick={handleConfirmPurchase}
                disabled={!canAfford}
                className="cyber-button cyber-button-magenta"
                style={{ flex: 1.4 }}
              >
                CONFIRM PURCHASE
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
