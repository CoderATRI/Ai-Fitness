import React from 'react';
import { Volume2, VolumeX, Mic, MicOff, Trophy, HelpCircle, Activity, ShoppingBag } from 'lucide-react';
import { AudioSystem } from '../game/AudioSystem';
import { AICoachService } from '../ai/AICoach';
import { StreakTracker } from './StreakTracker';

interface NavbarProps {
  onOpenStats: () => void;
  onOpenHelp: () => void;
  onOpenStore?: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenStats,
  onOpenHelp,
  onOpenStore,
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [isMuted, setIsMuted] = React.useState<boolean>(AudioSystem.getMuted());
  const [isVoiceOn, setIsVoiceOn] = React.useState<boolean>(AICoachService.isVoiceEnabled());

  const handleToggleSound = () => {
    const muted = AudioSystem.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      AudioSystem.playRepSuccess(2);
    }
  };

  const handleToggleVoice = () => {
    const nextState = !isVoiceOn;
    AICoachService.setVoiceEnabled(nextState);
    setIsVoiceOn(nextState);
    if (nextState) {
      AICoachService.speak('AI Voice Coach initialized and active!', true);
    }
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 28px',
        borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
        background: 'rgba(7, 10, 19, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00f0ff, #ff007f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)',
          }}
        >
          <Activity size={22} color="#070a13" strokeWidth={2.5} />
        </div>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-gaming)',
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '2px',
              background: 'linear-gradient(90deg, #00f0ff, #ff007f)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI FITNESS BATTLE
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sub)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Computer Vision Motion Arena
          </p>
        </div>
      </div>

      {/* Control Buttons & Streak HUD */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Streak & Coin HUD */}
        <StreakTracker compact onOpenStore={onOpenStore} />

        {/* Rewards Store Button */}
        {onOpenStore && (
          <button
            onClick={onOpenStore}
            className="cyber-button cyber-button-sm cyber-button-magenta"
            style={{ padding: '6px 12px', gap: '6px' }}
            title="Open Rewards Marketplace"
          >
            <ShoppingBag size={14} />
            STORE
          </button>
        )}

        {/* Simulation / Dev Mode Toggle */}
        <button
          onClick={onToggleDemoMode}
          className="cyber-button cyber-button-sm"
          style={{
            borderColor: isDemoMode ? 'var(--neon-yellow)' : 'rgba(255, 230, 0, 0.3)',
            color: isDemoMode ? 'var(--neon-yellow)' : 'var(--text-muted)',
            boxShadow: isDemoMode ? '0 0 12px rgba(255, 230, 0, 0.3)' : 'none',
          }}
          title="Toggle Simulation Mode for testing when camera is not available"
        >
          {isDemoMode ? '⚡ DEMO' : '📷 CAM'}
        </button>

        {/* SFX Audio Toggle */}
        <button
          onClick={handleToggleSound}
          className="cyber-button cyber-button-sm"
          style={{ padding: '8px 12px' }}
          title={isMuted ? 'Unmute Audio SFX' : 'Mute Audio SFX'}
        >
          {isMuted ? <VolumeX size={16} color="var(--neon-red)" /> : <Volume2 size={16} />}
        </button>

        {/* AI Voice Coach Toggle */}
        <button
          onClick={handleToggleVoice}
          className="cyber-button cyber-button-sm"
          style={{ padding: '8px 12px' }}
          title={isVoiceOn ? 'Mute AI Coach Voice' : 'Enable AI Coach Voice'}
        >
          {isVoiceOn ? <Mic size={16} color="var(--neon-green)" /> : <MicOff size={16} color="var(--text-muted)" />}
        </button>

        {/* Career Stats */}
        <button
          onClick={onOpenStats}
          className="cyber-button cyber-button-sm"
          style={{ padding: '8px 12px' }}
          title="View Player Career Stats"
        >
          <Trophy size={16} color="var(--neon-yellow)" />
        </button>

        {/* Help Guide */}
        <button
          onClick={onOpenHelp}
          className="cyber-button cyber-button-sm"
          style={{ padding: '8px 12px' }}
          title="How To Play & Exercises Guide"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </nav>
  );
};
