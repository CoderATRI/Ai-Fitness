import React, { useState } from 'react';
import { Package, Copy, Check, Ticket, Calendar, ExternalLink, ShieldCheck } from 'lucide-react';
import { useRewards } from '../context/RewardsContext';

interface InventoryPanelProps {
  onGoToStore?: () => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ onGoToStore }) => {
  const { inventory } = useRewards();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      console.error('Failed to copy code to clipboard', e);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Notice Banner */}
      <div
        style={{
          background: 'rgba(0, 240, 255, 0.06)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <ShieldCheck size={20} color="var(--neon-cyan)" />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          HACKATHON DEMO REWARDS &bull; All coupon codes and product vouchers are simulated virtual assets
          earned via athletic body tracking.
        </span>
      </div>

      {inventory.length === 0 ? (
        <div
          className="cyber-panel"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Package size={32} />
          </div>

          <h4 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.2rem', color: '#fff' }}>
            YOUR INVENTORY IS EMPTY
          </h4>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', lineHeight: 1.5 }}>
            Complete kinetic battles in the arena, earn victory coins, and redeem exclusive supplements and fitness
            vouchers!
          </p>

          {onGoToStore && (
            <button onClick={onGoToStore} className="cyber-button" style={{ marginTop: '8px' }}>
              BROWSE REWARDS STORE
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {inventory.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <div
                key={item.id}
                className="cyber-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  borderLeft: '4px solid var(--neon-cyan)',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-gaming)',
                        fontSize: '0.75rem',
                        color: 'var(--neon-cyan)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.brand}
                    </span>

                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Calendar size={12} />
                      {item.purchasedAt}
                    </span>
                  </div>

                  <h4
                    style={{
                      fontFamily: 'var(--font-gaming)',
                      fontSize: '1.05rem',
                      color: '#fff',
                      marginBottom: '6px',
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </h4>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(255, 0, 127, 0.1)',
                      border: '1px solid rgba(255, 0, 127, 0.3)',
                      color: 'var(--neon-magenta)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-sub)',
                      fontWeight: 600,
                    }}
                  >
                    <Ticket size={12} />
                    {item.type === 'coupon'
                      ? `${item.discountPercentage || 15}% OFF COUPON`
                      : 'PRODUCT VOUCHER'}
                  </span>
                </div>

                {/* Code Redemption Box */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px dashed rgba(0, 240, 255, 0.4)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                      CODE
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-gaming)',
                        fontSize: '1.1rem',
                        letterSpacing: '2px',
                        color: 'var(--neon-yellow)',
                      }}
                    >
                      {item.code}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(item.id, item.code)}
                    className="cyber-button cyber-button-sm"
                    style={{
                      padding: '6px 12px',
                      borderColor: isCopied ? 'var(--neon-green)' : 'var(--neon-cyan)',
                      color: isCopied ? 'var(--neon-green)' : 'var(--neon-cyan)',
                    }}
                    title="Copy coupon code"
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    {isCopied ? 'COPIED' : 'COPY'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
