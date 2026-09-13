import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, ShoppingBag, Package, Sparkles, Filter, Gift } from 'lucide-react';
import { REWARDS_CATALOG } from '../data/rewards';
import { RewardProduct } from '../types/rewards';
import { useRewards } from '../context/RewardsContext';
import { CoinDisplay } from './CoinDisplay';
import { RewardCard } from './RewardCard';
import { CheckoutModal } from './CheckoutModal';
import { InventoryPanel } from './InventoryPanel';

interface RewardsStoreProps {
  onBack: () => void;
  onStartBattle?: () => void;
}

type TabType = 'ALL' | 'NUTRITION' | 'FITNESS GEAR' | 'COUPONS' | 'MERCHANDISE' | 'INVENTORY';

export const RewardsStore: React.FC<RewardsStoreProps> = ({ onBack, onStartBattle }) => {
  const { coinBalance, inventory, hasPurchasedReward } = useRewards();
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReward, setSelectedReward] = useState<RewardProduct | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'ALL', label: 'ALL REWARDS' },
    { key: 'COUPONS', label: 'COUPONS & DEALS' },
    { key: 'NUTRITION', label: 'NUTRITION & WHEY' },
    { key: 'FITNESS GEAR', label: 'FITNESS GEAR' },
    { key: 'MERCHANDISE', label: 'MERCHANDISE' },
    { key: 'INVENTORY', label: 'MY REWARDS', count: inventory.length },
  ];

  // Filter products by active tab and search query
  const filteredProducts = useMemo(() => {
    return REWARDS_CATALOG.filter((item) => {
      // Tab matching
      if (activeTab === 'COUPONS' && item.category !== 'Coupons') return false;
      if (activeTab === 'NUTRITION' && item.category !== 'Nutrition') return false;
      if (activeTab === 'FITNESS GEAR' && item.category !== 'Fitness Gear') return false;
      if (activeTab === 'MERCHANDISE' && item.category !== 'Merchandise') return false;

      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        return matchName || matchBrand || matchDesc || matchCat;
      }

      return true;
    });
  }, [activeTab, searchQuery]);

  const handleSelectBuy = (reward: RewardProduct) => {
    setSelectedReward(reward);
    setIsCheckoutOpen(true);
  };

  return (
    <div
      style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '36px 24px',
        width: '100%',
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}
    >
      {/* Top Header Navigation & Balances */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <button
          onClick={onBack}
          className="cyber-button cyber-button-sm"
          style={{ padding: '8px 16px', gap: '8px' }}
        >
          <ArrowLeft size={16} />
          BACK TO HUB
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <CoinDisplay amount={coinBalance} size="lg" />
          {onStartBattle && (
            <button
              onClick={onStartBattle}
              className="cyber-button cyber-button-magenta cyber-button-sm"
              style={{ padding: '8px 18px' }}
            >
              EARN MORE COINS
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner for Rewards Store */}
      <div
        className="cyber-panel"
        style={{
          padding: '36px 28px',
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(255, 0, 127, 0.08) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '16px',
              background: 'rgba(255, 230, 0, 0.1)',
              border: '1px solid rgba(255, 230, 0, 0.35)',
              marginBottom: '12px',
            }}
          >
            <Sparkles size={14} color="var(--neon-yellow)" />
            <span
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '0.75rem',
                color: 'var(--neon-yellow)',
                letterSpacing: '1px',
              }}
            >
              EARN. BATTLE. REDEEM.
            </span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-gaming)',
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 900,
              letterSpacing: '2px',
              marginBottom: '8px',
            }}
          >
            REWARDS STORE
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '560px', lineHeight: 1.5 }}>
            Turn your motion combat victories into authentic fitness supplements, resistance bands, shaker bottles,
            and exclusive brand vouchers from MuscleBlaze and Nutrela.
          </p>
        </div>

        {/* Quick Stat Pill */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            borderRadius: '12px',
            padding: '16px 24px',
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CATALOG ITEMS</div>
            <div style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.4rem', color: 'var(--neon-cyan)' }}>
              {REWARDS_CATALOG.length}
            </div>
          </div>
          <div style={{ width: '1px', height: '36px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ITEMS OWNED</div>
            <div style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.4rem', color: 'var(--neon-green)' }}>
              {inventory.length}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="cyber-button cyber-button-sm"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, var(--neon-cyan), #0099ff)'
                    : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isActive ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.12)',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 0 15px rgba(0, 240, 255, 0.4)' : 'none',
                  textShadow: 'none',
                  gap: '6px',
                }}
              >
                {tab.key === 'INVENTORY' && <Gift size={14} />}
                {tab.label}
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    style={{
                      background: isActive ? '#000' : 'var(--neon-green)',
                      color: isActive ? '#fff' : '#000',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      borderRadius: '10px',
                      padding: '1px 6px',
                      marginLeft: '4px',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Filter (when not in inventory tab) */}
        {activeTab !== 'INVENTORY' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '6px',
              padding: '6px 12px',
              gap: '8px',
              width: '260px',
            }}
          >
            <Search size={16} color="var(--neon-cyan)" />
            <input
              type="text"
              placeholder="Search rewards or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                width: '100%',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
        )}
      </div>

      {/* Main Content: Products Grid OR Inventory Panel */}
      {activeTab === 'INVENTORY' ? (
        <InventoryPanel onGoToStore={() => setActiveTab('ALL')} />
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <div
              className="cyber-panel"
              style={{
                padding: '48px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Package size={42} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <h4 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.2rem', color: '#fff', marginBottom: '8px' }}>
                NO REWARDS FOUND
              </h4>
              <p style={{ fontSize: '0.9rem' }}>
                Try adjusting your search criteria or switch category tabs.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {filteredProducts.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  isOwned={hasPurchasedReward(reward.id)}
                  onSelectBuy={handleSelectBuy}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        reward={selectedReward}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onViewInventory={() => setActiveTab('INVENTORY')}
      />
    </div>
  );
};
