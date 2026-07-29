import { describe, expect, it } from "vitest";
import {
  ONE_PUNCH_MAN_UPPER_FLOOR_HIT_EXTENSION_PX,
  canHitMonsterFromUpperFloor,
  canHitMonsterWithForwardMelee,
  damageAfterMonsterDefense,
  forwardMeleeCombatBounds,
  resolveMonsterDamage,
} from "./monster-combat-rules";

describe("monster defense", () => {
  it("reduces damage smoothly without producing zero-damage hits", () => {
    expect(damageAfterMonsterDefense(1_000, 0)).toBe(1_000);
    expect(damageAfterMonsterDefense(1_000, 1_000)).toBe(500);
    expect(damageAfterMonsterDefense(10, 100_000)).toBe(1);
  });

  it("normalizes invalid inputs", () => {
    expect(damageAfterMonsterDefense(0, 100)).toBe(0);
    expect(damageAfterMonsterDefense(Number.NaN, 100)).toBe(0);
    expect(damageAfterMonsterDefense(120.9, -10)).toBe(120);
  });

  it("preserves resolved overkill damage separately from the capped HP loss", () => {
    expect(resolveMonsterDamage(1_000, 1_000, 120)).toEqual({
      resolvedDamage: 500,
      appliedDamage: 120,
      remainingHp: 0,
    });
  });

  it("lets projectiles from the duel-ground upper floor hit One Punch Man", () => {
    const monster = { left: 1_030, right: 1_170, top: 360, bottom: 610 };
    const upperFloorProjectile = {
      left: 1_060,
      right: 1_084,
      top: 244,
      bottom: 261,
    };

    expect(
      canHitMonsterFromUpperFloor(
        "onePunchMan",
        upperFloorProjectile,
        monster,
      ),
    ).toBe(true);
    expect(
      canHitMonsterFromUpperFloor(
        "emberWarden",
        upperFloorProjectile,
        monster,
      ),
    ).toBe(false);
    expect(
      canHitMonsterFromUpperFloor(
        "onePunchMan",
        {
          ...upperFloorProjectile,
          top: monster.top - ONE_PUNCH_MAN_UPPER_FLOOR_HIT_EXTENSION_PX - 18,
          bottom: monster.top - ONE_PUNCH_MAN_UPPER_FLOOR_HIT_EXTENSION_PX - 1,
        },
        monster,
      ),
    ).toBe(false);
    expect(
      canHitMonsterFromUpperFloor(
        "onePunchMan",
        { ...upperFloorProjectile, left: 1_171, right: 1_195 },
        monster,
      ),
    ).toBe(false);
  });

  it("lets a forward melee sweep hit One Punch Man from both duel-ground floors", () => {
    const monster = { left: 1_030, right: 1_170, top: 360, bottom: 610 };

    expect(forwardMeleeCombatBounds(700, 300, 1, 700)).toEqual({
      left: 682,
      right: 1_400,
      top: 232,
      bottom: 268,
    });
    expect(
      canHitMonsterWithForwardMelee(
        "onePunchMan",
        700,
        300,
        1,
        700,
        monster,
      ),
    ).toBe(true);
    expect(
      canHitMonsterWithForwardMelee(
        "onePunchMan",
        700,
        470,
        1,
        700,
        monster,
      ),
    ).toBe(true);
    expect(
      canHitMonsterWithForwardMelee(
        "onePunchMan",
        700,
        300,
        -1,
        700,
        monster,
      ),
    ).toBe(false);
    expect(
      canHitMonsterWithForwardMelee(
        "emberWarden",
        700,
        300,
        1,
        700,
        monster,
      ),
    ).toBe(false);
  });
});
