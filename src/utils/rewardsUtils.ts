import { CoinRewardBreakdown, VictoryPerformanceData } from '../types/rewards';

/**
 * Format a Date object to YYYY-MM-DD using local time (not UTC) to avoid timezone discrepancies.
 */
export function formatDateToLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current date in YYYY-MM-DD format (local timezone).
 */
export function getTodayDate(): string {
  return formatDateToLocalString(new Date());
}

/**
 * Get yesterday's date in YYYY-MM-DD format (local timezone).
 */
export function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToLocalString(d);
}

/**
 * Calculate the integer number of calendar days between two YYYY-MM-DD strings.
 * E.g., '2026-09-13' and '2026-09-12' returns 1.
 */
export function daysBetweenDates(fromDate: string, toDate: string): number {
  const [y1, m1, d1] = fromDate.split('-').map(Number);
  const [y2, m2, d2] = toDate.split('-').map(Number);

  // Use UTC to prevent daylight saving time hour shifts
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / MS_PER_DAY);
}

/**
 * Calculate victory coins earned from a battle.
 * Maximum: 10 coins.
 * Formula:
 * - Base completion: +2 (victory) or +1 (defeat attempt)
 * - Accuracy: +0 to +3
 * - Performance score: +0 to +3
 * - Combo: +0 to +2
 * Clamped strictly between 0 and 10 coins.
 */
export function calculateVictoryCoins(performance: VictoryPerformanceData): {
  totalCoins: number;
  breakdown: CoinRewardBreakdown;
} {
  const base = performance.isVictory ? 2 : 1;

  let accBonus = 0;
  if (performance.accuracy >= 90) {
    accBonus = 3;
  } else if (performance.accuracy >= 75) {
    accBonus = 2;
  } else if (performance.accuracy >= 60) {
    accBonus = 1;
  }

  let perfBonus = 0;
  if (performance.performanceScore >= 85) {
    perfBonus = 3;
  } else if (performance.performanceScore >= 70) {
    perfBonus = 2;
  } else if (performance.performanceScore >= 50) {
    perfBonus = 1;
  }

  let comboBonus = 0;
  if (performance.highestCombo >= 8) {
    comboBonus = 2;
  } else if (performance.highestCombo >= 4) {
    comboBonus = 1;
  }

  const rawTotal = base + accBonus + perfBonus + comboBonus;
  const clampedTotal = Math.max(0, Math.min(10, rawTotal));

  return {
    totalCoins: clampedTotal,
    breakdown: {
      baseCompletion: base,
      accuracyBonus: accBonus,
      performanceBonus: perfBonus,
      comboBonus: comboBonus,
      totalCoins: clampedTotal,
    },
  };
}

/**
 * Generate a realistic mock coupon/reward code.
 * E.g., MB20-A7K9X2 or NUTRELA15-F4P8Q
 */
export function generateMockCouponCode(brand: string, discount?: number, prefix?: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomSuffix = '';
  for (let i = 0; i < 6; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  if (prefix) {
    return `${prefix}-${randomSuffix}`;
  }

  const cleanBrand = brand.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const brandCode = cleanBrand.slice(0, 4);

  if (discount && discount > 0) {
    return `${brandCode}${discount}-${randomSuffix}`;
  }

  return `${brandCode}-${randomSuffix}`;
}
