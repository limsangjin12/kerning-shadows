import {
  PlayerJob,
  type PlayerProfile,
  type PlayerStats,
} from "../data/catalog";
import {
  awardExperience,
  expRequiredForLevel,
} from "../progression/progression-rules";
import {
  SKILL_DEFINITIONS,
  SKILL_ORDER,
} from "../skills/skill-rules";

export const CHARACTER_NAME_MIN_LENGTH = 2;
export const CHARACTER_NAME_MAX_LENGTH = 12;
export const CREATION_STAT_MIN = 4;
export const CREATION_STAT_MAX = 13;
export const CREATION_STAT_TOTAL = 25;
export const BOOST_CHARACTER_LEVEL = 120;

export const CharacterCreationMode = {
  Standard: "standard",
  Boost: "boost",
} as const;

export type CharacterCreationMode =
  (typeof CharacterCreationMode)[keyof typeof CharacterCreationMode];

const STAT_KEYS = ["str", "dex", "int", "luk"] as const;

export interface CharacterNameValidation {
  valid: boolean;
  name: string;
  message: string;
}

export function validateCharacterName(rawName: string): CharacterNameValidation {
  const name = rawName.trim().normalize("NFC");
  const length = [...name].length;
  if (length < CHARACTER_NAME_MIN_LENGTH || length > CHARACTER_NAME_MAX_LENGTH) {
    return {
      valid: false,
      name,
      message: `닉네임은 ${CHARACTER_NAME_MIN_LENGTH}~${CHARACTER_NAME_MAX_LENGTH}자로 입력하세요.`,
    };
  }
  if (!/^[가-힣A-Za-z0-9]+$/u.test(name)) {
    return {
      valid: false,
      name,
      message: "닉네임에는 한글, 영문, 숫자만 사용할 수 있습니다.",
    };
  }
  return { valid: true, name, message: "사용할 수 있는 닉네임입니다." };
}

export function normalizeCharacterName(rawName: unknown, fallback: string): string {
  if (typeof rawName !== "string") return fallback;
  const result = validateCharacterName(rawName);
  return result.valid ? result.name : fallback;
}

export function isValidCreationStats(value: unknown): value is PlayerStats {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const stats = value as Record<string, unknown>;
  const values = STAT_KEYS.map((key) => stats[key]);
  if (
    !values.every(
      (stat): stat is number =>
        typeof stat === "number" &&
        Number.isSafeInteger(stat) &&
        stat >= CREATION_STAT_MIN &&
        stat <= CREATION_STAT_MAX,
    )
  ) {
    return false;
  }
  return values.reduce((sum, stat) => sum + stat, 0) === CREATION_STAT_TOTAL;
}

export function rollCreationStats(random: () => number = Math.random): PlayerStats {
  const stats: PlayerStats = {
    str: CREATION_STAT_MIN,
    dex: CREATION_STAT_MIN,
    int: CREATION_STAT_MIN,
    luk: CREATION_STAT_MIN,
  };
  let remaining = CREATION_STAT_TOTAL - CREATION_STAT_MIN * STAT_KEYS.length;
  while (remaining > 0) {
    const candidates = STAT_KEYS.filter((key) => stats[key] < CREATION_STAT_MAX);
    const sample = random();
    const normalized = Number.isFinite(sample)
      ? Math.min(0.999_999, Math.max(0, sample))
      : 0;
    const key: keyof PlayerStats =
      candidates[Math.floor(normalized * candidates.length)] ?? "str";
    stats[key] += 1;
    remaining -= 1;
  }
  return stats;
}

export function boostCharacterToHokage(
  character: PlayerProfile,
): PlayerProfile {
  const targetExperience = Array.from(
    { length: Math.max(0, BOOST_CHARACTER_LEVEL - character.level) },
    (_, index) => expRequiredForLevel(character.level + index),
  ).reduce((total, required) => total + required, 0);
  const leveled = awardExperience(
    {
      ...character,
      stats: { ...character.stats },
      skillLevels: { ...character.skillLevels },
      autoAllocateStats: true,
    },
    0,
    targetExperience,
  ).character;
  const skillLevels = { ...leveled.skillLevels };
  let spentSkillPoints = 0;
  for (const skillId of SKILL_ORDER) {
    const maximum = SKILL_DEFINITIONS[skillId].maxLevel;
    skillLevels[skillId] = maximum;
    spentSkillPoints += maximum;
  }
  return {
    ...leveled,
    job: PlayerJob.Hokage,
    level: BOOST_CHARACTER_LEVEL,
    hp: leveled.maxHp,
    mp: leveled.maxMp,
    skillLevels,
    skillPoints: Math.max(0, leveled.skillPoints - spentSkillPoints),
  };
}
