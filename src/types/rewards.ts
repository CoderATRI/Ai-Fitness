export type RewardType = 'coupon' | 'product';

export interface RewardInventoryItem {
  id: string;
  rewardId: string;
  name: string;
  brand: string;
  code: string;
  purchasedAt: string;
  type: RewardType;
  discountPercentage?: number;
  originalValue?: string;
}

export interface RewardProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  image?: string;
  coinPrice: number;
  originalValue?: string;
  discountPercentage?: number;
  type: RewardType;
  category: 'Nutrition' | 'Fitness Gear' | 'Coupons' | 'Merchandise' | string;
  available: boolean;
  maxPurchases?: number;
}

export interface RewardState {
  coinBalance: number;
  currentStreak: number;
  lastWorkoutDate: string | null;
  inventory: RewardInventoryItem[];
  rewardedBattleIds: string[];
  lastRewardedBattleId: string | null;
  previousStreakBeforeBreak: number;
  isStreakBroken: boolean;
}

export interface CoinRewardBreakdown {
  baseCompletion: number;
  accuracyBonus: number;
  performanceBonus: number;
  comboBonus: number;
  totalCoins: number;
}

export interface VictoryPerformanceData {
  accuracy: number; // 0 - 100
  performanceScore: number; // 0 - 100
  highestCombo: number;
  roundsCount: number;
  isVictory: boolean;
}

export type StreakStatus = 'active' | 'completed_today' | 'broken' | 'none';

export interface StreakInfo {
  status: StreakStatus;
  currentStreak: number;
  lastWorkoutDate: string | null;
  isStreakBroken: boolean;
  previousStreak: number;
  canRestore: boolean;
  restoreCost: number;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  type: 'earn' | 'spend';
  reason: string;
  timestamp: string;
}
