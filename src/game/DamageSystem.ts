export interface DamageCalculation {
  damage: number;
  multiplier: number;
  isCrit: boolean;
  comboTier: number;
}

export class DamageSystem {
  public static getComboMultiplier(combo: number): { multiplier: number; tier: number } {
    if (combo >= 10) return { multiplier: 2.0, tier: 4 };
    if (combo >= 5) return { multiplier: 1.5, tier: 3 };
    if (combo >= 3) return { multiplier: 1.25, tier: 2 };
    return { multiplier: 1.0, tier: 1 };
  }

  public static calculatePlayerAttack(baseDamage: number, combo: number): DamageCalculation {
    const { multiplier, tier } = DamageSystem.getComboMultiplier(combo);
    const isCrit = combo >= 5 || Math.random() < 0.15;
    const critBonus = isCrit ? 1.2 : 1.0;

    const rawDamage = baseDamage * multiplier * critBonus;
    const damage = Math.round(rawDamage);

    return {
      damage,
      multiplier,
      isCrit,
      comboTier: tier,
    };
  }

  public static calculateMonsterDamage(monsterAttack: number, difficulty: number): number {
    const variance = (Math.random() * 0.2) - 0.1; // +/- 10%
    const diffScale = 1 + (difficulty - 1) * 0.15;
    const raw = monsterAttack * diffScale * (1 + variance);
    return Math.max(5, Math.round(raw));
  }
}
