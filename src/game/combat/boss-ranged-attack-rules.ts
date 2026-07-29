import type { MonsterKind } from "../data/catalog";

export const BossRangedSkillId = {
  FurnaceShard: "furnaceShard",
  EclipseBolt: "eclipseBolt",
  NormalPunchShockwave: "normalPunchShockwave",
  SeriousPunchShockwave: "seriousPunchShockwave",
} as const;

export type BossRangedSkillId =
  (typeof BossRangedSkillId)[keyof typeof BossRangedSkillId];

export interface BossRangedAttackDefinition {
  id: BossRangedSkillId;
  monsterKind: "emberWarden" | "eclipseArchivist" | "onePunchMan";
  name: string;
  phase: 1 | 2;
  damage: number;
  instantDefeatOnHit: boolean;
  range: number;
  verticalRange: number;
  initialDelayMs: number;
  cooldownMs: number;
  windupMs: number;
  projectileSpeed: number;
  projectileLifetimeMs: number;
  projectileScale: number;
  projectileCount: number;
  projectileSpreadDegrees: number;
  projectileVisual: "throwingStar" | "punchShockwave";
  spawnOffsetX: number;
  spawnOffsetY: number;
  projectileTint: number;
  impactTint: number;
}

export const BOSS_RANGED_ATTACKS: Readonly<
  Record<BossRangedAttackDefinition["monsterKind"], BossRangedAttackDefinition>
> = {
  emberWarden: {
    id: BossRangedSkillId.FurnaceShard,
    monsterKind: "emberWarden",
    name: "용광로 파편",
    phase: 1,
    damage: 650,
    instantDefeatOnHit: false,
    range: 680,
    verticalRange: 220,
    initialDelayMs: 1_200,
    cooldownMs: 2_600,
    windupMs: 440,
    projectileSpeed: 340,
    projectileLifetimeMs: 2_400,
    projectileScale: 0.64,
    projectileCount: 1,
    projectileSpreadDegrees: 0,
    projectileVisual: "throwingStar",
    spawnOffsetX: 58,
    spawnOffsetY: 66,
    projectileTint: 0xff8a35,
    impactTint: 0xffc064,
  },
  eclipseArchivist: {
    id: BossRangedSkillId.EclipseBolt,
    monsterKind: "eclipseArchivist",
    name: "월식 탄환",
    phase: 1,
    damage: 1_600,
    instantDefeatOnHit: false,
    range: 820,
    verticalRange: 280,
    initialDelayMs: 900,
    cooldownMs: 1_900,
    windupMs: 360,
    projectileSpeed: 420,
    projectileLifetimeMs: 2_400,
    projectileScale: 0.78,
    projectileCount: 1,
    projectileSpreadDegrees: 0,
    projectileVisual: "throwingStar",
    spawnOffsetX: 58,
    spawnOffsetY: 66,
    projectileTint: 0xa56bff,
    impactTint: 0xd1a7ff,
  },
  onePunchMan: {
    id: BossRangedSkillId.NormalPunchShockwave,
    monsterKind: "onePunchMan",
    name: "보통 펀치 충격파",
    phase: 1,
    damage: 1,
    instantDefeatOnHit: true,
    range: 1_200,
    verticalRange: 360,
    initialDelayMs: 700,
    cooldownMs: 1_650,
    windupMs: 420,
    projectileSpeed: 760,
    projectileLifetimeMs: 2_200,
    projectileScale: 1,
    projectileCount: 1,
    projectileSpreadDegrees: 0,
    projectileVisual: "punchShockwave",
    spawnOffsetX: 138,
    spawnOffsetY: 132,
    projectileTint: 0xc8f7ff,
    impactTint: 0x8deaff,
  },
};

export const ONE_PUNCH_MAN_PHASE_TWO_THRESHOLD = 0.5;

export const ONE_PUNCH_MAN_PHASE_TWO_ATTACK: BossRangedAttackDefinition = {
  id: BossRangedSkillId.SeriousPunchShockwave,
  monsterKind: "onePunchMan",
  name: "진심 펀치 삼중 충격파",
  phase: 2,
  damage: 1,
  instantDefeatOnHit: true,
  range: 1_200,
  verticalRange: 420,
  initialDelayMs: 450,
  cooldownMs: 1_350,
  windupMs: 360,
  projectileSpeed: 820,
  projectileLifetimeMs: 2_200,
  projectileScale: 1.12,
  projectileCount: 3,
  projectileSpreadDegrees: 24,
  projectileVisual: "punchShockwave",
  spawnOffsetX: 138,
  spawnOffsetY: 132,
  projectileTint: 0xffe08a,
  impactTint: 0xffbf47,
};

export interface BossHealthState {
  current: number;
  maximum: number;
}

export function onePunchManPhaseFor(
  currentHp: number,
  maximumHp: number,
): 1 | 2 {
  const safeMaximum = Number.isFinite(maximumHp) && maximumHp > 0
    ? maximumHp
    : 1;
  const safeCurrent = Number.isFinite(currentHp)
    ? Math.max(0, currentHp)
    : safeMaximum;
  return safeCurrent / safeMaximum <= ONE_PUNCH_MAN_PHASE_TWO_THRESHOLD ? 2 : 1;
}

export function bossRangedAttackFor(
  monsterKind: MonsterKind,
  health?: BossHealthState,
): BossRangedAttackDefinition | null {
  if (monsterKind === "onePunchMan") {
    return health && onePunchManPhaseFor(health.current, health.maximum) === 2
      ? ONE_PUNCH_MAN_PHASE_TWO_ATTACK
      : BOSS_RANGED_ATTACKS.onePunchMan;
  }
  return monsterKind === "emberWarden" || monsterKind === "eclipseArchivist"
    ? BOSS_RANGED_ATTACKS[monsterKind]
    : null;
}

export interface BossRangedAttackOpportunity {
  alive: boolean;
  busy: boolean;
  now: number;
  readyAt: number;
  deltaX: number;
  deltaY: number;
}

export function canUseBossRangedAttack(
  opportunity: BossRangedAttackOpportunity,
  definition: BossRangedAttackDefinition,
): boolean {
  return (
    opportunity.alive &&
    !opportunity.busy &&
    opportunity.now >= opportunity.readyAt &&
    Math.abs(opportunity.deltaX) <= definition.range &&
    Math.abs(opportunity.deltaY) <= definition.verticalRange
  );
}

export interface ProjectileVelocity {
  x: number;
  y: number;
}

export function aimedBossProjectileVelocity(
  deltaX: number,
  deltaY: number,
  speed: number,
): ProjectileVelocity {
  const safeSpeed = Math.max(0, speed);
  const distance = Math.hypot(deltaX, deltaY);
  if (distance === 0 || safeSpeed === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: (deltaX / distance) * safeSpeed,
    y: (deltaY / distance) * safeSpeed,
  };
}

export function bossProjectileVelocities(
  deltaX: number,
  deltaY: number,
  speed: number,
  count: number,
  spreadDegrees: number,
): ProjectileVelocity[] {
  const safeCount = Math.max(1, Math.floor(count));
  const aimed = aimedBossProjectileVelocity(deltaX, deltaY, speed);
  if (safeCount === 1 || spreadDegrees === 0 || (aimed.x === 0 && aimed.y === 0)) {
    return [aimed];
  }

  const baseAngle = Math.atan2(aimed.y, aimed.x);
  const spreadRadians = degreesToRadians(Math.abs(spreadDegrees));
  return Array.from({ length: safeCount }, (_, index) => {
    const ratio = index / (safeCount - 1) - 0.5;
    const angle = baseAngle + ratio * spreadRadians;
    return {
      x: Math.cos(angle) * Math.max(0, speed),
      y: Math.sin(angle) * Math.max(0, speed),
    };
  });
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function resolvedMonsterHitDamage(
  currentHp: number,
  configuredDamage: number,
  instantDefeatOnHit: boolean,
): number {
  return instantDefeatOnHit
    ? Math.max(0, currentHp)
    : Math.max(0, configuredDamage);
}
