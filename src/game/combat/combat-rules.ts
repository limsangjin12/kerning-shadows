import {
  PLAYER_JOB_RANK,
  PlayerJob,
  type PlayerJob as PlayerJobType,
  type PlayerProfile,
  type PlayerSkillLevels,
  type PlayerStats,
} from "../data/catalog";
import {
  CRITICAL_THROW_DAMAGE_MULTIPLIER,
  SkillId,
  criticalThrowChance,
  keenSightRangeMultiplier,
  nineTailsTransformationDamageMultiplier,
  skillDamageBonus,
  type SkillId as SkillIdType,
} from "../skills/skill-rules";

export const AttackKind = {
  Basic: "basicAttack",
  LuckySeven: "luckySeven",
  ShadowVolley: "shadowVolley",
  Drain: "drain",
  PhantomStars: "phantomStars",
  Avenger: "avenger",
  AbyssRain: "abyssRain",
  Rasengan: "rasengan",
  NineTailsClaw: "nineTailsClaw",
  TailedBeastBomb: "tailedBeastBomb",
  TeamAssault: "teamAssault",
  ThunderOrb: "thunderOrb",
} as const;

export type AttackKind = (typeof AttackKind)[keyof typeof AttackKind];
export type PlayerAttackAnimation = "basicAttack" | "luckySeven";
export type AttackFamily = "throwing-star" | "chakra";
export type AttackDelivery = "projectile" | "melee" | "cinematic";

export const PLAYER_INVULNERABILITY = {
  durationMs: 950,
  flashIntervalMs: 80,
  dimmedAlpha: 0.32,
} as const;

export const PLAYER_JOB_COMBAT_POWER_MULTIPLIERS: Record<PlayerJobType, number> = {
  [PlayerJob.Beginner]: 1,
  [PlayerJob.Rogue]: 12,
  [PlayerJob.Assassin]: 70,
  [PlayerJob.Hermit]: 350,
  [PlayerJob.Hokage]: 1_400,
};

const COMBAT_POWER_BASE_LEVEL = 10;
const COMBAT_POWER_LEVEL_INTERVAL = 55;
const COMBAT_POWER_MAX_LEVEL = 200;

export function playerLevelCombatPowerMultiplier(level: number): number {
  const safeLevel = Number.isFinite(level)
    ? Math.min(
        COMBAT_POWER_MAX_LEVEL,
        Math.max(COMBAT_POWER_BASE_LEVEL, Math.floor(level)),
      )
    : COMBAT_POWER_BASE_LEVEL;
  return 1 + (safeLevel - COMBAT_POWER_BASE_LEVEL) / COMBAT_POWER_LEVEL_INTERVAL;
}

export function playerCombatPowerMultiplier(
  job: PlayerJobType,
  level: number,
): number {
  return (
    PLAYER_JOB_COMBAT_POWER_MULTIPLIERS[job] *
    playerLevelCombatPowerMultiplier(level)
  );
}

export const BASE_PROJECTILE_LIFETIME_MS = 900;
export const PROJECTILE_SPAWN_OFFSET_X = 36;
export const DEFAULT_MELEE_RANGE_PX = 155;
export const NINE_TAILS_CLAW_ATTACK_SPEED_MULTIPLIER = 2;

export interface AttackDefinition {
  label: string;
  shortcut: string;
  playerAnimation: PlayerAttackAnimation;
  hitCount: number;
  hitIntervalMs: number;
  releaseDelayMs: number;
  minDamage: number;
  maxDamage: number;
  mpCost: number;
  projectileSpeed: number;
  projectileScale: number;
  maxTargets: number;
  hpDrainRatio: number;
  requiredJob: PlayerJobType;
  family: AttackFamily;
  delivery: AttackDelivery;
  transformationRequired: boolean;
  usesTransformationDamage: boolean;
}

export const ATTACK_DEFINITIONS: Record<AttackKind, AttackDefinition> = {
  [AttackKind.Basic]: {
    label: "기본 표창",
    shortcut: "CTRL",
    playerAnimation: "basicAttack",
    hitCount: 1,
    hitIntervalMs: 0,
    releaseDelayMs: 110,
    minDamage: 24,
    maxDamage: 32,
    mpCost: 0,
    projectileSpeed: 610,
    projectileScale: 0.5,
    maxTargets: 1,
    hpDrainRatio: 0,
    requiredJob: PlayerJob.Beginner,
    family: "throwing-star",
    delivery: "projectile",
    transformationRequired: false,
    usesTransformationDamage: false,
  },
  [AttackKind.LuckySeven]: {
    label: "럭키세븐",
    shortcut: "SHIFT",
    playerAnimation: "luckySeven",
    hitCount: 2,
    hitIntervalMs: 105,
    releaseDelayMs: 55,
    minDamage: 18,
    maxDamage: 24,
    mpCost: 12,
    projectileSpeed: 720,
    projectileScale: 0.625,
    maxTargets: 1,
    hpDrainRatio: 0,
    requiredJob: PlayerJob.Rogue,
    family: "throwing-star",
    delivery: "projectile",
    transformationRequired: false,
    usesTransformationDamage: false,
  },
  [AttackKind.ShadowVolley]: {
    label: "그림자 연사",
    shortcut: "Q",
    playerAnimation: "luckySeven",
    hitCount: 3,
    hitIntervalMs: 70,
    releaseDelayMs: 50,
    minDamage: 14,
    maxDamage: 18,
    mpCost: 16,
    projectileSpeed: 780,
    projectileScale: 0.54,
    maxTargets: 1,
    hpDrainRatio: 0,
    requiredJob: PlayerJob.Rogue,
    family: "throwing-star",
    delivery: "projectile",
    transformationRequired: false,
    usesTransformationDamage: false,
  },
  [AttackKind.Drain]: {
    label: "드레인",
    shortcut: "X",
    playerAnimation: "luckySeven",
    hitCount: 1,
    hitIntervalMs: 0,
    releaseDelayMs: 80,
    minDamage: 38,
    maxDamage: 50,
    mpCost: 16,
    projectileSpeed: 690,
    projectileScale: 0.72,
    maxTargets: 1,
    hpDrainRatio: 0.45,
    requiredJob: PlayerJob.Assassin,
    family: "throwing-star",
    delivery: "projectile",
    transformationRequired: false,
    usesTransformationDamage: false,
  },
  [AttackKind.PhantomStars]: {
    label: "환영 쌍성",
    shortcut: "W",
    playerAnimation: "luckySeven",
    hitCount: 2,
    hitIntervalMs: 95,
    releaseDelayMs: 65,
    minDamage: 30,
    maxDamage: 40,
    mpCost: 24,
    projectileSpeed: 740,
    projectileScale: 0.68,
    maxTargets: 2,
    hpDrainRatio: 0,
    requiredJob: PlayerJob.Assassin,
    family: "throwing-star",
    delivery: "projectile",
    transformationRequired: false,
    usesTransformationDamage: false,
  },
  [AttackKind.Avenger]: {
    label: "어벤저",
    shortcut: "C",
    playerAnimation: "luckySeven",
    hitCount: 1,
    hitIntervalMs: 0,
    releaseDelayMs: 75,
    minDamage: 34,
    maxDamage: 44,
    mpCost: 24,
    projectileSpeed: 760,
    projectileScale: 0.82,
    maxTargets: 4,
    hpDrainRatio: 0,
    requiredJob: PlayerJob.Hermit,
    family: "throwing-star",
    delivery: "projectile",
    transformationRequired: false,
    usesTransformationDamage: false,
  },
  [AttackKind.AbyssRain]: {
    label: "심연 폭우",
    shortcut: "E",
    playerAnimation: "luckySeven",
    hitCount: 3,
    hitIntervalMs: 70,
    releaseDelayMs: 55,
    minDamage: 42,
    maxDamage: 54,
    mpCost: 42,
    projectileSpeed: 820,
    projectileScale: 0.78,
    maxTargets: 4,
    hpDrainRatio: 0,
    requiredJob: PlayerJob.Hermit,
    family: "throwing-star",
    delivery: "projectile",
    transformationRequired: false,
    usesTransformationDamage: false,
  },
  [AttackKind.Rasengan]: {
    label: "나선환",
    shortcut: "V",
    playerAnimation: "luckySeven",
    hitCount: 1,
    hitIntervalMs: 0,
    releaseDelayMs: 80,
    minDamage: 72,
    maxDamage: 90,
    mpCost: 30,
    projectileSpeed: 0,
    projectileScale: 1,
    maxTargets: 1,
    hpDrainRatio: 0,
    requiredJob: PlayerJob.Hokage,
    family: "chakra",
    delivery: "melee",
    transformationRequired: false,
    usesTransformationDamage: false,
  },
  [AttackKind.NineTailsClaw]: {
    label: "구미호 할퀴기",
    shortcut: "CTRL (구미호)",
    playerAnimation: "basicAttack",
    hitCount: 1,
    hitIntervalMs: 0,
    releaseDelayMs: 90,
    minDamage: 55,
    maxDamage: 70,
    mpCost: 0,
    projectileSpeed: 0,
    projectileScale: 1,
    maxTargets: 1,
    hpDrainRatio: 0,
    requiredJob: PlayerJob.Hokage,
    family: "chakra",
    delivery: "melee",
    transformationRequired: true,
    usesTransformationDamage: true,
  },
  [AttackKind.TailedBeastBomb]: {
    label: "미수옥",
    shortcut: "SHIFT (구미호)",
    playerAnimation: "luckySeven",
    hitCount: 1,
    hitIntervalMs: 0,
    releaseDelayMs: 75,
    minDamage: 110,
    maxDamage: 140,
    mpCost: 45,
    projectileSpeed: 640,
    projectileScale: 1,
    maxTargets: 3,
    hpDrainRatio: 0,
    requiredJob: PlayerJob.Hokage,
    family: "chakra",
    delivery: "projectile",
    transformationRequired: true,
    usesTransformationDamage: true,
  },
  [AttackKind.TeamAssault]: {
    label: "삼인 협공",
    shortcut: "N",
    playerAnimation: "luckySeven",
    hitCount: 5,
    hitIntervalMs: 170,
    releaseDelayMs: 520,
    minDamage: 44,
    maxDamage: 56,
    mpCost: 80,
    projectileSpeed: 0,
    projectileScale: 1,
    maxTargets: 1,
    hpDrainRatio: 0,
    requiredJob: PlayerJob.Hokage,
    family: "chakra",
    delivery: "cinematic",
    transformationRequired: false,
    usesTransformationDamage: false,
  },
  [AttackKind.ThunderOrb]: {
    label: "천뢰옥",
    shortcut: "R",
    playerAnimation: "luckySeven",
    hitCount: 2,
    hitIntervalMs: 110,
    releaseDelayMs: 85,
    minDamage: 95,
    maxDamage: 125,
    mpCost: 70,
    projectileSpeed: 700,
    projectileScale: 0.92,
    maxTargets: 5,
    hpDrainRatio: 0,
    requiredJob: PlayerJob.Hokage,
    family: "chakra",
    delivery: "projectile",
    transformationRequired: false,
    usesTransformationDamage: false,
  },
};

const ATTACK_SEQUENCE: readonly AttackKind[] = [
  AttackKind.Basic,
  AttackKind.LuckySeven,
  AttackKind.Drain,
  AttackKind.Avenger,
  AttackKind.Rasengan,
  AttackKind.NineTailsClaw,
  AttackKind.TailedBeastBomb,
  AttackKind.TeamAssault,
  AttackKind.ShadowVolley,
  AttackKind.PhantomStars,
  AttackKind.AbyssRain,
  AttackKind.ThunderOrb,
];

export type AttackBlockReason =
  | "job-required"
  | "not-enough-mp"
  | "transformation-required";

export function attackBlockReason(
  kind: AttackKind,
  character: Pick<PlayerProfile, "job" | "mp">,
  nineTailsTransformationActive = false,
): AttackBlockReason | undefined {
  const definition = ATTACK_DEFINITIONS[kind];
  if (PLAYER_JOB_RANK[character.job] < PLAYER_JOB_RANK[definition.requiredJob]) {
    return "job-required";
  }
  if (definition.transformationRequired && !nineTailsTransformationActive) {
    return "transformation-required";
  }
  if (character.mp < definition.mpCost) {
    return "not-enough-mp";
  }
  return undefined;
}

export function throwingStarStatBonus(stats: PlayerStats): number {
  return Math.max(0, Math.floor((stats.luk * 2 + stats.dex) / 16));
}

export function usesEquippedWeaponPower(kind: AttackKind): boolean {
  return (
    ATTACK_DEFINITIONS[kind].family === "throwing-star" ||
    kind === AttackKind.NineTailsClaw
  );
}

export function attackSpeedMultiplier(kind: AttackKind): number {
  return kind === AttackKind.NineTailsClaw
    ? NINE_TAILS_CLAW_ATTACK_SPEED_MULTIPLIER
    : 1;
}

export function projectileLifetimeMs(skillLevels?: PlayerSkillLevels): number {
  return Math.round(
    BASE_PROJECTILE_LIFETIME_MS * keenSightRangeMultiplier(skillLevels),
  );
}

export function projectileHorizontalReachPx(
  kind: AttackKind,
  skillLevels?: PlayerSkillLevels,
): number {
  const definition = ATTACK_DEFINITIONS[kind];
  if (definition.delivery !== "projectile") return 0;
  const lifetimeMs =
    definition.family === "throwing-star"
      ? projectileLifetimeMs(skillLevels)
      : BASE_PROJECTILE_LIFETIME_MS;
  return (
    PROJECTILE_SPAWN_OFFSET_X +
    (definition.projectileSpeed * lifetimeMs) / 1_000
  );
}

export function meleeAttackRangePx(
  kind: AttackKind,
  skillLevels?: PlayerSkillLevels,
): number {
  return kind === AttackKind.NineTailsClaw
    ? projectileHorizontalReachPx(AttackKind.Basic, skillLevels)
    : DEFAULT_MELEE_RANGE_PX;
}

export function advanceProjectileActiveAgeMs(
  activeAgeMs: number,
  frameDeltaMs: number,
  simulationActive: boolean,
): number {
  const safeAge = Number.isFinite(activeAgeMs)
    ? Math.max(0, activeAgeMs)
    : 0;
  if (!simulationActive) return safeAge;
  const safeDelta = Number.isFinite(frameDeltaMs)
    ? Math.max(0, frameDeltaMs)
    : 0;
  return safeAge + safeDelta;
}

export function criticalThrowRoll(
  kind: AttackKind,
  attackSequence: number,
  hitIndex: number,
): number {
  const safeSequence = Number.isFinite(attackSequence)
    ? Math.abs(Math.trunc(attackSequence))
    : 0;
  const safeHitIndex = Number.isFinite(hitIndex)
    ? Math.abs(Math.trunc(hitIndex))
    : 0;
  const kindOffset = Math.max(0, ATTACK_SEQUENCE.indexOf(kind)) * 13;
  return (safeSequence * 37 + safeHitIndex * 17 + kindOffset) % 100;
}

export function isCriticalThrow(
  kind: AttackKind,
  attackSequence: number,
  hitIndex: number,
  skillLevels?: PlayerSkillLevels,
): boolean {
  if (ATTACK_DEFINITIONS[kind].family !== "throwing-star") {
    return false;
  }
  const chancePercent = Math.round(criticalThrowChance(skillLevels) * 100);
  return (
    chancePercent > 0 &&
    criticalThrowRoll(kind, attackSequence, hitIndex) < chancePercent
  );
}

interface HitDamageResolution {
  damage: number;
  critical: boolean;
}

function resolveHitDamage(
  kind: AttackKind,
  attackSequence: number,
  hitIndex: number,
  stats: PlayerStats,
  skillLevels?: PlayerSkillLevels,
  nineTailsTransformationActive = false,
  combatPower?: Pick<PlayerProfile, "job" | "level">,
): HitDamageResolution {
  const definition = ATTACK_DEFINITIONS[kind];
  const span = definition.maxDamage - definition.minDamage + 1;
  const kindOffset = ATTACK_SEQUENCE.indexOf(kind) * 2;
  const offset = Math.abs(attackSequence * 5 + hitIndex * 3 + kindOffset);
  const baseDamage =
    definition.minDamage +
    (offset % span) +
    (usesEquippedWeaponPower(kind) ? throwingStarStatBonus(stats) : 0) +
    skillDamageBonus(kind, skillLevels);
  const transformedDamage =
    nineTailsTransformationActive && definition.usesTransformationDamage
      ? Math.floor(
          baseDamage * nineTailsTransformationDamageMultiplier(skillLevels),
        )
      : baseDamage;
  const combatPowerDamage = combatPower
    ? Math.floor(
        transformedDamage *
          playerCombatPowerMultiplier(combatPower.job, combatPower.level),
      )
    : transformedDamage;
  const critical = isCriticalThrow(kind, attackSequence, hitIndex, skillLevels);
  return {
    damage: critical
      ? Math.floor(combatPowerDamage * CRITICAL_THROW_DAMAGE_MULTIPLIER)
      : combatPowerDamage,
    critical,
  };
}

export function damageForHit(
  kind: AttackKind,
  attackSequence: number,
  hitIndex: number,
  stats: PlayerStats,
  skillLevels?: PlayerSkillLevels,
  nineTailsTransformationActive = false,
  combatPower?: Pick<PlayerProfile, "job" | "level">,
): number {
  return resolveHitDamage(
    kind,
    attackSequence,
    hitIndex,
    stats,
    skillLevels,
    nineTailsTransformationActive,
    combatPower,
  ).damage;
}

export type AttackResolution =
  | {
      ok: true;
      remainingMp: number;
      projectileLifetimeMs: number;
      hits: Array<{ delayMs: number; damage: number; critical: boolean }>;
    }
  | { ok: false; reason: AttackBlockReason };

export function resolveAttack(
  kind: AttackKind,
  character: Pick<PlayerProfile, "job" | "level" | "mp" | "stats"> &
    Partial<Pick<PlayerProfile, "skillLevels">> & {
      nineTailsTransformationActive?: boolean;
    },
  attackSequence: number,
): AttackResolution {
  const reason = attackBlockReason(
    kind,
    character,
    character.nineTailsTransformationActive,
  );
  if (reason) {
    return { ok: false, reason };
  }

  const definition = ATTACK_DEFINITIONS[kind];
  return {
    ok: true,
    remainingMp: character.mp - definition.mpCost,
    projectileLifetimeMs:
      definition.delivery !== "projectile"
        ? 0
        : definition.family === "throwing-star"
          ? projectileLifetimeMs(character.skillLevels)
          : BASE_PROJECTILE_LIFETIME_MS,
    hits: Array.from({ length: definition.hitCount }, (_, hitIndex) => {
      const hit = resolveHitDamage(
        kind,
        attackSequence,
        hitIndex,
        character.stats,
        character.skillLevels,
        character.nineTailsTransformationActive,
        character,
      );
      return {
        delayMs: Math.round(
          (definition.releaseDelayMs + hitIndex * definition.hitIntervalMs) /
            attackSpeedMultiplier(kind),
        ),
        damage: hit.damage,
        critical: hit.critical,
      };
    }),
  };
}

export interface DrainRecoveryResult {
  hp: number;
  recovered: number;
}

export function drainRecovery(
  kind: AttackKind,
  currentHp: number,
  maxHp: number,
  appliedDamage: number,
): DrainRecoveryResult {
  const ratio = ATTACK_DEFINITIONS[kind].hpDrainRatio;
  const recovered = Math.max(0, Math.floor(Math.max(0, appliedDamage) * ratio));
  const safeMaximum = Math.max(0, maxHp);
  const safeCurrent = Math.min(safeMaximum, Math.max(0, currentHp));
  const hp = Math.min(safeMaximum, safeCurrent + recovered);
  return { hp, recovered: hp - safeCurrent };
}

export interface JobAdvancementDefinition {
  from: PlayerJobType;
  to: PlayerJobType;
  requiredLevel: number;
  unlockedSkills: readonly SkillIdType[];
}

export const JOB_ADVANCEMENTS: readonly JobAdvancementDefinition[] = [
  {
    from: PlayerJob.Beginner,
    to: PlayerJob.Rogue,
    requiredLevel: 10,
    unlockedSkills: [
      SkillId.LuckySeven,
      SkillId.ShadowVolley,
      SkillId.KeenSight,
    ],
  },
  {
    from: PlayerJob.Rogue,
    to: PlayerJob.Assassin,
    requiredLevel: 30,
    unlockedSkills: [
      SkillId.Drain,
      SkillId.PhantomStars,
      SkillId.CriticalThrow,
    ],
  },
  {
    from: PlayerJob.Assassin,
    to: PlayerJob.Hermit,
    requiredLevel: 60,
    unlockedSkills: [
      SkillId.Avenger,
      SkillId.AbyssRain,
      SkillId.ShadowBreathing,
    ],
  },
  {
    from: PlayerJob.Hermit,
    to: PlayerJob.Hokage,
    requiredLevel: 120,
    unlockedSkills: [
      SkillId.Rasengan,
      SkillId.NineTailsTransformation,
      SkillId.TailedBeastBomb,
      SkillId.TeamAssault,
      SkillId.ThunderOrb,
      SkillId.SageMode,
    ],
  },
] as const;

export type JobAdvancementState =
  | {
      status: "eligible" | "level-too-low";
      advancement: JobAdvancementDefinition;
    }
  | { status: "maximum-rank" };

export function jobAdvancementState(
  character: Pick<PlayerProfile, "job" | "level">,
): JobAdvancementState {
  const advancement = JOB_ADVANCEMENTS.find(({ from }) => from === character.job);
  if (!advancement) {
    return { status: "maximum-rank" };
  }
  return {
    status: character.level >= advancement.requiredLevel ? "eligible" : "level-too-low",
    advancement,
  };
}

export function advanceJob(character: PlayerProfile): PlayerProfile {
  const state = jobAdvancementState(character);
  if (state.status !== "eligible") {
    return character;
  }
  return { ...character, job: state.advancement.to };
}

export function unlockedAttacks(job: PlayerJobType): AttackKind[] {
  const rank = PLAYER_JOB_RANK[job];
  return ATTACK_SEQUENCE.filter(
    (kind) => PLAYER_JOB_RANK[ATTACK_DEFINITIONS[kind].requiredJob] <= rank,
  );
}

export function basicAttackKind(
  nineTailsTransformationActive: boolean,
): AttackKind {
  return nineTailsTransformationActive ? AttackKind.NineTailsClaw : AttackKind.Basic;
}

export function shiftAttackKind(
  nineTailsTransformationActive: boolean,
): AttackKind {
  return nineTailsTransformationActive
    ? AttackKind.TailedBeastBomb
    : AttackKind.LuckySeven;
}

export function applyDamage(currentHp: number, damage: number): number {
  return Math.max(0, currentHp - Math.max(0, damage));
}

export function canTakeContactDamage(now: number, invulnerableUntil: number): boolean {
  return now >= invulnerableUntil;
}

export function playerInvulnerabilityAlpha(
  now: number,
  visualStartedAt: number,
  invulnerableUntil: number,
): number {
  if (now >= invulnerableUntil) {
    return 1;
  }
  const elapsed = Math.max(0, now - visualStartedAt);
  const dimmed =
    Math.floor(elapsed / PLAYER_INVULNERABILITY.flashIntervalMs) % 2 === 0;
  return dimmed ? PLAYER_INVULNERABILITY.dimmedAlpha : 1;
}
