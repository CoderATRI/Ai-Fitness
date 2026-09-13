import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  RewardInventoryItem,
  RewardProduct,
  RewardState,
  CoinRewardBreakdown,
  VictoryPerformanceData,
  StreakStatus,
  StreakInfo,
} from '../types/rewards';
import {
  getTodayDate,
  getYesterdayDate,
  daysBetweenDates,
  calculateVictoryCoins,
  generateMockCouponCode,
} from '../utils/rewardsUtils';

const STORAGE_KEY = 'aiFitnessBattle_rewards';
const STREAK_RESTORE_COST = 50;

export interface RewardsContextType {
  coinBalance: number;
  currentStreak: number;
  lastWorkoutDate: string | null;
  inventory: RewardInventoryItem[];
  isStreakBroken: boolean;
  previousStreak: number;
  streakInfo: StreakInfo;
  addCoins: (amount: number, reason?: string) => void;
  spendCoins: (amount: number) => boolean;
  recordWorkout: () => { streakIncreased: boolean; currentStreak: number; isFirstWorkout: boolean };
  restoreStreak: () => { success: boolean; error?: string };
  purchaseReward: (reward: RewardProduct) => { success: boolean; code?: string; error?: string };
  hasPurchasedReward: (rewardId: string) => boolean;
  getStreakStatus: () => StreakStatus;
  awardBattleVictory: (
    battleId: string,
    performance: VictoryPerformanceData
  ) => { coinsAwarded: number; breakdown: CoinRewardBreakdown } | null;
  isBattleRewarded: (battleId: string) => boolean;
}

const defaultState: RewardState = {
  coinBalance: 0,
  currentStreak: 0,
  lastWorkoutDate: null,
  inventory: [],
  rewardedBattleIds: [],
  lastRewardedBattleId: null,
  previousStreakBeforeBreak: 0,
  isStreakBroken: false,
};

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

export const RewardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state safely from localStorage
  const [state, setState] = useState<RewardState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          coinBalance: typeof parsed.coinBalance === 'number' && parsed.coinBalance >= 0 ? parsed.coinBalance : 0,
          currentStreak: typeof parsed.currentStreak === 'number' && parsed.currentStreak >= 0 ? parsed.currentStreak : 0,
          lastWorkoutDate: typeof parsed.lastWorkoutDate === 'string' ? parsed.lastWorkoutDate : null,
          inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
          rewardedBattleIds: Array.isArray(parsed.rewardedBattleIds) ? parsed.rewardedBattleIds : [],
          lastRewardedBattleId: parsed.lastRewardedBattleId || null,
          previousStreakBeforeBreak:
            typeof parsed.previousStreakBeforeBreak === 'number' ? parsed.previousStreakBeforeBreak : 0,
          isStreakBroken: Boolean(parsed.isStreakBroken),
        };
      }
    } catch (e) {
      console.warn('Failed to parse rewards state from localStorage. Using defaults.', e);
    }
    return defaultState;
  });

  // Check and update broken streak state based on today's calendar date
  useEffect(() => {
    const today = getTodayDate();
    if (state.lastWorkoutDate && state.currentStreak > 0) {
      const diff = daysBetweenDates(state.lastWorkoutDate, today);
      if (diff > 1 && !state.isStreakBroken) {
        // Missed at least 1 calendar day without workout
        setState((prev) => ({
          ...prev,
          isStreakBroken: true,
          previousStreakBeforeBreak: prev.currentStreak,
          currentStreak: 0,
        }));
      }
    }
  }, [state.lastWorkoutDate, state.currentStreak, state.isStreakBroken]);

  // Persist state to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist rewards state to localStorage', e);
    }
  }, [state]);

  // Add coins safely (never negative)
  const addCoins = useCallback((amount: number, reason?: string) => {
    if (amount <= 0) return;
    setState((prev) => ({
      ...prev,
      coinBalance: prev.coinBalance + amount,
    }));
  }, []);

  // Spend coins safely
  const spendCoins = useCallback((amount: number): boolean => {
    if (amount <= 0) return false;
    let success = false;
    setState((prev) => {
      if (prev.coinBalance >= amount) {
        success = true;
        return {
          ...prev,
          coinBalance: prev.coinBalance - amount,
        };
      }
      return prev;
    });
    return success;
  }, []);

  // Record a completed workout
  const recordWorkout = useCallback((): {
    streakIncreased: boolean;
    currentStreak: number;
    isFirstWorkout: boolean;
  } => {
    const today = getTodayDate();
    let result = { streakIncreased: false, currentStreak: state.currentStreak, isFirstWorkout: false };

    setState((prev) => {
      // 1. First-ever workout
      if (!prev.lastWorkoutDate) {
        result = { streakIncreased: true, currentStreak: 1, isFirstWorkout: true };
        return {
          ...prev,
          currentStreak: 1,
          lastWorkoutDate: today,
          isStreakBroken: false,
          previousStreakBeforeBreak: 0,
        };
      }

      // 2. Same-day workout
      if (prev.lastWorkoutDate === today) {
        result = { streakIncreased: false, currentStreak: prev.currentStreak, isFirstWorkout: false };
        return prev;
      }

      const diff = daysBetweenDates(prev.lastWorkoutDate, today);

      // 3. Consecutive day workout
      if (diff === 1) {
        const nextStreak = prev.currentStreak + 1;
        result = { streakIncreased: true, currentStreak: nextStreak, isFirstWorkout: false };
        return {
          ...prev,
          currentStreak: nextStreak,
          lastWorkoutDate: today,
          isStreakBroken: false,
        };
      }

      // 4. Missed day without restoring
      result = { streakIncreased: true, currentStreak: 1, isFirstWorkout: false };
      return {
        ...prev,
        previousStreakBeforeBreak: prev.currentStreak > 0 ? prev.currentStreak : prev.previousStreakBeforeBreak,
        currentStreak: 1,
        lastWorkoutDate: today,
        isStreakBroken: false,
      };
    });

    return result;
  }, [state.currentStreak]);

  // Restore a broken streak for 50 coins
  const restoreStreak = useCallback((): { success: boolean; error?: string } => {
    let result: { success: boolean; error?: string } = { success: false };

    setState((prev) => {
      if (prev.coinBalance < STREAK_RESTORE_COST) {
        result = {
          success: false,
          error: `You need ${STREAK_RESTORE_COST} coins to restore your streak. Current balance: ${prev.coinBalance}`,
        };
        return prev;
      }

      const restoredStreak = prev.previousStreakBeforeBreak > 0 ? prev.previousStreakBeforeBreak : 1;
      const yesterday = getYesterdayDate();

      result = { success: true };
      return {
        ...prev,
        coinBalance: prev.coinBalance - STREAK_RESTORE_COST,
        currentStreak: restoredStreak,
        isStreakBroken: false,
        lastWorkoutDate: yesterday, // Sets to yesterday so today's workout can extend it or be completed today
      };
    });

    return result;
  }, []);

  // Purchase reward from store
  const purchaseReward = useCallback(
    (reward: RewardProduct): { success: boolean; code?: string; error?: string } => {
      let result: { success: boolean; code?: string; error?: string } = { success: false };

      setState((prev) => {
        // Validate coins
        if (prev.coinBalance < reward.coinPrice) {
          result = { success: false, error: 'NOT ENOUGH COINS' };
          return prev;
        }

        // Validate max purchases
        const alreadyPurchased = prev.inventory.some((item) => item.rewardId === reward.id);
        if (reward.maxPurchases && reward.maxPurchases === 1 && alreadyPurchased) {
          result = { success: false, error: 'You already own this reward.' };
          return prev;
        }

        const generatedCode = generateMockCouponCode(reward.brand, reward.discountPercentage);
        const newItem: RewardInventoryItem = {
          id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          rewardId: reward.id,
          name: reward.name,
          brand: reward.brand,
          code: generatedCode,
          purchasedAt: new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          type: reward.type,
          discountPercentage: reward.discountPercentage,
          originalValue: reward.originalValue,
        };

        result = { success: true, code: generatedCode };

        return {
          ...prev,
          coinBalance: prev.coinBalance - reward.coinPrice,
          inventory: [newItem, ...prev.inventory],
        };
      });

      return result;
    },
    []
  );

  const hasPurchasedReward = useCallback(
    (rewardId: string): boolean => {
      return state.inventory.some((item) => item.rewardId === rewardId);
    },
    [state.inventory]
  );

  const isBattleRewarded = useCallback(
    (battleId: string): boolean => {
      return state.rewardedBattleIds.includes(battleId);
    },
    [state.rewardedBattleIds]
  );

  // Idempotent victory reward handler
  const awardBattleVictory = useCallback(
    (
      battleId: string,
      performance: VictoryPerformanceData
    ): { coinsAwarded: number; breakdown: CoinRewardBreakdown } | null => {
      if (!battleId) return null;

      // Check if already awarded
      if (state.rewardedBattleIds.includes(battleId)) {
        return null;
      }

      const { totalCoins, breakdown } = calculateVictoryCoins(performance);
      const today = getTodayDate();

      setState((prev) => {
        if (prev.rewardedBattleIds.includes(battleId)) {
          return prev;
        }

        // Update streak alongside victory
        let newStreak = prev.currentStreak;
        let isFirst = false;
        let newBroken = prev.isStreakBroken;

        if (!prev.lastWorkoutDate) {
          newStreak = 1;
          isFirst = true;
          newBroken = false;
        } else if (prev.lastWorkoutDate !== today) {
          const diff = daysBetweenDates(prev.lastWorkoutDate, today);
          if (diff === 1) {
            newStreak = prev.currentStreak + 1;
            newBroken = false;
          } else if (diff > 1) {
            // New streak starts
            newStreak = 1;
            newBroken = false;
          }
        }

        return {
          ...prev,
          coinBalance: prev.coinBalance + totalCoins,
          currentStreak: newStreak,
          lastWorkoutDate: today,
          isStreakBroken: newBroken,
          lastRewardedBattleId: battleId,
          rewardedBattleIds: [battleId, ...prev.rewardedBattleIds.slice(0, 99)],
        };
      });

      return { coinsAwarded: totalCoins, breakdown };
    },
    [state.rewardedBattleIds]
  );

  const getStreakStatus = useCallback((): StreakStatus => {
    if (state.isStreakBroken) return 'broken';
    if (!state.lastWorkoutDate) return 'none';
    const today = getTodayDate();
    if (state.lastWorkoutDate === today) return 'completed_today';
    const diff = daysBetweenDates(state.lastWorkoutDate, today);
    if (diff === 1) return 'active';
    return 'broken';
  }, [state.isStreakBroken, state.lastWorkoutDate]);

  const streakInfo: StreakInfo = useMemo(() => {
    return {
      status: getStreakStatus(),
      currentStreak: state.currentStreak,
      lastWorkoutDate: state.lastWorkoutDate,
      isStreakBroken: state.isStreakBroken,
      previousStreak: state.previousStreakBeforeBreak,
      canRestore: state.isStreakBroken && state.coinBalance >= STREAK_RESTORE_COST,
      restoreCost: STREAK_RESTORE_COST,
    };
  }, [getStreakStatus, state.currentStreak, state.lastWorkoutDate, state.isStreakBroken, state.previousStreakBeforeBreak, state.coinBalance]);

  const value: RewardsContextType = {
    coinBalance: state.coinBalance,
    currentStreak: state.currentStreak,
    lastWorkoutDate: state.lastWorkoutDate,
    inventory: state.inventory,
    isStreakBroken: state.isStreakBroken,
    previousStreak: state.previousStreakBeforeBreak,
    streakInfo,
    addCoins,
    spendCoins,
    recordWorkout,
    restoreStreak,
    purchaseReward,
    hasPurchasedReward,
    getStreakStatus,
    awardBattleVictory,
    isBattleRewarded,
  };

  return <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>;
};

export const useRewards = (): RewardsContextType => {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
};
