import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { CalibrationScreen } from './components/CalibrationScreen';
import { BattleArena } from './components/BattleArena';
import { VictoryDefeatScreen } from './components/VictoryDefeatScreen';
import { RewardsStore } from './components/RewardsStore';
import { CareerStatsModal } from './components/CareerStatsModal';
import { HelpModal } from './components/HelpModal';
import { RoundHistoryRecord } from './types';
import { RewardsProvider } from './context/RewardsContext';

type ScreenState = 'landing' | 'calibration' | 'battle' | 'results' | 'store';
type BattleMode = 'standard' | 'mirror_style';

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('landing');
  const [battleMode, setBattleMode] = useState<BattleMode>('standard');
  const [battleResult, setBattleResult] = useState<'VICTORY' | 'DEFEAT'>('VICTORY');
  const [roundHistory, setRoundHistory] = useState<RoundHistoryRecord[]>([]);
  const [currentBattleId, setCurrentBattleId] = useState<string>(
    () => `battle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  );

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  const handleStartBattle = () => {
    setCurrentBattleId(`battle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    setBattleMode('standard');
    setCurrentScreen('calibration');
  };

  const handleStartMirrorBattle = () => {
    setCurrentBattleId(`battle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    setBattleMode('mirror_style');
    setCurrentScreen('calibration');
  };

  const handleCalibrationComplete = () => {
    setCurrentScreen('battle');
  };

  const handleBattleEnd = (result: 'VICTORY' | 'DEFEAT', rounds: RoundHistoryRecord[]) => {
    setBattleResult(result);
    setRoundHistory(rounds);
    setCurrentScreen('results');
  };

  const handlePlayAgain = () => {
    setCurrentBattleId(`battle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    setRoundHistory([]);
    setCurrentScreen('calibration');
  };

  return (
    <div className="cyber-scanlines" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Universal Cyberpunk Header Navbar with Streak HUD & Store */}
      <Navbar
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenStore={() => setCurrentScreen('store')}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode((prev) => !prev)}
      />

      {/* Screen Views */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentScreen === 'landing' && (
          <LandingPage
            onStartBattle={handleStartBattle}
            onStartMirrorBattle={handleStartMirrorBattle}
            onOpenHelp={() => setIsHelpOpen(true)}
            onOpenStore={() => setCurrentScreen('store')}
            isDemoMode={isDemoMode}
          />
        )}

        {currentScreen === 'calibration' && (
          <CalibrationScreen
            onCalibrationComplete={handleCalibrationComplete}
            onCancel={() => setCurrentScreen('landing')}
            isDemoMode={isDemoMode}
          />
        )}

        {currentScreen === 'battle' && (
          <BattleArena
            onBattleEnd={handleBattleEnd}
            isDemoMode={isDemoMode}
            initialMode={battleMode}
          />
        )}

        {currentScreen === 'results' && (
          <VictoryDefeatScreen
            result={battleResult}
            rounds={roundHistory}
            battleId={currentBattleId}
            onPlayAgain={handlePlayAgain}
            onOpenCareerStats={() => setIsStatsOpen(true)}
            onOpenStore={() => setCurrentScreen('store')}
          />
        )}

        {currentScreen === 'store' && (
          <RewardsStore
            onBack={() => setCurrentScreen('landing')}
            onStartBattle={handleStartBattle}
          />
        )}
      </main>

      {/* Career Stats & Help Modals */}
      <CareerStatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Cyber Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '16px',
          borderTop: '1px solid rgba(0, 240, 255, 0.15)',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-sub)',
          letterSpacing: '1px',
        }}
      >
        AI FITNESS BATTLE &bull; REAL MOTION COMPUTER VISION &bull; POWERED BY MEDIAPIPE POSE & DYNAMIC AI
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <RewardsProvider>
      <AppContent />
    </RewardsProvider>
  );
};

export default App;
