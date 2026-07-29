import {
  PlayerStat,
  type PlayerProfile,
  type PlayerSkillLevels,
  type PlayerStat as PlayerStatType,
} from "../data/catalog";
import {
  sageModeRecoveryIntervalMultiplier,
  shadowBreathingRecoveryIntervalMultiplier,
} from "../skills/skill-rules";

export const GREEN_MUSHROOM_EXP = 25;

export const RECOVERY_RULES = {
  intervalMs: 1_600,
  damageDelayMs: 2_600,
  hpPerTick: 6,
  mpPerTick: 4,
} as const;

const LEVEL_UP_HP_GAIN = 14;
const LEVEL_UP_MP_GAIN = 7;
const MAX_EXP_PER_AWARD = 1_000_000;
export const MAX_CHARACTER_LEVEL = 200;
export const STAT_POINTS_PER_LEVEL = 5;
export const SKILL_POINTS_PER_LEVEL = 3;

export const STAT_LABELS: Record<PlayerStatType, string> = {
  [PlayerStat.Str]: "STR",
  [PlayerStat.Dex]: "DEX",
  [PlayerStat.Int]: "INT",
  [PlayerStat.Luk]: "LUK",
};

export interface ExperienceResult {
  character: PlayerProfile;
  exp: number;
  levelsGained: number;
  statPointsGained: number;
  skillPointsGained: number;
  statsAutoAllocated: boolean;
}

export interface RecoveryResult {
  character: PlayerProfile;
  hpRecovered: number;
  mpRecovered: number;
}

export function expRequiredForLevel(level: number): number {
  return 100 + Math.max(0, Math.floor(level) - 10) * 40;
}

export function awardExperience(
  character: PlayerProfile,
  currentExp: number,
  amount: number,
): ExperienceResult {
  let nextCharacter: PlayerProfile = {
    ...character,
    stats: { ...character.stats },
    skillLevels: { ...character.skillLevels },
  };
  const safeCurrentExp = Number.isFinite(currentExp)
    ? Math.max(0, Math.floor(currentExp))
    : 0;
  const safeAward = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  let exp = Math.min(
    MAX_EXP_PER_AWARD,
    safeCurrentExp +
      (nextCharacter.level >= MAX_CHARACTER_LEVEL ? 0 : safeAward),
  );
  let levelsGained = 0;

  while (
    nextCharacter.level < MAX_CHARACTER_LEVEL &&
    exp >= expRequiredForLevel(nextCharacter.level)
  ) {
    exp -= expRequiredForLevel(nextCharacter.level);
    nextCharacter.level += 1;
    nextCharacter.maxHp += LEVEL_UP_HP_GAIN;
    nextCharacter.maxMp += LEVEL_UP_MP_GAIN;
    nextCharacter.hp = nextCharacter.maxHp;
    nextCharacter.mp = nextCharacter.maxMp;
    nextCharacter.statPoints += STAT_POINTS_PER_LEVEL;
    nextCharacter.skillPoints += SKILL_POINTS_PER_LEVEL;
    levelsGained += 1;
  }
  if (nextCharacter.level >= MAX_CHARACTER_LEVEL) {
    exp = Math.min(exp, expRequiredForLevel(MAX_CHARACTER_LEVEL) - 1);
  }

  const statsAutoAllocated = levelsGained > 0 && nextCharacter.autoAllocateStats;
  if (statsAutoAllocated) {
    nextCharacter = autoAllocateStatPoints(nextCharacter);
  }

  return {
    character: nextCharacter,
    exp,
    levelsGained,
    statPointsGained: levelsGained * STAT_POINTS_PER_LEVEL,
    skillPointsGained: levelsGained * SKILL_POINTS_PER_LEVEL,
    statsAutoAllocated,
  };
}

export function allocateStatPoint(
  character: PlayerProfile,
  stat: PlayerStatType,
): PlayerProfile {
  if (character.statPoints <= 0) {
    return character;
  }

  return {
    ...character,
    stats: {
      ...character.stats,
      [stat]: character.stats[stat] + 1,
    },
    statPoints: character.statPoints - 1,
  };
}

export function autoAllocateStatPoints(character: PlayerProfile): PlayerProfile {
  const points = Math.max(0, Math.floor(character.statPoints));
  if (points === 0) {
    return character;
  }

  const fullSets = Math.floor(points / STAT_POINTS_PER_LEVEL);
  const remainder = points % STAT_POINTS_PER_LEVEL;
  return {
    ...character,
    stats: {
      ...character.stats,
      dex: character.stats.dex + fullSets,
      luk: character.stats.luk + fullSets * 4 + remainder,
    },
    statPoints: 0,
  };
}

export function statsForMigratedLevel(character: PlayerProfile): PlayerProfile {
  const earnedPoints = Math.max(0, character.level - 10) * STAT_POINTS_PER_LEVEL;
  return autoAllocateStatPoints({
    ...character,
    stats: { ...character.stats },
    skillLevels: { ...character.skillLevels },
    statPoints: earnedPoints,
  });
}

export function canApplyRecoveryTick(
  now: number,
  lastRecoveryAt: number,
  lastDamagedAt: number,
  intervalMs: number = RECOVERY_RULES.intervalMs,
): boolean {
  const safeIntervalMs =
    Number.isFinite(intervalMs) && intervalMs >= 0
      ? intervalMs
      : RECOVERY_RULES.intervalMs;
  return (
    now - lastRecoveryAt >= safeIntervalMs &&
    now - lastDamagedAt >= RECOVERY_RULES.damageDelayMs
  );
}

export function recoveryIntervalMs(skillLevels?: PlayerSkillLevels): number {
  return Math.round(
    RECOVERY_RULES.intervalMs *
      shadowBreathingRecoveryIntervalMultiplier(skillLevels) *
      sageModeRecoveryIntervalMultiplier(skillLevels),
  );
}

export function recoverCharacter(
  character: PlayerProfile,
  recoverMp = true,
): RecoveryResult {
  const hp = Math.min(character.maxHp, character.hp + RECOVERY_RULES.hpPerTick);
  const mp = recoverMp
    ? Math.min(character.maxMp, character.mp + RECOVERY_RULES.mpPerTick)
    : character.mp;

  return {
    character: { ...character, hp, mp },
    hpRecovered: hp - character.hp,
    mpRecovered: mp - character.mp,
  };
}
