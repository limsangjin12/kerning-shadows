import type { MonsterKind } from "../data/catalog";

const DEFENSE_SCALE = 1_000;

export const ONE_PUNCH_MAN_UPPER_FLOOR_HIT_EXTENSION_PX = 132;

export interface CombatBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface MonsterDamageResolution {
  resolvedDamage: number;
  appliedDamage: number;
  remainingHp: number;
}

export function damageAfterMonsterDefense(
  rawDamage: number,
  defense: number,
): number {
  if (!Number.isFinite(rawDamage) || rawDamage <= 0) return 0;
  const safeDamage = Math.max(1, Math.floor(rawDamage));
  const safeDefense = Number.isFinite(defense)
    ? Math.max(0, Math.floor(defense))
    : 0;
  return Math.max(
    1,
    Math.floor((safeDamage * DEFENSE_SCALE) / (DEFENSE_SCALE + safeDefense)),
  );
}

export function resolveMonsterDamage(
  rawDamage: number,
  defense: number,
  currentHp: number,
): MonsterDamageResolution {
  const resolvedDamage = damageAfterMonsterDefense(rawDamage, defense);
  const remainingHp = Math.max(0, currentHp - resolvedDamage);
  return {
    resolvedDamage,
    appliedDamage: currentHp - remainingHp,
    remainingHp,
  };
}

export function canHitMonsterFromUpperFloor(
  monsterKind: MonsterKind,
  projectile: CombatBounds,
  monster: CombatBounds,
): boolean {
  if (monsterKind !== "onePunchMan") return false;

  const horizontalOverlap =
    projectile.right >= monster.left && projectile.left <= monster.right;
  const insideUpperHitExtension =
    projectile.bottom >=
      monster.top - ONE_PUNCH_MAN_UPPER_FLOOR_HIT_EXTENSION_PX &&
    projectile.top <= monster.top;
  return horizontalOverlap && insideUpperHitExtension;
}

export function forwardMeleeCombatBounds(
  playerX: number,
  playerY: number,
  direction: number,
  horizontalRange: number,
): CombatBounds {
  const facing = direction < 0 ? -1 : 1;
  const safeRange = Math.max(0, horizontalRange);
  const attackCenterY = playerY - 50;
  return {
    left: facing < 0 ? playerX - safeRange : playerX - 18,
    right: facing < 0 ? playerX + 18 : playerX + safeRange,
    top: attackCenterY - 18,
    bottom: attackCenterY + 18,
  };
}

export function combatBoundsOverlap(
  attack: CombatBounds,
  monster: CombatBounds,
): boolean {
  return (
    attack.right >= monster.left &&
    attack.left <= monster.right &&
    attack.bottom >= monster.top &&
    attack.top <= monster.bottom
  );
}

export function canHitMonsterWithForwardMelee(
  monsterKind: MonsterKind,
  playerX: number,
  playerY: number,
  direction: number,
  horizontalRange: number,
  monster: CombatBounds,
): boolean {
  const attack = forwardMeleeCombatBounds(
    playerX,
    playerY,
    direction,
    horizontalRange,
  );
  return (
    combatBoundsOverlap(attack, monster) ||
    canHitMonsterFromUpperFloor(monsterKind, attack, monster)
  );
}
