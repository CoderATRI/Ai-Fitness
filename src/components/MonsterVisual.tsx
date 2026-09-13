import React from 'react';
import { MonsterId } from '../types';

interface MonsterVisualProps {
  id: MonsterId;
  name: string;
  isHit?: boolean;
  isAttacking?: boolean;
  size?: number;
}

export const MonsterVisual: React.FC<MonsterVisualProps> = ({
  id,
  name,
  isHit = false,
  isAttacking = false,
  size = 280,
}) => {
  const getAvatarContent = () => {
    switch (id) {
      case 'goblin':
        return (
          <g>
            {/* Cyber Goblin */}
            <defs>
              <radialGradient id="goblinGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="150" cy="150" r="120" fill="url(#goblinGlow)" opacity="0.4" />
            {/* Ears */}
            <polygon points="60,110 10,70 80,95" fill="#059669" stroke="#10b981" strokeWidth="3" />
            <polygon points="240,110 290,70 220,95" fill="#059669" stroke="#10b981" strokeWidth="3" />
            {/* Head */}
            <ellipse cx="150" cy="145" rx="75" ry="65" fill="#065f46" stroke="#10b981" strokeWidth="4" />
            {/* Cyber Eyepiece */}
            <rect x="95" y="120" width="38" height="28" rx="6" fill="#111827" stroke="#34d399" strokeWidth="3" />
            <circle cx="114" cy="134" r="7" fill="#34d399" />
            <circle cx="114" cy="134" r="3" fill="#ffffff" />
            {/* Normal Eye */}
            <ellipse cx="180" cy="134" rx="14" ry="12" fill="#ffe600" />
            <ellipse cx="180" cy="134" rx="5" ry="10" fill="#111827" />
            {/* Fangs & Mouth */}
            <path d="M 115 170 Q 150 195 185 170" fill="none" stroke="#10b981" strokeWidth="4" />
            <polygon points="130,173 138,188 144,174" fill="#f8fafc" />
            <polygon points="156,174 162,188 170,173" fill="#f8fafc" />
            {/* Cyber Antenna */}
            <line x1="150" y1="80" x2="150" y2="40" stroke="#34d399" strokeWidth="3" />
            <circle cx="150" cy="38" r="6" fill="#34d399" />
          </g>
        );

      case 'cyber_beast':
        return (
          <g>
            {/* Cyber Wolf/Beast */}
            <defs>
              <radialGradient id="beastGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="150" cy="150" r="125" fill="url(#beastGlow)" opacity="0.4" />
            {/* Mechanical Ears */}
            <polygon points="85,100 65,30 115,70" fill="#0f172a" stroke="#00f0ff" strokeWidth="3" />
            <polygon points="215,100 235,30 185,70" fill="#0f172a" stroke="#00f0ff" strokeWidth="3" />
            {/* Cyber Wolf Head */}
            <polygon points="85,90 215,90 230,165 150,225 70,165" fill="#0f172a" stroke="#00f0ff" strokeWidth="4" />
            {/* Visor / Neon Eyes */}
            <polygon points="95,120 140,130 140,145 100,140" fill="#00f0ff" />
            <polygon points="205,120 160,130 160,145 200,140" fill="#00f0ff" />
            {/* Neon Snout & Jaws */}
            <polygon points="125,160 175,160 150,195" fill="#0284c7" />
            <line x1="100" y1="185" x2="200" y2="185" stroke="#00f0ff" strokeWidth="3" />
            <polygon points="115,185 125,198 135,185" fill="#ffffff" />
            <polygon points="165,185 175,198 185,185" fill="#ffffff" />
          </g>
        );

      case 'iron_titan':
        return (
          <g>
            {/* Heavy Iron Titan Mech */}
            <defs>
              <radialGradient id="titanGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="150" cy="150" r="130" fill="url(#titanGlow)" opacity="0.45" />
            {/* Shoulders */}
            <rect x="35" y="100" width="70" height="90" rx="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="4" />
            <rect x="195" y="100" width="70" height="90" rx="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="4" />
            {/* Chest Core Armor */}
            <polygon points="90,80 210,80 230,190 150,230 70,190" fill="#0f172a" stroke="#f59e0b" strokeWidth="5" />
            {/* Glowing Molten Core */}
            <circle cx="150" cy="150" r="28" fill="#f59e0b" />
            <circle cx="150" cy="150" r="18" fill="#fef08a" />
            {/* Helmet Visor */}
            <rect x="110" y="88" width="80" height="24" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
            <line x1="120" y1="100" x2="180" y2="100" stroke="#fef08a" strokeWidth="4" />
          </g>
        );

      case 'shadow_warrior':
        return (
          <g>
            {/* Shadow Wraith */}
            <defs>
              <radialGradient id="shadowGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#581c87" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="150" cy="150" r="130" fill="url(#shadowGlow)" opacity="0.5" />
            {/* Hood / Cape Tendrils */}
            <path d="M 50 240 Q 150 20 250 240 Q 150 210 50 240 Z" fill="#1e1035" stroke="#a855f7" strokeWidth="4" />
            {/* Void Face */}
            <ellipse cx="150" cy="140" rx="50" ry="60" fill="#0a0518" />
            {/* Glowing Violet Slit Eyes */}
            <ellipse cx="130" cy="132" rx="14" ry="4" fill="#e879f9" transform="rotate(-15 130 132)" />
            <ellipse cx="170" cy="132" rx="14" ry="4" fill="#e879f9" transform="rotate(15 170 132)" />
            {/* Dual Cyber Katanas (Sheathed cross behind back) */}
            <line x1="40" y1="40" x2="260" y2="260" stroke="#a855f7" strokeWidth="5" strokeLinecap="round" />
            <line x1="260" y1="40" x2="40" y2="260" stroke="#a855f7" strokeWidth="5" strokeLinecap="round" />
          </g>
        );

      case 'nexus_prime':
      default:
        return (
          <g>
            {/* NEXUS PRIME: The Final AI Singularity Boss */}
            <defs>
              <radialGradient id="nexusGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#991b1b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="150" cy="150" r="135" fill="url(#nexusGlow)" />
            {/* Concentric Rotating Tech Rings */}
            <circle cx="150" cy="150" r="110" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="14 10" />
            <circle cx="150" cy="150" r="85" fill="none" stroke="#fca5a5" strokeWidth="2" strokeDasharray="20 15" />
            <circle cx="150" cy="150" r="60" fill="none" stroke="#ffffff" strokeWidth="3" />
            {/* Central Singularity Core */}
            <polygon points="150,105 185,150 150,195 115,150" fill="#ef4444" stroke="#ffffff" strokeWidth="4" />
            <circle cx="150" cy="150" r="15" fill="#ffffff" />
            {/* Radiant Laser Pointers */}
            <line x1="150" y1="15" x2="150" y2="50" stroke="#ef4444" strokeWidth="4" />
            <line x1="150" y1="250" x2="150" y2="285" stroke="#ef4444" strokeWidth="4" />
            <line x1="15" y1="150" x2="50" y2="150" stroke="#ef4444" strokeWidth="4" />
            <line x1="250" y1="150" x2="285" y2="150" stroke="#ef4444" strokeWidth="4" />
          </g>
        );
    }
  };

  const animationClass = isHit
    ? 'monster-hit'
    : isAttacking
    ? 'attack-lunge'
    : '';

  return (
    <div
      className={`monster-container ${animationClass}`}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: !isHit && !isAttacking ? 'floatAnim 3.5s ease-in-out infinite' : undefined,
        transition: 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={name}
      >
        {getAvatarContent()}
      </svg>
    </div>
  );
};
