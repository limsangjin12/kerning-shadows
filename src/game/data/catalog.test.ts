import { describe, expect, it } from "vitest";
import { MONSTER_CATALOG, monsterKnockbackImmune } from "./catalog";

describe("monster catalog progression", () => {
  it("scales hunting-ground monster stats by level tier", () => {
    const ordered = [
      MONSTER_CATALOG.greenMushroom,
      MONSTER_CATALOG.crystalSentinel,
      MONSTER_CATALOG.clockworkSentinel,
      MONSTER_CATALOG.coralGolem,
      MONSTER_CATALOG.emberGolem,
      MONSTER_CATALOG.arcaneGolem,
      MONSTER_CATALOG.emberWarden,
      MONSTER_CATALOG.eclipseArchivist,
      MONSTER_CATALOG.onePunchMan,
    ];

    expect(ordered.map(({ level }) => level)).toEqual([12, 35, 50, 75, 105, 150, 100, 140, 200]);
    expect(ordered.map(({ maxHp }) => maxHp)).toEqual([
      240,
      14_000,
      50_000,
      220_000,
      750_000,
      4_000_000,
      4_000_000,
      20_000_000,
      80_000_000,
    ]);
    expect(ordered.map(({ expReward }) => expReward)).toEqual([
      25,
      110,
      170,
      280,
      420,
      700,
      5_000,
      12_000,
      20_000,
    ]);

    expect(ordered.map(({ defense }) => defense)).toEqual([
      0, 80, 140, 220, 320, 450, 400, 600, 400,
    ]);
    expect(ordered.slice(0, 6).map(({ touchDamage }) => touchDamage)).toEqual([
      18, 90, 150, 280, 450, 850,
    ]);
    expect(MONSTER_CATALOG.onePunchMan.instantDefeatOnHit).toBe(true);
    expect(MONSTER_CATALOG.onePunchMan.knockbackImmune).toBe(true);
    expect(monsterKnockbackImmune("onePunchMan")).toBe(true);
    expect(monsterKnockbackImmune("emberWarden")).toBe(false);
  });

  it("keeps advancement-trial monsters on their canonical tiers", () => {
    expect(MONSTER_CATALOG.shadowSentinel).toMatchObject({
      level: 35, maxHp: 14_000, touchDamage: 90, defense: 80, expReward: 110,
    });
    expect(MONSTER_CATALOG.abyssGolem).toMatchObject({
      level: 70, maxHp: 160_000, touchDamage: 260, defense: 200, expReward: 260,
    });
  });

  it("assigns zombie, animal, and plant families without skipping level tiers", () => {
    expect([
      MONSTER_CATALOG.crystalSentinel,
      MONSTER_CATALOG.clockworkSentinel,
      MONSTER_CATALOG.coralGolem,
      MONSTER_CATALOG.emberGolem,
      MONSTER_CATALOG.arcaneGolem,
    ].map(({ level }) => level)).toEqual([35, 50, 75, 105, 150]);

    expect(new Set([
      MONSTER_CATALOG.clockworkSentinel.spriteSheet,
      MONSTER_CATALOG.crystalSentinel.spriteSheet,
      MONSTER_CATALOG.coralGolem.spriteSheet,
    ])).toEqual(new Set(["plagueZombie", "moonWolf", "ancientTreant"]));
    expect(MONSTER_CATALOG.arcaneGolem.moveSpeed).toBeGreaterThan(
      MONSTER_CATALOG.coralGolem.moveSpeed,
    );
    expect(MONSTER_CATALOG.coralGolem.bodyHeight).toBeGreaterThan(
      MONSTER_CATALOG.arcaneGolem.bodyHeight,
    );
  });

  it("assigns a distinct movement speed to every monster kind", () => {
    const speeds = Object.values(MONSTER_CATALOG).map(({ moveSpeed }) => moveSpeed);

    expect(speeds).toEqual([48, 72, 45, 96, 34, 26, 58, 116, 38, 46, 90]);
    expect(new Set(speeds).size).toBe(speeds.length);
  });
});
