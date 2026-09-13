import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Flame,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';
import {
  Challenge,
  Landmark,
  Monster,
  PerformanceMetrics,
  PlayerState,
  RoundHistoryRecord,
} from '../types';
import { PoseEstimator } from '../vision/PoseEstimator';
import { PoseOverlayRenderer } from '../vision/PoseOverlay';
import { ExerciseManager, EXERCISE_DEFINITIONS } from '../vision/detectors/ExerciseManager';
import { MonsterManager } from '../game/MonsterManager';
import { MonsterVisual } from './MonsterVisual';
import { DamageSystem } from '../game/DamageSystem';
import { AudioSystem } from '../game/AudioSystem';
import { AIEngine } from '../ai/AIEngine';
import { DifficultyManager } from '../ai/DifficultyManager';
import { AICoachService } from '../ai/AICoach';
import {
  MirrorPhaseController,
  MirrorPhaseOverlay,
  DEFAULT_NEXUS_GAUNTLET,
} from '../mirrorPhase';

import type {
  MirrorRenderState,
  MirrorOutcome,
  PoseScoreResult,
} from '../mirrorPhase';


interface BattleArenaProps {
  onBattleEnd: (result: 'VICTORY' | 'DEFEAT', rounds: RoundHistoryRecord[]) => void;
  isDemoMode: boolean;
  initialMode?: 'standard' | 'mirror_style';
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  onBattleEnd,
  isDemoMode,
  initialMode = 'standard',
}) => {
  const isMirrorStyle = initialMode === 'mirror_style';
  const startMonsterIndex = isMirrorStyle ? 4 : 0;
  const initialMonster = MonsterManager.getMonsterByIndex(startMonsterIndex);

  // Vision refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseEstimatorRef = useRef<PoseEstimator | null>(null);
  const exerciseManagerRef = useRef<ExerciseManager>(new ExerciseManager());

  // Game Progression State
  const [currentMonsterIndex, setCurrentMonsterIndex] = useState<number>(startMonsterIndex);
  const [currentMonster, setCurrentMonster] = useState<Monster>(initialMonster);
  const [round, setRound] = useState<number>(1);
  const [historyRecords, setHistoryRecords] = useState<RoundHistoryRecord[]>([]);

  // Player & Monster Combat State
  const [player, setPlayer] = useState<PlayerState>({
    hp: 100,
    maxHp: 100,
    combo: 0,
    highestCombo: 0,
    score: 0,
    totalDamageDealt: 0,
    isAttacking: false,
    isHit: false,
  });

  const [monsterIsHit, setMonsterIsHit] = useState<boolean>(false);
  const [monsterIsAttacking, setMonsterIsAttacking] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Active Challenge State
  const [challenge, setChallenge] = useState<Challenge>({
    id: 'round-1',
    exercise: 'squats',
    targetReps: isMirrorStyle ? 12 : 8,
    currentReps: 0,
    invalidReps: 0,
    timeLimit: 45,
    timeRemaining: 45,
    difficulty: isMirrorStyle ? 5 : 1,
    damageReward: isMirrorStyle ? 45 : 25,
    reason: isMirrorStyle
      ? 'NEXUS PRIME Synchronization Protocol activated. Prove your biomechanical precision!'
      : 'Initial sparring challenge to calibrate kinetic output.',
    coachNote: isMirrorStyle
      ? 'Mirror NEXUS PRIME poses with precision and lock in your angles!'
      : 'Focus on full squat depth and chest upright!',
  });

  // Real-Time Rep Tracking Metrics
  const [liveFeedback, setLiveFeedback] = useState<string>('Stand ready');
  const [liveStage, setLiveStage] = useState<string>('IDLE');
  const [livePostureScore, setLivePostureScore] = useState<number>(90);
  const [repProgressPercent, setRepProgressPercent] = useState<number>(0);
  const [floatingNotification, setFloatingNotification] = useState<{ text: string; color: string } | null>(null);

  // AI & Coach State
  const [coachSpeech, setCoachSpeech] = useState<string>(
    isMirrorStyle
      ? 'NEXUS PRIME PROTOCOL ENGAGED! Prepare for mirror synchronization!'
      : 'Welcome to the arena! Power your strikes by completing full range reps!'
  );
  const [monsterQuote, setMonsterQuote] = useState<string>(initialMonster.quote);

  const [aiIsThinking, setAiIsThinking] = useState<boolean>(false);

  // Round metrics tracking
  const roundStartTimeRef = useRef<number>(Date.now());
  const repDurationsRef = useRef<number[]>([]);
  const qualityScoresRef = useRef<number[]>([]);
  const battleTimerRef = useRef<any>(null);

  // ── Mirror Phase State ────────────────────────────────────────────────────
  const [mirrorPhaseActive, setMirrorPhaseActive] = useState<boolean>(false);
  const [mirrorRenderState, setMirrorRenderState] = useState<MirrorRenderState>({
    phase: 'IDLE',
    activePose: null,
    poseIndex: 0,
    totalPoses: DEFAULT_NEXUS_GAUNTLET.length,
    countdownSeconds: 2,
    currentScore: 0,
    frameResult: null,
    resolvedOutcome: null,
    resolvedScore: 0,
  });
  const mirrorControllerRef = useRef<MirrorPhaseController | null>(null);
  /** Prevents re-triggering Mirror Phase if already done this fight */
  const mirrorPhaseTriggeredRef = useRef<boolean>(false);
  /** Stores avg score from last Mirror gauntlet for AI payload */
  const mirrorAvgScoreRef = useRef<number>(0);
  const mirrorOutcomeRef = useRef<MirrorOutcome>('failed');
  const mirrorPhaseActiveRef = useRef<boolean>(false);
  const mirrorRenderStateRef = useRef<MirrorRenderState>(mirrorRenderState);

  useEffect(() => {
    mirrorPhaseActiveRef.current = mirrorPhaseActive;
  }, [mirrorPhaseActive]);

  useEffect(() => {
    mirrorRenderStateRef.current = mirrorRenderState;
  }, [mirrorRenderState]);



  // Trigger floating combat banner
  const triggerNotification = (text: string, color: string = 'var(--neon-cyan)') => {
    setFloatingNotification({ text, color });
    setTimeout(() => {
      setFloatingNotification(null);
    }, 1200);
  };

  // Synchronize active exercise detector
  useEffect(() => {
    exerciseManagerRef.current.setExercise(challenge.exercise);
  }, [challenge.exercise]);

  // ── Mirror Phase: launch the gauntlet for NEXUS PRIME ────────────────────
  const startMirrorPhase = useCallback(() => {
    // Stop the normal battle timer while Mirror Phase owns timing
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);

    // Cancel any leftover controller from a previous gauntlet
    mirrorControllerRef.current?.cancel();

    mirrorPhaseTriggeredRef.current = true;
    setMirrorPhaseActive(true);

    AICoachService.speak(
      'NEXUS PRIME initiates synchronization protocol. Mirror the pose shown!',
      true
    );
    AudioSystem.playMirrorTelegraph();
    triggerNotification('⚡ MIRROR PHASE BEGINS!', '#ef4444');

    const controller = new MirrorPhaseController({
      telegraphDurationMs: 3000,
      countdownDurationMs: 2000,
      matchingWindowMs: 3000,
      resolvedPauseDurationMs: 1200,

      onTelegraphStart: (pose, poseIndex, total) => {
        setMirrorRenderState((prev) => ({
          ...prev,
          phase: 'TELEGRAPH',
          activePose: pose,
          poseIndex,
          totalPoses: total,
          currentScore: 0,
          frameResult: null,
          resolvedOutcome: null,
        }));
        AICoachService.speak(`Pose ${poseIndex + 1}: ${pose.displayName}. ${pose.instruction}`, true);
      },

      onCountdownTick: (secondsLeft) => {
        setMirrorRenderState((prev) => ({
          ...prev,
          phase: 'COUNTDOWN',
          countdownSeconds: secondsLeft,
        }));
      },

      onMatchingWindowOpen: (_pose) => {
        setMirrorRenderState((prev) => ({ ...prev, phase: 'ACTIVE_MATCHING' }));
      },

      onFrameScored: (result: PoseScoreResult) => {
        setMirrorRenderState((prev) => ({
          ...prev,
          frameResult: result,
          currentScore: Math.max(prev.currentScore, result.overallScore),
        }));
      },

      onPoseResolved: (pose, bestScore, outcome) => {
        setMirrorRenderState((prev) => ({
          ...prev,
          phase: 'RESOLVED',
          resolvedOutcome: outcome,
          resolvedScore: bestScore,
        }));

        if (outcome === 'perfect') {
          const dmg = Math.round(currentMonster.attackDamage * 1.5);
          AudioSystem.playMirrorPerfect();
          AudioSystem.playPlayerAttack();
          triggerNotification(`PERFECT MIRROR! -${dmg} HP`, 'var(--neon-green)');
          AICoachService.speak('Perfect synchronization! Kinetic strike unleashed!', true);
          setMonsterIsHit(true);
          setTimeout(() => setMonsterIsHit(false), 500);
          setCurrentMonster((prev) => ({ ...prev, hp: Math.max(0, prev.hp - dmg) }));
          setPlayer((prev) => ({ ...prev, combo: prev.combo + 1, score: prev.score + 300 }));
        } else if (outcome === 'partial') {
          const dmg = Math.round(currentMonster.attackDamage * 0.6);
          triggerNotification(`PARTIAL MATCH — ${dmg} DMG`, 'var(--neon-yellow)');
          AICoachService.speak('Partial sync. Keep practicing your form!');
          setCurrentMonster((prev) => ({ ...prev, hp: Math.max(0, prev.hp - dmg) }));
        } else {
          // Failed — monster counter-attacks
          const monsterDmg = DamageSystem.calculateMonsterDamage(
            currentMonster.attackDamage,
            challenge.difficulty
          );
          AudioSystem.playMirrorFailed();
          AudioSystem.playMonsterAttack();
          setScreenShake(true);
          triggerNotification(`MIRROR FAILED! -${monsterDmg} HP`, 'var(--neon-red)');
          AICoachService.speak('Mirror failed. NEXUS PRIME retaliates!', true);
          setTimeout(() => setScreenShake(false), 500);
          setPlayer((prev) => {
            const nextHp = Math.max(0, prev.hp - monsterDmg);
            if (nextHp <= 0) {
              setTimeout(() => {
                mirrorControllerRef.current?.cancel();
                AudioSystem.playDefeat();
                onBattleEnd('DEFEAT', historyRecords);
              }, 800);
            }
            return {
              ...prev,
              hp: nextHp,
              combo: 0,
              isHit: true,
            };
          });
        }
      },

      onSequenceComplete: (avgScore, outcomes) => {
        // Store for AI payload
        mirrorAvgScoreRef.current = avgScore;
        const dominantOutcome = outcomes.filter((o) => o === 'perfect').length >= outcomes.length / 2
          ? 'perfect' : outcomes.filter((o) => o === 'partial').length >= outcomes.length / 2
          ? 'partial' : 'failed';
        mirrorOutcomeRef.current = dominantOutcome as MirrorOutcome;

        setMirrorRenderState((prev) => ({ ...prev, phase: 'COMPLETE' }));
        setMirrorPhaseActive(false);

        const finalMsg =
          avgScore >= 85 ? 'Mirror gauntlet mastered! NEXUS PRIME is destabilized!' :
          avgScore >= 60 ? 'Mirror gauntlet complete. NEXUS PRIME recalibrates...' :
          'Mirror gauntlet failed. NEXUS PRIME grows stronger...';

        AICoachService.speak(finalMsg, true);
        triggerNotification('MIRROR PHASE COMPLETE', 'var(--neon-cyan)');

        // Check if boss was killed during mirror phase
        setCurrentMonster((prevMonster) => {
          if (prevMonster.hp <= 0) {
            handleMonsterDefeated(prevMonster);
          } else {
            // Resume normal battle loop
            setTimeout(() => advanceToNextRound(true), 1500);
          }
          return prevMonster;
        });
      },

      onCancel: () => {
        setMirrorPhaseActive(false);
        setMirrorRenderState((prev) => ({ ...prev, phase: 'CANCELLED' }));
      },
    });

    mirrorControllerRef.current = controller;
    controller.start(DEFAULT_NEXUS_GAUNTLET);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonster, challenge.difficulty]);

  // Auto-launch Mirror Phase when starting in "BATTLE IN STYLE" mode
  useEffect(() => {
    if (isMirrorStyle) {
      const timer = setTimeout(() => {
        startMirrorPhase();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isMirrorStyle, startMirrorPhase]);




  // Round Timer Loop
  useEffect(() => {
    battleTimerRef.current = setInterval(() => {
      setChallenge((prev) => {
        if (prev.timeRemaining <= 1) {
          // Time expired! Monster attacks player
          handleChallengeTimeout();
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => {
      if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    };
  }, [challenge.id]);

  // Handle Timeout / Monster Retaliation
  const handleChallengeTimeout = useCallback(() => {
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);

    // Monster strikes
    const damage = DamageSystem.calculateMonsterDamage(currentMonster.attackDamage, challenge.difficulty);
    setMonsterIsAttacking(true);
    setScreenShake(true);
    AudioSystem.playMonsterAttack();
    triggerNotification(`TIME EXPIRED! MONSTER STRIKES -${damage} HP`, 'var(--neon-red)');

    setTimeout(() => {
      setMonsterIsAttacking(false);
      setScreenShake(false);
    }, 500);

    setPlayer((prev) => {
      const newHp = Math.max(0, prev.hp - damage);
      if (newHp <= 0) {
        // Player Defeated
        setTimeout(() => {
          AudioSystem.playDefeat();
          onBattleEnd('DEFEAT', historyRecords);
        }, 800);
      } else {
        // Transition to next adapted challenge with reduced difficulty
        setTimeout(() => {
          advanceToNextRound(false);
        }, 1200);
      }
      return {
        ...prev,
        hp: newHp,
        combo: 0,
        isHit: true,
      };
    });
  }, [currentMonster, challenge.difficulty, onBattleEnd, historyRecords]);

  // Handle Valid Repetition
  const handleValidRep = useCallback(
    (duration?: number, quality: number = 85) => {
      if (duration) repDurationsRef.current.push(duration);
      qualityScoresRef.current.push(quality);

      setPlayer((prev) => {
        const nextCombo = prev.combo + 1;
        const highestCombo = Math.max(prev.highestCombo, nextCombo);
        const repScore = 150 * (nextCombo >= 3 ? 1.5 : 1.0);
        AudioSystem.playRepSuccess(nextCombo);

        if (nextCombo === 3 || nextCombo === 5 || nextCombo === 10) {
          triggerNotification(`COMBO x${nextCombo}!`, 'var(--neon-yellow)');
          AICoachService.speak(`Combo times ${nextCombo}! Keep it going!`);
        } else {
          triggerNotification(`+1 REP!`, 'var(--neon-green)');
        }

        return {
          ...prev,
          combo: nextCombo,
          highestCombo,
          score: Math.round(prev.score + repScore),
        };
      });

      setChallenge((prev) => {
        const nextReps = prev.currentReps + 1;
        if (nextReps >= prev.targetReps) {
          // Challenge Completed! Trigger Player Attack
          handleChallengeSuccess();
        }
        return {
          ...prev,
          currentReps: nextReps,
        };
      });
    },
    [challenge.targetReps]
  );

  // Handle Invalid Repetition
  const handleInvalidRep = useCallback(() => {
    AudioSystem.playRepInvalid();
    triggerNotification('INVALID REP! CHECK DEPTH', 'var(--neon-red)');

    setPlayer((prev) => ({
      ...prev,
      combo: 0, // Reset combo on invalid form
    }));

    setChallenge((prev) => ({
      ...prev,
      invalidReps: prev.invalidReps + 1,
    }));
  }, []);

  // Handle Challenge Success -> Player Attack -> Damage Monster
  const handleChallengeSuccess = useCallback(() => {
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);

    AudioSystem.playAttackReady();
    triggerNotification('ATTACK READY! RELEASING KINETIC BLAST!', 'var(--neon-cyan)');
    AICoachService.speak('Attack ready! Unleash kinetic strike!');

    setTimeout(() => {
      // Calculate attack damage with combo multiplier
      const attackCalc = DamageSystem.calculatePlayerAttack(challenge.damageReward, player.combo);
      AudioSystem.playPlayerAttack();
      setMonsterIsHit(true);
      setScreenShake(true);

      triggerNotification(`KINETIC STRIKE! -${attackCalc.damage} HP ${attackCalc.isCrit ? '(CRIT!)' : ''}`, 'var(--neon-cyan)');

      setTimeout(() => {
        setMonsterIsHit(false);
        setScreenShake(false);
      }, 500);

      setCurrentMonster((prevMonster) => {
        const remainingHp = Math.max(0, prevMonster.hp - attackCalc.damage);

        setPlayer((p) => ({
          ...p,
          totalDamageDealt: p.totalDamageDealt + attackCalc.damage,
        }));

        if (remainingHp <= 0) {
          // Monster Defeated!
          handleMonsterDefeated(prevMonster);
        } else {
          // Monster survived round, transition to next challenge
          setTimeout(() => {
            advanceToNextRound(true);
          }, 1500);
        }

        return {
          ...prevMonster,
          hp: remainingHp,
        };
      });
    }, 600);
  }, [challenge.damageReward, player.combo]);

  // Handle Monster Defeat
  const handleMonsterDefeated = useCallback(
    (defeatedMonster: Monster) => {
      AICoachService.speak(`${defeatedMonster.name} has been vanquished! Fantastic conditioning!`, true);
      triggerNotification(`${defeatedMonster.name} DEFEATED!`, 'var(--neon-green)');

      const nextMonsterIdx = currentMonsterIndex + 1;
      const totalMonsters = MonsterManager.getTotalMonsterCount();

      if (nextMonsterIdx >= totalMonsters) {
        // Player defeated all monsters including Nexus Prime Final Boss!
        setTimeout(() => {
          AudioSystem.playVictory();
          onBattleEnd('VICTORY', historyRecords);
        }, 1500);
      } else {
        // Advance to next monster!
        setTimeout(() => {
          const nextM = MonsterManager.getMonsterByIndex(nextMonsterIdx);
          setCurrentMonsterIndex(nextMonsterIdx);
          setCurrentMonster(nextM);
          setMonsterQuote(nextM.quote);
          AICoachService.speak(`Warning: New challenger detected! Prepare for ${nextM.name}!`, true);
          advanceToNextRound(true, nextM);
        }, 2000);
      }
    },
    [currentMonsterIndex, historyRecords, onBattleEnd]
  );

  // Advance to Next Round & Ask AI for Dynamic Challenge
  const advanceToNextRound = useCallback(
    async (completedSuccess: boolean, overrideMonster?: Monster) => {
      const monsterTarget = overrideMonster || currentMonster;
      const roundDuration = (Date.now() - roundStartTimeRef.current) / 1000;
      const avgDuration =
        repDurationsRef.current.length > 0
          ? repDurationsRef.current.reduce((a, b) => a + b, 0) / repDurationsRef.current.length
          : 3.0;

      // 1. Calculate Mathematical Performance Score
      const performanceMetrics: PerformanceMetrics = DifficultyManager.calculatePerformanceScore({
        validReps: challenge.currentReps,
        invalidReps: challenge.invalidReps,
        targetReps: challenge.targetReps,
        averageRepDuration: avgDuration,
        qualityScores: qualityScoresRef.current,
        roundDuration,
        timeLimit: challenge.timeLimit,
      });

      // Record History
      const historyItem: RoundHistoryRecord = {
        round,
        monsterId: monsterTarget.id,
        exercise: challenge.exercise,
        repsCompleted: challenge.currentReps,
        targetReps: challenge.targetReps,
        invalidReps: challenge.invalidReps,
        accuracy: performanceMetrics.repAccuracy,
        durationSeconds: Math.round(roundDuration),
        damageDealt: challenge.damageReward,
        performanceScore: performanceMetrics.overallScore,
        timestamp: Date.now(),
      };

      const updatedHistory = [...historyRecords, historyItem];
      setHistoryRecords(updatedHistory);

      // Reset round refs
      roundStartTimeRef.current = Date.now();
      repDurationsRef.current = [];
      qualityScoresRef.current = [];

      // Check if NEXUS PRIME should trigger Mirror Phase (at or below 50% HP)
      if (
        monsterTarget.id === 'nexus_prime' &&
        monsterTarget.hp / monsterTarget.maxHp <= 0.5 &&
        !mirrorPhaseTriggeredRef.current
      ) {
        startMirrorPhase();
        return;
      }

      // 2. Query AI Engine for next adaptive challenge
      setAiIsThinking(true);
      try {
        const isBoss = monsterTarget.id === 'nexus_prime';
        const aiDecision = await AIEngine.getInstance().getNextChallenge({
          playerPerformance: performanceMetrics,
          currentDifficulty: challenge.difficulty,
          exerciseHistory: updatedHistory,
          currentHealth: player.hp,
          monsterHealth: monsterTarget.hp,
          fatigueIndicator: performanceMetrics.fatigueIndicator,
          previousExercises: updatedHistory.map((h) => h.exercise),
          currentMonster: monsterTarget,
          round: round + 1,
          isBossBattle: isBoss,
          bossPhase: isBoss ? Math.min(5, round) : undefined,
          mirrorPhaseContext:
            mirrorAvgScoreRef.current > 0
              ? {
                  avgScore: mirrorAvgScoreRef.current,
                  outcome: mirrorOutcomeRef.current,
                }
              : undefined,
        });

        // Update with AI Generated Challenge
        setChallenge({
          id: `round-${round + 1}`,
          exercise: aiDecision.nextExercise,
          targetReps: aiDecision.targetReps,
          currentReps: 0,
          invalidReps: 0,
          timeLimit: aiDecision.timeLimit,
          timeRemaining: aiDecision.timeLimit,
          difficulty: aiDecision.difficulty,
          damageReward: EXERCISE_DEFINITIONS[aiDecision.nextExercise].baseDamage + aiDecision.difficulty * 4,
          reason: aiDecision.reason,
          coachNote: aiDecision.coachMessage,
        });

        setCoachSpeech(aiDecision.coachMessage);
        setMonsterQuote(aiDecision.monsterThreat);
        AICoachService.speak(aiDecision.coachMessage);
      } catch (e) {
        console.error('Error obtaining AI challenge:', e);
      } finally {
        setAiIsThinking(false);
        setRound((r) => r + 1);
      }
    },
    [challenge, currentMonster, historyRecords, player.hp, round, startMirrorPhase]
  );

  // Setup Computer Vision Stream & Exercise Loop
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      if (isDemoMode) {
        setLiveFeedback('Simulation Mode: Ready to trigger reps');
        return;
      }

      try {
        const estimator = new PoseEstimator();
        poseEstimatorRef.current = estimator;

        await estimator.initialize();
        if (!isMounted) return;

        if (videoRef.current) {
          await estimator.startCamera(videoRef.current);
        }

        estimator.setOnResults((landmarks: Landmark[]) => {
          if (!isMounted) return;

          if (mirrorPhaseActiveRef.current) {
            // Mirror Phase active: render mirror overlay & process frame through MirrorScorer
            if (canvasRef.current) {
              const curState = mirrorRenderStateRef.current;
              PoseOverlayRenderer.renderMirrorOverlay(
                canvasRef.current,
                landmarks,
                curState.frameResult?.jointScores || null,
                curState.currentScore,
                { mirrored: true }
              );
            }
            mirrorControllerRef.current?.processFrame(landmarks);
          } else {
            // Normal combat: render standard skeleton overlay
            if (canvasRef.current) {
              PoseOverlayRenderer.render(canvasRef.current, landmarks, {
                showAngles: true,
                postureValid: livePostureScore >= 65,
              });
            }

            // Process Frame through current exercise detector
            const res = exerciseManagerRef.current.processFrame(landmarks, Date.now());

            setLiveFeedback(res.feedback.message);
            setLiveStage(res.stage);
            setLivePostureScore(res.qualityScore);
            setRepProgressPercent(res.progressPercent);

            if (res.isRepCompleted) {
              handleValidRep(res.repDurationSeconds, res.qualityScore);
            } else if (res.isInvalidRep) {
              handleInvalidRep();
            }
          }
        });
      } catch (err) {
        console.error('Pose tracking error in BattleArena:', err);
        setLiveFeedback('Camera disconnected. Please check permissions.');
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (poseEstimatorRef.current) {
        poseEstimatorRef.current.stop();
        poseEstimatorRef.current = null;
      }
      if (mirrorControllerRef.current) {
        mirrorControllerRef.current.cancel();
        mirrorControllerRef.current = null;
      }
    };
  }, [isDemoMode, handleValidRep, handleInvalidRep]);

  const activeDef = EXERCISE_DEFINITIONS[challenge.exercise];

  return (
    <div
      className={screenShake ? 'shake-screen' : ''}
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '16px 20px',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* NEXUS PRIME Mirror Phase Gauntlet Overlay */}
      {mirrorPhaseActive && <MirrorPhaseOverlay state={mirrorRenderState} />}

      {/* Top HUD: Round, Time, Difficulty, Score */}
      <div
        className="cyber-panel"
        style={{
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sub)' }}>
              STAGE
            </span>
            <h3
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '1.2rem',
                color: isMirrorStyle ? 'var(--neon-yellow)' : 'var(--neon-cyan)',
              }}
            >
              {isMirrorStyle ? 'MIRROR GAUNTLET' : `ROUND ${round}`}
            </h3>
          </div>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: isMirrorStyle ? 'rgba(255, 230, 0, 0.12)' : 'rgba(255, 0, 127, 0.1)',
              border: `1px solid ${isMirrorStyle ? 'var(--neon-yellow)' : 'var(--neon-magenta)'}`,
              fontFamily: 'var(--font-gaming)',
              fontSize: '0.8rem',
              color: isMirrorStyle ? 'var(--neon-yellow)' : 'var(--neon-magenta)',
            }}
          >
            {isMirrorStyle ? 'BOSS TIER 5' : `DIFF: TIER ${challenge.difficulty}`}
          </div>
        </div>

        {/* Center: Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            borderRadius: '20px',
            background: challenge.timeRemaining < 10 ? 'rgba(255, 51, 102, 0.2)' : 'rgba(0, 0, 0, 0.5)',
            border: `1px solid ${challenge.timeRemaining < 10 ? 'var(--neon-red)' : 'var(--border-color)'}`,
          }}
        >
          <Clock
            size={18}
            color={challenge.timeRemaining < 10 ? 'var(--neon-red)' : 'var(--neon-cyan)'}
          />
          <span
            style={{
              fontFamily: 'var(--font-gaming)',
              fontSize: '1.15rem',
              fontWeight: 800,
              color: challenge.timeRemaining < 10 ? 'var(--neon-red)' : '#fff',
            }}
          >
            00:{challenge.timeRemaining < 10 ? `0${challenge.timeRemaining}` : challenge.timeRemaining}
          </span>
        </div>

        {/* Right: Score & Damage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sub)' }}>
              TOTAL DAMAGE
            </span>
            <p style={{ fontFamily: 'var(--font-gaming)', fontSize: '1rem', color: 'var(--neon-yellow)' }}>
              {player.totalDamageDealt} DMG
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sub)' }}>
              SCORE
            </span>
            <p style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.2rem', color: 'var(--neon-green)' }}>
              {player.score.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Battle Grid: Monster Card vs Player Camera Arena */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* LEFT: Monster Combat Card */}
        <div
          className="cyber-panel"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            minHeight: '440px',
            justifyContent: 'space-between',
          }}
        >
          {/* Monster Header */}
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '3px 12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-sub)',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              ENEMY {currentMonsterIndex + 1} / {MonsterManager.getTotalMonsterCount()}
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '1.5rem',
                color: currentMonster.accentColor,
                textShadow: `0 0 12px ${currentMonster.glowColor}`,
                letterSpacing: '1px',
              }}
            >
              {currentMonster.name}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentMonster.title}</p>
          </div>

          {/* Monster Animated SVG Visual */}
          <div style={{ position: 'relative', margin: '14px 0' }}>
            <MonsterVisual
              id={currentMonster.id}
              name={currentMonster.name}
              isHit={monsterIsHit}
              isAttacking={monsterIsAttacking}
              size={220}
            />

            {/* Damage Popup */}
            {floatingNotification && (
              <div
                style={{
                  position: 'absolute',
                  top: '20%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(7, 10, 19, 0.9)',
                  border: `2px solid ${floatingNotification.color}`,
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontFamily: 'var(--font-gaming)',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  color: floatingNotification.color,
                  boxShadow: `0 0 20px ${floatingNotification.color}`,
                  animation: 'popIn 0.3s ease-out',
                  zIndex: 20,
                  whiteSpace: 'nowrap',
                }}
              >
                {floatingNotification.text}
              </div>
            )}
          </div>

          {/* Monster HP Bar */}
          <div style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontFamily: 'var(--font-gaming)',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: 'var(--neon-red)' }}>MONSTER HP</span>
              <span>
                {currentMonster.hp} / {currentMonster.maxHp}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '14px',
                background: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '7px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 51, 102, 0.3)',
              }}
            >
              <div
                style={{
                  width: `${(currentMonster.hp / currentMonster.maxHp) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ff0055, #ff5500)',
                  boxShadow: '0 0 10px rgba(255, 0, 85, 0.6)',
                  transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>

            {/* Monster Quote */}
            <div
              style={{
                marginTop: '12px',
                padding: '8px 14px',
                borderRadius: '6px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderLeft: `3px solid ${currentMonster.accentColor}`,
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}
            >
              "{monsterQuote}"
            </div>
          </div>
        </div>

        {/* RIGHT: Player Camera Viewport + CV Skeleton */}
        <div
          className="cyber-panel"
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Camera Viewport Canvas */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#05070d',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)',
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            />

            {/* Camera HUD Overlays */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                display: 'flex',
                gap: '8px',
              }}
            >
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.65)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid var(--neon-cyan)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-gaming)',
                  color: 'var(--neon-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--neon-green)',
                    boxShadow: '0 0 8px var(--neon-green)',
                  }}
                />
                POSE TRACKER ACTIVE
              </div>
            </div>

            {/* Combo Badge Floating on Camera */}
            {player.combo >= 2 && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'linear-gradient(135deg, rgba(255, 230, 0, 0.2), rgba(255, 0, 127, 0.4))',
                  border: '1px solid var(--neon-yellow)',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'pulseGlow 1.5s infinite',
                }}
              >
                <Flame size={18} color="var(--neon-yellow)" />
                <span
                  style={{
                    fontFamily: 'var(--font-gaming)',
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    color: 'var(--neon-yellow)',
                  }}
                >
                  COMBO x{player.combo}
                </span>
              </div>
            )}

            {/* Real-Time Form Feedback Pill */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                background: 'rgba(7, 10, 19, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-color)',
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} color="var(--neon-cyan)" />
                <span
                  style={{
                    fontFamily: 'var(--font-sub)',
                    fontSize: '0.9rem',
                    color: '#fff',
                    fontWeight: 600,
                  }}
                >
                  {liveFeedback}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                STAGE: {liveStage}
              </span>
            </div>
          </div>

          {/* Player HP Bar */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontFamily: 'var(--font-gaming)',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: 'var(--neon-cyan)' }}>PLAYER INTEGRITY</span>
              <span>
                {player.hp} / {player.maxHp} HP
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '12px',
                background: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 240, 255, 0.3)',
              }}
            >
              <div
                style={{
                  width: `${(player.hp / player.maxHp) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00f0ff, #00ff88)',
                  boxShadow: '0 0 10px rgba(0, 240, 255, 0.6)',
                  transition: 'width 0.3s ease-out',
                }}
              />
            </div>
          </div>

          {/* Simulation Controls for testing without webcam */}
          {isDemoMode && (
            <div
              style={{
                padding: '10px',
                borderRadius: '6px',
                background: 'rgba(255, 230, 0, 0.08)',
                border: '1px dashed var(--neon-yellow)',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-gaming)',
                  fontSize: '0.75rem',
                  color: 'var(--neon-yellow)',
                }}
              >
                ⚡ SIMULATION TEST TOOLS:
              </span>
              <button
                onClick={() => handleValidRep(2.4, 95)}
                className="cyber-button cyber-button-sm"
                style={{ background: 'rgba(0, 255, 136, 0.2)', borderColor: 'var(--neon-green)', color: '#fff' }}
              >
                + SIMULATE GOOD REP
              </button>
              <button
                onClick={handleInvalidRep}
                className="cyber-button cyber-button-sm"
                style={{ background: 'rgba(255, 51, 102, 0.2)', borderColor: 'var(--neon-red)', color: '#fff' }}
              >
                ✕ SIMULATE SHALLOW REP
              </button>

              {/* Mirror Phase Simulation Buttons */}
              <button
                onClick={() => mirrorControllerRef.current?.simulateOutcome('perfect')}
                className="cyber-button cyber-button-sm"
                style={{ background: 'rgba(0, 255, 136, 0.25)', borderColor: 'var(--neon-green)', color: '#fff' }}
                title="Force Perfect Mirror outcome in active Mirror Phase"
              >
                + SIMULATE PERFECT MIRROR
              </button>
              <button
                onClick={() => mirrorControllerRef.current?.simulateOutcome('partial')}
                className="cyber-button cyber-button-sm"
                style={{ background: 'rgba(255, 230, 0, 0.25)', borderColor: 'var(--neon-yellow)', color: '#fff' }}
                title="Force Partial Mirror outcome in active Mirror Phase"
              >
                ~ SIMULATE PARTIAL MIRROR
              </button>
              <button
                onClick={() => mirrorControllerRef.current?.simulateOutcome('failed')}
                className="cyber-button cyber-button-sm"
                style={{ background: 'rgba(255, 51, 102, 0.25)', borderColor: 'var(--neon-red)', color: '#fff' }}
                title="Force Failed Mirror outcome in active Mirror Phase"
              >
                ✕ SIMULATE FAILED MIRROR
              </button>
              {!mirrorPhaseActive && currentMonster.id === 'nexus_prime' && (
                <button
                  onClick={startMirrorPhase}
                  className="cyber-button cyber-button-sm"
                  style={{ background: 'rgba(239, 68, 68, 0.3)', borderColor: '#ef4444', color: '#ff8888' }}
                  title="Manually trigger Mirror Phase on NEXUS PRIME"
                >
                  ⚡ FORCE MIRROR PHASE
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CHALLENGE BANNER: Exercise, Rep Counter, Progress, and AI Reason */}
      <div
        className="cyber-panel"
        style={{
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          alignItems: 'center',
        }}
      >
        {/* Left: Active Exercise Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              fontSize: '2.5rem',
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid var(--neon-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {activeDef.icon}
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-sub)',
                fontSize: '0.8rem',
                color: 'var(--neon-cyan)',
                letterSpacing: '1.5px',
                fontWeight: 700,
              }}
            >
              CURRENT CHALLENGE
            </span>
            <h3 style={{ fontFamily: 'var(--font-gaming)', fontSize: '1.4rem' }}>{activeDef.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{activeDef.description}</p>
          </div>
        </div>

        {/* Center: Rep Counter & Gauge */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '2.4rem',
                fontWeight: 900,
                color: 'var(--neon-cyan)',
              }}
            >
              {challenge.currentReps}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '1.4rem',
                color: 'var(--text-muted)',
              }}
            >
              / {challenge.targetReps}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>REPS</span>
          </div>

          {/* Rep Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '10px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '5px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: `${(challenge.currentReps / challenge.targetReps) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-green))',
                transition: 'width 0.25s ease-out',
              }}
            />
          </div>
        </div>

        {/* Right: AI Decision Insight & Coach Message */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 0, 127, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
            }}
          >
            <Zap size={15} color="var(--neon-magenta)" />
            <span
              style={{
                fontFamily: 'var(--font-gaming)',
                fontSize: '0.75rem',
                color: 'var(--neon-magenta)',
              }}
            >
              AI COACH & DIFFICULTY ADAPTATION
            </span>
          </div>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              marginBottom: '6px',
            }}
          >
            {coachSpeech}
          </p>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            Rationale: {challenge.reason}
          </p>
        </div>
      </div>
    </div>
  );
};
