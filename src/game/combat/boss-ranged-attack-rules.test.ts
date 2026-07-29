import { describe, expect, it } from "vitest";
import {
  BOSS_RANGED_ATTACKS,
  ONE_PUNCH_MAN_PHASE_TWO_ATTACK,
  aimedBossProjectileVelocity,
  bossRangedAttackFor,
  bossProjectileVelocities,
  canUseBossRangedAttack,
  onePunchManPhaseFor,
  resolvedMonsterHitDamage,
} from "./boss-ranged-attack-rules";

describe("boss ranged attack rules", () => {
  it("defines distinct ranged skills for all three dungeon bosses", () => {
    expect(bossRangedAttackFor("greenMushroom")).toBeNull();
    expect(bossRangedAttackFor("emberWarden")).toMatchObject({
      name: "용광로 파편",
      damage: 650,
      projectileTint: 0xff8a35,
    });
    expect(bossRangedAttackFor("eclipseArchivist")).toMatchObject({
      name: "월식 탄환",
      damage: 1_600,
      projectileTint: 0xa56bff,
    });
    expect(bossRangedAttackFor("onePunchMan")).toMatchObject({
      name: "보통 펀치 충격파",
      phase: 1,
      instantDefeatOnHit: true,
      projectileCount: 1,
      projectileVisual: "punchShockwave",
    });
  });

  it("switches One Punch Man to a three-way serious punch at half HP", () => {
    expect(onePunchManPhaseFor(80_000_000, 80_000_000)).toBe(1);
    expect(onePunchManPhaseFor(40_000_001, 80_000_000)).toBe(1);
    expect(onePunchManPhaseFor(40_000_000, 80_000_000)).toBe(2);
    expect(bossRangedAttackFor("onePunchMan", {
      current: 40_000_000,
      maximum: 80_000_000,
    })).toEqual(ONE_PUNCH_MAN_PHASE_TWO_ATTACK);
    expect(ONE_PUNCH_MAN_PHASE_TWO_ATTACK).toMatchObject({
      name: "진심 펀치 삼중 충격파",
      phase: 2,
      projectileCount: 3,
      projectileSpreadDegrees: 24,
      projectileVisual: "punchShockwave",
    });
  });

  it("requires readiness, an idle boss, and both horizontal and vertical range", () => {
    const definition = BOSS_RANGED_ATTACKS.emberWarden;
    const opportunity = {
      alive: true,
      busy: false,
      now: 2_000,
      readyAt: 1_900,
      deltaX: 600,
      deltaY: 180,
    };
    expect(canUseBossRangedAttack(opportunity, definition)).toBe(true);
    expect(
      canUseBossRangedAttack({ ...opportunity, now: 1_899 }, definition),
    ).toBe(false);
    expect(
      canUseBossRangedAttack({ ...opportunity, busy: true }, definition),
    ).toBe(false);
    expect(
      canUseBossRangedAttack({ ...opportunity, deltaX: 681 }, definition),
    ).toBe(false);
    expect(
      canUseBossRangedAttack({ ...opportunity, deltaY: 221 }, definition),
    ).toBe(false);
  });

  it("aims at the player while preserving the configured projectile speed", () => {
    expect(aimedBossProjectileVelocity(3, 4, 500)).toEqual({ x: 300, y: 400 });
    expect(aimedBossProjectileVelocity(0, 0, 500)).toEqual({ x: 0, y: 0 });
    const diagonal = aimedBossProjectileVelocity(-12, 5, 420);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(420, 8);
    expect(diagonal.x).toBeLessThan(0);
    expect(diagonal.y).toBeGreaterThan(0);
  });

  it("fans the phase-two shockwaves evenly around the aimed direction", () => {
    const velocities = bossProjectileVelocities(500, 0, 820, 3, 24);
    expect(velocities).toHaveLength(3);
    expect(velocities[0]!.y).toBeLessThan(0);
    expect(velocities[1]).toMatchObject({ x: 820, y: 0 });
    expect(velocities[2]!.y).toBeGreaterThan(0);
    for (const velocity of velocities) {
      expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(820, 8);
    }
  });

  it("resolves an instant-defeat hit to all current HP", () => {
    expect(resolvedMonsterHitDamage(7_500, 1, true)).toBe(7_500);
    expect(resolvedMonsterHitDamage(7_500, 52, false)).toBe(52);
  });
});
