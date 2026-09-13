import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Skull, Flame, Target, Zap, Clock, ShieldAlert, Award, RotateCcw, ShoppingBag } from 'lucide-react';
import { RoundHistoryRecord } from '../types';
import { StorageService } from '../data/StorageService';
import { DifficultyManager } from '../ai/DifficultyManager';
import { useRewards } from '../context/RewardsContext';
import { CoinRewardAnimation } from './CoinRewardAnimation';
import { calculateVictoryCoins } from '../utils/rewardsUtils';
import { VictoryPerformanceData } from '../types/rewards';

interface VictoryDefeatScreenProps {
  result: 'VICTORY' | 'DEFEAT';
  rounds: RoundHistoryRecord[];
  battleId?: string;
  onPlayAgain: () => void;
  onOpenCareerStats: () => void;
  onOpenStore?: () => void;
}

export const VictoryDefeatScreen: React.FC<VictoryDefeatScreenProps> = ({
  result,
  rounds,
  battleId,
  onPlayAgain,
  onOpenCareerStats,
  onOpenStore,
}) => {
  const isVictory = result === 'VICTORY';
  const { awardBattleVictory, currentStreak } = useRewards();

  // Compute aggregated stats
  const totalValidReps = rounds.reduce((sum, r) => sum + r.repsCompleted, 0);
  const totalInvalidReps = rounds.reduce((sum, r) => sum + r.invalidReps, 0);
  const totalAttempts = totalValidReps + totalInvalidReps;
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalValidReps / totalAttempts) * 100) : 100;
  const totalDamageDealt = rounds.reduce((sum, r) => sum + r.damageDealt, 0);
  const totalDuration = rounds.reduce((sum, r) => sum + r.durationSeconds, 0);

  // Group reps by exercise
  const repsByExercise: Record<string, number> = {};
  rounds.forEach((r) => {
    repsByExercise[r.exercise] = (repsByExercise[r.exercise] || 0) + r.repsCompleted;
  });

  // Calculate highest score & difficulty
  const maxDifficulty = rounds.length > 0 ? Math.max(...rounds.map((r) => r.round)) : 1;
  const totalScore = totalValidReps * 150 + (isVictory ? 2500 : 500);

  const avgPerfScore =
    rounds.length > 0
      ? Math.round(rounds.reduce((sum, r) => sum + r.performanceScore, 0) / rounds.length)
      : overallAccuracy >= 85
      ? 90
      : 70;
  const highestCombo = rounds.length > 0 ? Math.min(15, rounds.length * 3) : 0;

  const performanceData: VictoryPerformanceData = useMemo(
    () => ({
      accuracy: overallAccuracy,
      performanceScore: avgPerfScore,
      highestCombo,
      roundsCount: rounds.length,
      isVictory,
    }),
    [overallAccuracy, avgPerfScore, highestCombo, rounds.length, isVictory]
  );

  const [rewardDetails, setRewardDetails] = useState(() => calculateVictoryCoins(performanceData));

  // Generate AI Adaptation debriefing narrative
  const aiDebrief = useMemo(() => {
    const trend = DifficultyManager.analyzeTrend(rounds);
    let analysis = '';

    if (isVictory) {
      analysis = `Spectacular athletic performance! You defeated all threats across ${rounds.length} kinetic combat rounds. `;
    } else {
      analysis = `Battle ended prematurely, but your kinetic data was recorded. `;
    }

    if (overallAccuracy >= 85) {
      analysis += `Your biomechanical form was exceptionally clean with ${overallAccuracy}% rep accuracy. `;
    } else {
      analysis += `Accuracy was clocked at ${overallAccuracy}%. Aim for deeper depth on future sets to avoid invalid rep penalties. `;
    }

    const exKeys = Object.keys(repsByExercise);
    if (exKeys.length > 0) {
      const topEx = exKeys.reduce((a, b) => (repsByExercise[a] > repsByExercise[b] ? a : b));
      analysis += `Your strongest output was observed in ${topEx.replace('_', ' ')} (${repsByExercise[topEx]} reps). Future AI training will calibrate progressive resistance.`;
    }

    return analysis;
  }, [rounds, isVictory, overallAccuracy, repsByExercise]);

  // Trigger celebration confetti on victory, save to storage, and award coins idempotently
  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#ff007f', '#ffe600', '#00ff88'],
      });
    }

    const effectiveId = battleId || `battle-${Date.now()}`;

    // Idempotent Coin & Streak Award
    const res = awardBattleVictory(effectiveId, performanceData);
    if (res) {
      setRewardDetails({ totalCoins: res.coinsAwarded, breakdown: res.breakdown });
    } else {
      setRewardDetails(calculateVictoryCoins(performanceData));
    }

    // Save run summary to storage
    StorageService.updateStatsAfterBattle({
      id: effectiveId,
      date: new Date().toLocaleDateString(),
      result,
      monstersDefeated: isVictory ? 5 : Math.max(0, rounds.length - 1),
      totalReps: totalValidReps,
      accuracy: overallAccuracy,
      highestCombo: rounds.length > 0 ? Math.min(15, rounds.length * 3) : 0,
      score: totalScore,
      durationSeconds: totalDuration,
      rounds,
    });
  }, [isVictory, battleId]);

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '36px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '28px',
      }}
    >
      {/* Result Header Banner */}
      <div
        className="cyber-panel"
        style={{
          width: '100%',
          padding: '36px 24px',
          textAlign: 'center',
          borderColor: isVictory ? 'var(--neon-green)' : 'var(--neon-red)',
          boxShadow: isVictory
            ? '0 0 35px rgba(0, 255, 136, 0.25)'
            : '0 0 35px rgba(255, 51, 102, 0.25)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: isVictory ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 51, 102, 0.15)',
            border: `2px solid ${isVictory ? 'var(--neon-green)' : 'var(--neon-red)'}`,
            marginBottom: '16px',
          }}
        >
          {isVictory ? (
            <Trophy size={38} color="var(--neon-green)" />
          ) : (
            <Skull size={38} color="var(--neon-red)" />
          )}
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-gaming)',
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            fontWeight: 900,
            letterSpacing: '3px',
            color: isVictory ? 'var(--neon-green)' : 'var(--neon-red)',
            marginBottom: '8px',
          }}
        >
          {isVictory ? 'VICTORY ACHIEVED!' : 'SYSTEM DEFEAT'}
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          {isVictory
            ? 'All AI threats neutralized! Your biological output exceeded computational models.'
            : 'Integrity critical. Recharge your stamina and strike again!'}
        </p>
      </div>

      {/* Battle Reward & Daily Streak Showcase */}
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          alignItems: 'stretch',
        }}
      >
        {/* Animated Victory Coin Box */}
        <CoinRewardAnimation
          awardedCoins={rewardDetails.totalCoins}
          breakdown={rewardDetails.breakdown}
        />

        {/* Daily Streak Card */}
        <div
          className="cyber-panel"
          style={{
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'center',
            borderColor: 'rgba(255, 0, 127, 0.4)',
            boxShadow: '0 0 25px rgba(255, 0, 127, 0.15)',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '16px',
              background: 'rgba(255, 0, 127, 0.1)',
              border: '1px solid rgba(255, 0, 127, 0.3)',
              color: 'var(--neon-magenta)',
              fontFamily: 'var(--font-gaming)',
              fontSize: '0.75rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            <Flame size={14} fill="currentColor" />
            DAILY WORKOUT STREAK
          </div>

          <div style={{ margin: '14px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255, 0, 127, 0.25), rgba(255, 136, 0, 0.25))',
                border: '2px solid var(--neon-magenta)',
                boxShadow: '0 0 25px rgba(255, 0, 127, 0.5)',
                marginBottom: '10px',
              }}
            >
              <Flame size={40} color="var(--neon-magenta)" fill="currentColor" />
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '2px',
              }}
            >
              {currentStreak} {currentStreak === 1 ? 'DAY STREAK' : 'DAYS STREAK'}
            </h3>

            <p style={{ color: 'var(--neon-green)', fontFamily: 'var(--font-sub)', fontSize: '0.95rem', marginTop: '6px' }}>
              ✓ TODAY'S BATTLE WORKOUT LOGGED
            </p>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '320px', lineHeight: 1.5, marginBottom: '14px' }}>
            Battle every day to build your streak and earn coins for supplements and fitness gear!
          </p>

          {onOpenStore && (
            <button
              onClick={onOpenStore}
              className="cyber-button cyber-button-magenta"
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', gap: '8px' }}
            >
              <ShoppingBag size={18} />
              VISIT REWARDS STORE
            </button>
          )}
        </div>
      </div>

      {/* Top Stat Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          width: '100%',
        }}
      >
        <div className="cyber-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <Target size={24} color="var(--neon-cyan)" style={{ marginBottom: '8px' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL VALID REPS</span>
          <h3 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.8rem', color: 'var(--neon-cyan)' }}>
            {totalValidReps}
          </h3>
        </div>

        <div className="cyber-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <Award size={24} color="var(--neon-green)" style={{ marginBottom: '8px' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>REP ACCURACY</span>
          <h3 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.8rem', color: 'var(--neon-green)' }}>
            {overallAccuracy}%
          </h3>
        </div>

        <div className="cyber-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <Zap size={24} color="var(--neon-yellow)" style={{ marginBottom: '8px' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL SCORE</span>
          <h3 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.8rem', color: 'var(--neon-yellow)' }}>
            {totalScore.toLocaleString()}
          </h3>
        </div>

        <div className="cyber-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <Clock size={24} color="var(--neon-magenta)" style={{ marginBottom: '8px' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ACTIVE WORKOUT</span>
          <h3 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.8rem', color: 'var(--neon-magenta)' }}>
            {Math.floor(totalDuration / 60)}m {totalDuration % 60}s
          </h3>
        </div>
      </div>

      {/* Exercise Breakdown & AI Analysis Card */}
      <div
        className="cyber-panel"
        style={{
          width: '100%',
          padding: '28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Exercise Reps Breakdown */}
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-gaming)',
              fontSize: '1.1rem',
              color: 'var(--neon-cyan)',
              marginBottom: '16px',
            }}
          >
            EXERCISE BREAKDOWN
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(repsByExercise).length > 0 ? (
              Object.entries(repsByExercise).map(([exercise, reps]) => (
                <div
                  key={exercise}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(0, 240, 255, 0.15)',
                  }}
                >
                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                    {exercise.replace('_', ' ')}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-gaming)',
                      color: 'var(--neon-cyan)',
                      fontSize: '1.1rem',
                    }}
                  >
                    {reps} REPS
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No completed exercises recorded.</p>
            )}
          </div>
        </div>

        {/* AI Performance Adaptation Debrief */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 0, 127, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <Zap size={18} color="var(--neon-magenta)" />
              <h4
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: '0.95rem',
                  color: 'var(--neon-magenta)',
                }}
              >
                AI COACH DEBRIEFING & ADAPTATION
              </h4>
            </div>

            <p
              style={{
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              "{aiDebrief}"
            </p>
          </div>

          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            Adaptive difficulty engine automatically adjusted rep volume and time allocations based on your live joint angle depth and cadence.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={onPlayAgain}
          className="cyber-button"
          style={{ padding: '16px 36px', fontSize: '1.05rem' }}
        >
          <RotateCcw size={20} />
          NEW WORKOUT BATTLE
        </button>

        {onOpenStore && (
          <button
            onClick={onOpenStore}
            className="cyber-button"
            style={{
              padding: '16px 28px',
              background: 'linear-gradient(135deg, rgba(255, 230, 0, 0.2), rgba(255, 0, 127, 0.25))',
              borderColor: 'var(--neon-yellow)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(255, 230, 0, 0.3)',
            }}
          >
            <ShoppingBag size={20} color="var(--neon-yellow)" />
            REWARDS STORE
          </button>
        )}

        <button
          onClick={onOpenCareerStats}
          className="cyber-button cyber-button-magenta"
          style={{ padding: '16px 28px' }}
        >
          VIEW CAREER STATS
        </button>
      </div>
    </div>
  );
};
