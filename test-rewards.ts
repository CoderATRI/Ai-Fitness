import { calculateVictoryCoins, getTodayDate, getYesterdayDate, daysBetweenDates, generateMockCouponCode } from './src/utils/rewardsUtils';
import { REWARDS_CATALOG } from './src/data/rewards';

function runTests() {
  console.log('--- STARTING REWARDS SYSTEM TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Victory Coin Calculation Tests
  console.log('\nTesting Coin Calculation Logic...');
  const perfectPerf = {
    accuracy: 95,
    performanceScore: 92,
    highestCombo: 10,
    roundsCount: 5,
    isVictory: true,
  };
  const perfectResult = calculateVictoryCoins(perfectPerf);
  assert(perfectResult.totalCoins === 10, `Perfect performance gives exactly 10 coins (got ${perfectResult.totalCoins})`);
  assert(perfectResult.breakdown.baseCompletion === 2, `Base victory bonus is 2 (got ${perfectResult.breakdown.baseCompletion})`);
  assert(perfectResult.breakdown.accuracyBonus === 3, `Accuracy bonus is 3 (got ${perfectResult.breakdown.accuracyBonus})`);
  assert(perfectResult.breakdown.performanceBonus === 3, `Performance bonus is 3 (got ${perfectResult.breakdown.performanceBonus})`);
  assert(perfectResult.breakdown.comboBonus === 2, `Combo bonus is 2 (got ${perfectResult.breakdown.comboBonus})`);

  const poorPerf = {
    accuracy: 45,
    performanceScore: 40,
    highestCombo: 1,
    roundsCount: 2,
    isVictory: false,
  };
  const poorResult = calculateVictoryCoins(poorPerf);
  assert(poorResult.totalCoins === 1, `Poor defeat performance gives 1 base coin (got ${poorResult.totalCoins})`);
  assert(poorResult.totalCoins <= 10 && poorResult.totalCoins >= 0, `Coins clamped between 0 and 10`);

  const averagePerf = {
    accuracy: 80, // +2
    performanceScore: 72, // +2
    highestCombo: 5, // +1
    roundsCount: 3,
    isVictory: true, // +2
  };
  const avgResult = calculateVictoryCoins(averagePerf);
  assert(avgResult.totalCoins === 7, `Average performance gives 7 coins (got ${avgResult.totalCoins})`);

  // Max clamp check
  const extremePerf = {
    accuracy: 200,
    performanceScore: 200,
    highestCombo: 50,
    roundsCount: 10,
    isVictory: true,
  };
  const extremeResult = calculateVictoryCoins(extremePerf);
  assert(extremeResult.totalCoins === 10, `Extreme score does not exceed 10 coins (got ${extremeResult.totalCoins})`);

  // 2. Date and Streak Utilities
  console.log('\nTesting Date & Streak Logic...');
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  assert(typeof today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(today), `getTodayDate returns YYYY-MM-DD format (${today})`);
  assert(typeof yesterday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(yesterday), `getYesterdayDate returns YYYY-MM-DD format (${yesterday})`);
  assert(daysBetweenDates(yesterday, today) === 1, `Days between yesterday and today is exactly 1`);
  assert(daysBetweenDates(today, today) === 0, `Days between today and today is 0 (same day workout)`);
  assert(daysBetweenDates('2026-09-10', '2026-09-13') === 3, `Days between missed dates is 3`);

  // 3. Mock Coupon Generation
  console.log('\nTesting Mock Coupon Generator...');
  const code1 = generateMockCouponCode('MuscleBlaze', 20);
  assert(code1.startsWith('MUSC20-'), `MuscleBlaze 20% coupon code format valid (${code1})`);
  const code2 = generateMockCouponCode('Nutrela', 15);
  assert(code2.startsWith('NUTR15-'), `Nutrela 15% coupon code format valid (${code2})`);
  const code3 = generateMockCouponCode('CyberFit');
  assert(code3.startsWith('CYBE-'), `Product voucher code format valid (${code3})`);

  // 4. Catalog Verification
  console.log('\nTesting Rewards Catalog...');
  assert(REWARDS_CATALOG.length >= 8, `Catalog has at least 8 items (found ${REWARDS_CATALOG.length})`);
  const mbProtein = REWARDS_CATALOG.find((r) => r.id === 'mb-biozyme-protein');
  assert(Boolean(mbProtein && mbProtein.coinPrice === 80), `MuscleBlaze protein exists at 80 coins`);
  const mbCoupon20 = REWARDS_CATALOG.find((r) => r.id === 'mb-coupon-20');
  assert(Boolean(mbCoupon20 && mbCoupon20.coinPrice === 50), `MuscleBlaze 20% coupon exists at 50 coins`);

  console.log(`\n--- TEST RESULTS: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
