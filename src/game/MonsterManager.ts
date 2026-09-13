import { Monster, MonsterId } from '../types';

export class MonsterManager {
  private static readonly MONSTER_ROSTER: Monster[] = [
    {
      id: 'goblin',
      name: 'Training Goblin',
      title: 'Scout of the Cyber Dungeons',
      hp: 60,
      maxHp: 60,
      attackDamage: 10,
      difficulty: 1,
      accentColor: '#10b981', // Emerald green
      secondaryColor: '#059669',
      glowColor: 'rgba(16, 185, 129, 0.5)',
      quote: 'Hehe! Let us see if you can even break a sweat!',
      defeatQuote: 'Gahh! Your conditioning was... unexpectedly legit!',
      phase: 1,
      maxPhases: 1,
    },
    {
      id: 'cyber_beast',
      name: 'Cyber Beast',
      title: 'Overclocked Neon Wolf',
      hp: 85,
      maxHp: 85,
      attackDamage: 14,
      difficulty: 2,
      accentColor: '#06b6d4', // Cyan
      secondaryColor: '#0284c7',
      glowColor: 'rgba(6, 182, 212, 0.5)',
      quote: 'My cybernetic pistons never tire! Can you keep up with my speed?',
      defeatQuote: 'System overheating... power grid offline...',
      phase: 1,
      maxPhases: 1,
    },
    {
      id: 'iron_titan',
      name: 'Iron Titan',
      title: 'Reinforced Heavy Mech',
      hp: 110,
      maxHp: 110,
      attackDamage: 18,
      difficulty: 3,
      accentColor: '#f59e0b', // Amber
      secondaryColor: '#d97706',
      glowColor: 'rgba(245, 158, 11, 0.5)',
      quote: 'Titanium armor requires immense power to dent. Show me your depth!',
      defeatQuote: 'Hydraulics collapsed... you crushed my armor...',
      phase: 1,
      maxPhases: 1,
    },
    {
      id: 'shadow_warrior',
      name: 'Shadow Wraith',
      title: 'Spectral Shinobi',
      hp: 135,
      maxHp: 135,
      attackDamage: 22,
      difficulty: 4,
      accentColor: '#a855f7', // Purple
      secondaryColor: '#7c3aed',
      glowColor: 'rgba(168, 85, 247, 0.5)',
      quote: 'The shadows devour the sluggish. Only relentless agility can touch me.',
      defeatQuote: 'My veil was shattered by pure kinetic fury...',
      phase: 1,
      maxPhases: 1,
    },
    {
      id: 'nexus_prime',
      name: 'NEXUS PRIME',
      title: 'The Omniscient AI Core (FINAL BOSS)',
      hp: 160,
      maxHp: 160,
      attackDamage: 25,
      difficulty: 5,
      accentColor: '#ef4444', // Red
      secondaryColor: '#dc2626',
      glowColor: 'rgba(239, 68, 68, 0.6)',
      quote: 'I have recorded every rep of your journey. I will now predict and counter your power.',
      defeatQuote: 'Core critical failure... human will surpasses algorithmic limits...',
      phase: 1,
      maxPhases: 5,
    },
  ];

  public static getMonsterByIndex(index: number): Monster {
    const safeIndex = Math.min(index, MonsterManager.MONSTER_ROSTER.length - 1);
    const m = MonsterManager.MONSTER_ROSTER[safeIndex];
    return { ...m };
  }

  public static getMonsterById(id: MonsterId): Monster {
    const found = MonsterManager.MONSTER_ROSTER.find((m) => m.id === id);
    if (!found) return { ...MonsterManager.MONSTER_ROSTER[0] };
    return { ...found };
  }

  public static getTotalMonsterCount(): number {
    return MonsterManager.MONSTER_ROSTER.length;
  }
}
