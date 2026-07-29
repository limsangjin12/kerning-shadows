import { AttackKind, type AttackKind as AttackKindType } from "../combat/combat-rules";

export interface SkillSpectacleDefinition {
  advancementTier: 0 | 1 | 2 | 3 | 4;
  castRingCount: number;
  impactRingCount: number;
  impactRayCount: number;
  shakeDurationMs: number;
  shakeIntensity: number;
}

const SPECTACLE_BY_TIER: Record<
  SkillSpectacleDefinition["advancementTier"],
  SkillSpectacleDefinition
> = {
  0: {
    advancementTier: 0,
    castRingCount: 0,
    impactRingCount: 0,
    impactRayCount: 0,
    shakeDurationMs: 0,
    shakeIntensity: 0,
  },
  1: {
    advancementTier: 1,
    castRingCount: 0,
    impactRingCount: 0,
    impactRayCount: 0,
    shakeDurationMs: 0,
    shakeIntensity: 0,
  },
  2: {
    advancementTier: 2,
    castRingCount: 1,
    impactRingCount: 1,
    impactRayCount: 0,
    shakeDurationMs: 0,
    shakeIntensity: 0,
  },
  3: {
    advancementTier: 3,
    castRingCount: 2,
    impactRingCount: 2,
    impactRayCount: 4,
    shakeDurationMs: 90,
    shakeIntensity: 0.0016,
  },
  4: {
    advancementTier: 4,
    castRingCount: 3,
    impactRingCount: 3,
    impactRayCount: 8,
    shakeDurationMs: 150,
    shakeIntensity: 0.0026,
  },
};

export function skillSpectacleDefinition(
  kind: AttackKindType,
): SkillSpectacleDefinition {
  return SPECTACLE_BY_TIER[attackAdvancementTier(kind)];
}

export function attackAdvancementTier(
  kind: AttackKindType,
): SkillSpectacleDefinition["advancementTier"] {
  switch (kind) {
    case AttackKind.LuckySeven:
    case AttackKind.ShadowVolley:
      return 1;
    case AttackKind.Drain:
    case AttackKind.PhantomStars:
      return 2;
    case AttackKind.Avenger:
    case AttackKind.AbyssRain:
      return 3;
    case AttackKind.Rasengan:
    case AttackKind.NineTailsClaw:
    case AttackKind.TailedBeastBomb:
    case AttackKind.TeamAssault:
    case AttackKind.ThunderOrb:
      return 4;
    default:
      return 0;
  }
}
