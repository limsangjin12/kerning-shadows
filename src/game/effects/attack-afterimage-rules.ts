import { AttackKind, type AttackKind as AttackKindType } from "../combat/combat-rules";

export interface AttackAfterimageDefinition {
  count: number;
  intervalMs: number;
  lifetimeMs: number;
  offsetPx: number;
  alpha: number;
  tint: number;
}

export const ATTACK_AFTERIMAGE_DEFINITIONS: Record<
  AttackKindType,
  AttackAfterimageDefinition
> = {
  [AttackKind.Basic]: {
    count: 2,
    intervalMs: 38,
    lifetimeMs: 130,
    offsetPx: 7,
    alpha: 0.25,
    tint: 0xb7e8ff,
  },
  [AttackKind.LuckySeven]: {
    count: 3,
    intervalMs: 34,
    lifetimeMs: 150,
    offsetPx: 8,
    alpha: 0.32,
    tint: 0x80eaff,
  },
  [AttackKind.ShadowVolley]: {
    count: 3,
    intervalMs: 28,
    lifetimeMs: 145,
    offsetPx: 8,
    alpha: 0.34,
    tint: 0x70dcff,
  },
  [AttackKind.Drain]: {
    count: 3,
    intervalMs: 34,
    lifetimeMs: 165,
    offsetPx: 9,
    alpha: 0.34,
    tint: 0x7dffb0,
  },
  [AttackKind.PhantomStars]: {
    count: 4,
    intervalMs: 30,
    lifetimeMs: 170,
    offsetPx: 9,
    alpha: 0.37,
    tint: 0xff79c8,
  },
  [AttackKind.Avenger]: {
    count: 4,
    intervalMs: 30,
    lifetimeMs: 180,
    offsetPx: 10,
    alpha: 0.38,
    tint: 0xc795ff,
  },
  [AttackKind.AbyssRain]: {
    count: 5,
    intervalMs: 28,
    lifetimeMs: 195,
    offsetPx: 11,
    alpha: 0.42,
    tint: 0x8e6cff,
  },
  [AttackKind.Rasengan]: {
    count: 4,
    intervalMs: 28,
    lifetimeMs: 185,
    offsetPx: 11,
    alpha: 0.4,
    tint: 0x79f4ff,
  },
  [AttackKind.NineTailsClaw]: {
    count: 4,
    intervalMs: 28,
    lifetimeMs: 190,
    offsetPx: 12,
    alpha: 0.42,
    tint: 0xff8d45,
  },
  [AttackKind.TailedBeastBomb]: {
    count: 4,
    intervalMs: 30,
    lifetimeMs: 200,
    offsetPx: 12,
    alpha: 0.42,
    tint: 0x9d78ff,
  },
  [AttackKind.TeamAssault]: {
    count: 5,
    intervalMs: 34,
    lifetimeMs: 220,
    offsetPx: 14,
    alpha: 0.46,
    tint: 0xffd36b,
  },
  [AttackKind.ThunderOrb]: {
    count: 5,
    intervalMs: 30,
    lifetimeMs: 210,
    offsetPx: 13,
    alpha: 0.44,
    tint: 0xffd45f,
  },
};

export function attackAfterimageDelayMs(
  definition: AttackAfterimageDefinition,
  index: number,
): number {
  return definition.intervalMs * (Math.max(0, Math.floor(index)) + 1);
}

export function attackAfterimageX(
  playerX: number,
  facingDirection: -1 | 1,
  definition: AttackAfterimageDefinition,
  index: number,
): number {
  return (
    playerX -
    facingDirection * definition.offsetPx * (Math.max(0, Math.floor(index)) + 1)
  );
}
