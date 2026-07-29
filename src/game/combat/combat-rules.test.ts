import { describe, expect, it } from "vitest";
import { spriteManifest } from "../assets/runtime-assets";
import { DEFAULT_PLAYER_PROFILE, PlayerJob } from "../data/catalog";
import {
  THROWING_STAR_TIERS,
  applyThrowingStarDamage,
} from "../equipment/throwing-star-rules";
import {
  ATTACK_DEFINITIONS,
  AttackKind,
  BASE_PROJECTILE_LIFETIME_MS,
  JOB_ADVANCEMENTS,
  PLAYER_JOB_COMBAT_POWER_MULTIPLIERS,
  PLAYER_INVULNERABILITY,
  advanceJob,
  applyDamage,
  attackBlockReason,
  attackSpeedMultiplier,
  advanceProjectileActiveAgeMs,
  basicAttackKind,
  canTakeContactDamage,
  criticalThrowRoll,
  damageForHit,
  drainRecovery,
  isCriticalThrow,
  jobAdvancementState,
  playerInvulnerabilityAlpha,
  playerCombatPowerMultiplier,
  playerLevelCombatPowerMultiplier,
  meleeAttackRangePx,
  projectileHorizontalReachPx,
  projectileLifetimeMs,
  resolveAttack,
  shiftAttackKind,
  throwingStarStatBonus,
  unlockedAttacks,
  usesEquippedWeaponPower,
} from "./combat-rules";

describe("combat rules", () => {
  it("advances through Rogue, Assassin, Hermit, and Hokage at the configured levels", () => {
    let character = {
      ...DEFAULT_PLAYER_PROFILE,
      level: 10,
      stats: { ...DEFAULT_PLAYER_PROFILE.stats },
    };

    expect(jobAdvancementState({ ...character, level: 9 })).toMatchObject({
      status: "level-too-low",
      advancement: { to: PlayerJob.Rogue, requiredLevel: 10 },
    });
    character = advanceJob(character);
    expect(character.job).toBe(PlayerJob.Rogue);

    expect(jobAdvancementState({ ...character, level: 29 })).toMatchObject({
      status: "level-too-low",
      advancement: { to: PlayerJob.Assassin, requiredLevel: 30 },
    });
    character = advanceJob({ ...character, level: 30 });
    expect(character.job).toBe(PlayerJob.Assassin);

    expect(jobAdvancementState({ ...character, level: 59 })).toMatchObject({
      status: "level-too-low",
      advancement: { to: PlayerJob.Hermit, requiredLevel: 60 },
    });
    character = advanceJob({ ...character, level: 60 });
    expect(character.job).toBe(PlayerJob.Hermit);
    expect(jobAdvancementState({ ...character, level: 119 })).toMatchObject({
      status: "level-too-low",
      advancement: { to: PlayerJob.Hokage, requiredLevel: 120 },
    });
    character = advanceJob({ ...character, level: 120 });
    expect(character.job).toBe(PlayerJob.Hokage);
    expect(jobAdvancementState(character)).toEqual({ status: "maximum-rank" });
    expect(JOB_ADVANCEMENTS.map(({ requiredLevel }) => requiredLevel)).toEqual([
      10, 30, 60, 120,
    ]);
    expect(JOB_ADVANCEMENTS.at(-1)?.unlockedSkills).toEqual([
      "rasengan",
      "nineTailsTransformation",
      "tailedBeastBomb",
      "teamAssault",
      "thunderOrb",
      "sageMode",
    ]);
  });

  it("blocks each throwing-star skill until its job rank and enough MP", () => {
    const beginner = DEFAULT_PLAYER_PROFILE;
    expect(attackBlockReason(AttackKind.LuckySeven, beginner)).toBe("job-required");
    expect(
      attackBlockReason(AttackKind.Drain, { job: PlayerJob.Rogue, mp: 99 }),
    ).toBe("job-required");
    expect(
      attackBlockReason(AttackKind.Avenger, { job: PlayerJob.Assassin, mp: 99 }),
    ).toBe("job-required");
    expect(
      attackBlockReason(AttackKind.Avenger, { job: PlayerJob.Hermit, mp: 0 }),
    ).toBe("not-enough-mp");
    expect(
      attackBlockReason(AttackKind.TailedBeastBomb, {
        job: PlayerJob.Hokage,
        mp: 99,
      }),
    ).toBe("transformation-required");
    expect(
      attackBlockReason(AttackKind.TeamAssault, {
        job: PlayerJob.Hermit,
        mp: 100,
      }),
    ).toBe("job-required");
    expect(
      attackBlockReason(AttackKind.TeamAssault, {
        job: PlayerJob.Hokage,
        mp: 79,
      }),
    ).toBe("not-enough-mp");
    expect(
      attackBlockReason(AttackKind.ThunderOrb, {
        job: PlayerJob.Hermit,
        mp: 100,
      }),
    ).toBe("job-required");
  });

  it("resolves the configured hit count, MP cost, and animation-safe release times", () => {
    const jobs = {
      [AttackKind.Basic]: PlayerJob.Beginner,
      [AttackKind.LuckySeven]: PlayerJob.Rogue,
      [AttackKind.ShadowVolley]: PlayerJob.Rogue,
      [AttackKind.Drain]: PlayerJob.Assassin,
      [AttackKind.PhantomStars]: PlayerJob.Assassin,
      [AttackKind.Avenger]: PlayerJob.Hermit,
      [AttackKind.AbyssRain]: PlayerJob.Hermit,
      [AttackKind.Rasengan]: PlayerJob.Hokage,
      [AttackKind.NineTailsClaw]: PlayerJob.Hokage,
      [AttackKind.TailedBeastBomb]: PlayerJob.Hokage,
      [AttackKind.TeamAssault]: PlayerJob.Hokage,
      [AttackKind.ThunderOrb]: PlayerJob.Hokage,
    } as const;
    const levels = {
      [AttackKind.Basic]: 10,
      [AttackKind.LuckySeven]: 10,
      [AttackKind.ShadowVolley]: 10,
      [AttackKind.Drain]: 30,
      [AttackKind.PhantomStars]: 30,
      [AttackKind.Avenger]: 60,
      [AttackKind.AbyssRain]: 60,
      [AttackKind.Rasengan]: 120,
      [AttackKind.NineTailsClaw]: 120,
      [AttackKind.TailedBeastBomb]: 120,
      [AttackKind.TeamAssault]: 120,
      [AttackKind.ThunderOrb]: 120,
    } as const;

    for (const kind of Object.values(AttackKind)) {
      const definition = ATTACK_DEFINITIONS[kind];
      const resolution = resolveAttack(
        kind,
        {
          job: jobs[kind],
          level: levels[kind],
          mp: 100,
          stats: DEFAULT_PLAYER_PROFILE.stats,
          nineTailsTransformationActive: true,
        },
        0,
      );
      expect(resolution).toMatchObject({
        ok: true,
        remainingMp: 100 - definition.mpCost,
      });
      if (!resolution.ok) throw new Error(`${kind} should resolve`);
      expect(resolution.hits).toHaveLength(definition.hitCount);

      const animation =
        spriteManifest.sheets.player?.animations[definition.playerAnimation];
      if (!animation) throw new Error(`missing ${definition.playerAnimation}`);
      const animationDurationMs =
        animation.frames.length * animation.frameDurationMs;
      const finalHitDelay = Math.max(
        ...resolution.hits.map(({ delayMs }) => delayMs),
      );
      if (kind === AttackKind.TeamAssault) {
        expect(finalHitDelay).toBe(1_200);
      } else {
        expect(finalHitDelay).toBeLessThan(animationDurationMs);
      }
    }

    expect(ATTACK_DEFINITIONS[AttackKind.LuckySeven]).toMatchObject({
      hitCount: 2,
      mpCost: 12,
    });
    expect(ATTACK_DEFINITIONS[AttackKind.ShadowVolley]).toMatchObject({
      hitCount: 3,
      mpCost: 16,
      maxTargets: 1,
    });
    expect(ATTACK_DEFINITIONS[AttackKind.Drain]).toMatchObject({
      hpDrainRatio: 0.45,
      maxTargets: 1,
    });
    expect(ATTACK_DEFINITIONS[AttackKind.PhantomStars]).toMatchObject({
      hitCount: 2,
      mpCost: 24,
      maxTargets: 2,
    });
    expect(ATTACK_DEFINITIONS[AttackKind.Avenger]).toMatchObject({
      maxTargets: 4,
    });
    expect(ATTACK_DEFINITIONS[AttackKind.AbyssRain]).toMatchObject({
      shortcut: "E",
      hitCount: 3,
      mpCost: 42,
      maxTargets: 4,
    });
    expect(ATTACK_DEFINITIONS[AttackKind.Rasengan]).toMatchObject({
      family: "chakra",
      delivery: "melee",
      mpCost: 30,
      minDamage: 72,
      maxDamage: 90,
      maxTargets: 1,
    });
    expect(ATTACK_DEFINITIONS[AttackKind.NineTailsClaw]).toMatchObject({
      family: "chakra",
      delivery: "melee",
      minDamage: 55,
      maxDamage: 70,
      transformationRequired: true,
    });
    expect(ATTACK_DEFINITIONS[AttackKind.TailedBeastBomb]).toMatchObject({
      family: "chakra",
      delivery: "projectile",
      mpCost: 45,
      minDamage: 110,
      maxDamage: 140,
      maxTargets: 3,
      transformationRequired: true,
    });
    expect(ATTACK_DEFINITIONS[AttackKind.TeamAssault]).toMatchObject({
      family: "chakra",
      delivery: "cinematic",
      shortcut: "N",
      hitCount: 5,
      hitIntervalMs: 170,
      releaseDelayMs: 520,
      mpCost: 80,
      minDamage: 44,
      maxDamage: 56,
      maxTargets: 1,
      transformationRequired: false,
    });
    expect(ATTACK_DEFINITIONS[AttackKind.ThunderOrb]).toMatchObject({
      family: "chakra",
      delivery: "projectile",
      shortcut: "R",
      hitCount: 2,
      mpCost: 70,
      minDamage: 95,
      maxDamage: 125,
      maxTargets: 5,
      transformationRequired: false,
    });
  });

  it("adds the LUK/DEX weapon bonus to throwing stars and the transformed claw", () => {
    const bonus = throwingStarStatBonus(DEFAULT_PLAYER_PROFILE.stats);
    expect(bonus).toBeGreaterThan(0);
    for (const kind of Object.values(AttackKind)) {
      const definition = ATTACK_DEFINITIONS[kind];
      const first = damageForHit(kind, 7, 0, DEFAULT_PLAYER_PROFILE.stats);
      expect(first).toBe(
        damageForHit(kind, 7, 0, DEFAULT_PLAYER_PROFILE.stats),
      );
      const familyBonus = usesEquippedWeaponPower(kind) ? bonus : 0;
      expect(first).toBeGreaterThanOrEqual(definition.minDamage + familyBonus);
      expect(first).toBeLessThanOrEqual(definition.maxDamage + familyBonus);
    }
  });

  it("adds the allocated skill level bonus without changing basic attacks", () => {
    const levels = {
      ...DEFAULT_PLAYER_PROFILE.skillLevels,
      luckySeven: 5,
      shadowVolley: 2,
      drain: 4,
      phantomStars: 3,
      avenger: 3,
      abyssRain: 2,
      teamAssault: 4,
      thunderOrb: 2,
    };
    const baseLuckySeven = damageForHit(
      AttackKind.LuckySeven,
      2,
      0,
      DEFAULT_PLAYER_PROFILE.stats,
    );
    expect(
      damageForHit(
        AttackKind.LuckySeven,
        2,
        0,
        DEFAULT_PLAYER_PROFILE.stats,
        levels,
      ),
    ).toBe(baseLuckySeven + 5);
    expect(
      damageForHit(
        AttackKind.ShadowVolley,
        2,
        0,
        DEFAULT_PLAYER_PROFILE.stats,
        levels,
      ),
    ).toBe(
      damageForHit(
        AttackKind.ShadowVolley,
        2,
        0,
        DEFAULT_PLAYER_PROFILE.stats,
      ) + 2,
    );
    expect(
      damageForHit(
        AttackKind.Drain,
        2,
        0,
        DEFAULT_PLAYER_PROFILE.stats,
        levels,
      ),
    ).toBe(
      damageForHit(AttackKind.Drain, 2, 0, DEFAULT_PLAYER_PROFILE.stats) + 8,
    );
    expect(
      damageForHit(
        AttackKind.Basic,
        2,
        0,
        DEFAULT_PLAYER_PROFILE.stats,
        levels,
      ),
    ).toBe(damageForHit(AttackKind.Basic, 2, 0, DEFAULT_PLAYER_PROFILE.stats));
    expect(
      damageForHit(
        AttackKind.TeamAssault,
        2,
        0,
        DEFAULT_PLAYER_PROFILE.stats,
        levels,
      ),
    ).toBe(
      damageForHit(
        AttackKind.TeamAssault,
        2,
        0,
        DEFAULT_PLAYER_PROFILE.stats,
      ) + 8,
    );
  });

  it("extends every throwing-star projectile lifetime with Keen Sight", () => {
    const masteredKeenSight = {
      ...DEFAULT_PLAYER_PROFILE.skillLevels,
      keenSight: 20,
    };

    expect(projectileLifetimeMs(DEFAULT_PLAYER_PROFILE.skillLevels)).toBe(
      BASE_PROJECTILE_LIFETIME_MS,
    );
    expect(projectileLifetimeMs(masteredKeenSight)).toBe(1_260);

    const resolution = resolveAttack(
      AttackKind.Basic,
      {
        job: PlayerJob.Hermit,
        level: 60,
        mp: 100,
        stats: DEFAULT_PLAYER_PROFILE.stats,
        skillLevels: masteredKeenSight,
      },
      0,
    );
    expect(resolution).toMatchObject({
      ok: true,
      projectileLifetimeMs: 1_260,
    });

    expect(
      resolveAttack(
        AttackKind.TailedBeastBomb,
        {
          job: PlayerJob.Hokage,
          level: 120,
          mp: 100,
          stats: DEFAULT_PLAYER_PROFILE.stats,
          skillLevels: masteredKeenSight,
          nineTailsTransformationActive: true,
        },
        0,
      ),
    ).toMatchObject({ ok: true, projectileLifetimeMs: BASE_PROJECTILE_LIFETIME_MS });
  });

  it("applies deterministic Critical Throw rolls and a floored 150% total damage", () => {
    const masteredCriticalThrow = {
      ...DEFAULT_PLAYER_PROFILE.skillLevels,
      criticalThrow: 20,
    };
    const criticalCount = Array.from({ length: 100 }, (_, attackSequence) =>
      isCriticalThrow(
        AttackKind.Basic,
        attackSequence,
        0,
        masteredCriticalThrow,
      ),
    ).filter(Boolean).length;

    expect(criticalThrowRoll(AttackKind.Basic, 0, 0)).toBe(0);
    expect(criticalThrowRoll(AttackKind.Drain, 0, 0)).toBe(26);
    expect(criticalCount).toBe(20);
    expect(
      isCriticalThrow(
        AttackKind.Basic,
        0,
        0,
        DEFAULT_PLAYER_PROFILE.skillLevels,
      ),
    ).toBe(false);
    expect(
      isCriticalThrow(
        AttackKind.TailedBeastBomb,
        0,
        0,
        masteredCriticalThrow,
      ),
    ).toBe(false);

    const normalDamage = damageForHit(
      AttackKind.Basic,
      0,
      0,
      DEFAULT_PLAYER_PROFILE.stats,
    );
    expect(
      damageForHit(
        AttackKind.Basic,
        0,
        0,
        DEFAULT_PLAYER_PROFILE.stats,
        masteredCriticalThrow,
      ),
    ).toBe(Math.floor(normalDamage * 1.5));

    const resolution = resolveAttack(
      AttackKind.Basic,
      {
        job: PlayerJob.Hermit,
        level: 60,
        mp: 100,
        stats: DEFAULT_PLAYER_PROFILE.stats,
        skillLevels: masteredCriticalThrow,
      },
      0,
    );
    const scaledCriticalDamage = damageForHit(
      AttackKind.Basic,
      0,
      0,
      DEFAULT_PLAYER_PROFILE.stats,
      masteredCriticalThrow,
      false,
      { job: PlayerJob.Hermit, level: 60 },
    );
    expect(resolution).toMatchObject({
      ok: true,
      hits: [{ critical: true, damage: scaledCriticalDamage }],
    });
  });

  it("multiplies combat power sharply by job rank and reaches six-digit damage at level 120", () => {
    expect(PLAYER_JOB_COMBAT_POWER_MULTIPLIERS).toEqual({
      beginner: 1,
      rogue: 12,
      assassin: 70,
      hermit: 350,
      hokage: 1_400,
    });
    expect(playerLevelCombatPowerMultiplier(10)).toBe(1);
    expect(playerLevelCombatPowerMultiplier(120)).toBe(3);
    expect(playerCombatPowerMultiplier(PlayerJob.Hermit, 120)).toBe(1_050);
    expect(playerCombatPowerMultiplier(PlayerJob.Hokage, 120)).toBe(4_200);

    const level120Stats = { str: 4, dex: 135, int: 4, luk: 477 };
    const masteredSkills = {
      ...DEFAULT_PLAYER_PROFILE.skillLevels,
      avenger: 20,
      rasengan: 20,
    };
    const hermitAttack = resolveAttack(
      AttackKind.Avenger,
      {
        job: PlayerJob.Hermit,
        level: 120,
        mp: 1_000,
        stats: level120Stats,
        skillLevels: masteredSkills,
      },
      0,
    );
    const hokageAttack = resolveAttack(
      AttackKind.Rasengan,
      {
        job: PlayerJob.Hokage,
        level: 120,
        mp: 1_000,
        stats: level120Stats,
        skillLevels: masteredSkills,
      },
      0,
    );
    expect(hermitAttack.ok && hermitAttack.hits[0]?.damage).toBeGreaterThanOrEqual(
      100_000,
    );
    expect(hokageAttack.ok && hokageAttack.hits[0]?.damage).toBeGreaterThanOrEqual(
      500_000,
    );
  });

  it("unlocks earlier skills and caps Drain recovery at maximum HP", () => {
    expect(unlockedAttacks(PlayerJob.Beginner)).toEqual([AttackKind.Basic]);
    expect(unlockedAttacks(PlayerJob.Assassin)).toEqual([
      AttackKind.Basic,
      AttackKind.LuckySeven,
      AttackKind.Drain,
      AttackKind.ShadowVolley,
      AttackKind.PhantomStars,
    ]);
    expect(unlockedAttacks(PlayerJob.Hokage)).toEqual([
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
    ]);
    expect(drainRecovery(AttackKind.Drain, 50, 100, 40)).toEqual({
      hp: 68,
      recovered: 18,
    });
    expect(drainRecovery(AttackKind.Drain, 95, 100, 40)).toEqual({
      hp: 100,
      recovered: 5,
    });
    expect(drainRecovery(AttackKind.LuckySeven, 50, 100, 40)).toEqual({
      hp: 50,
      recovered: 0,
    });
    expect(drainRecovery(AttackKind.Drain, 110, 100, 40)).toEqual({
      hp: 100,
      recovered: 0,
    });
  });

  it("switches transformed basic and Shift attacks and applies only chakra transformation damage", () => {
    expect(basicAttackKind(false)).toBe(AttackKind.Basic);
    expect(basicAttackKind(true)).toBe(AttackKind.NineTailsClaw);
    expect(shiftAttackKind(false)).toBe(AttackKind.LuckySeven);
    expect(shiftAttackKind(true)).toBe(AttackKind.TailedBeastBomb);

    const masteredTransformation = {
      ...DEFAULT_PLAYER_PROFILE.skillLevels,
      nineTailsTransformation: 20,
    };
    const clawBase = damageForHit(
      AttackKind.NineTailsClaw,
      0,
      0,
      DEFAULT_PLAYER_PROFILE.stats,
      masteredTransformation,
    );
    expect(
      damageForHit(
        AttackKind.NineTailsClaw,
        0,
        0,
        DEFAULT_PLAYER_PROFILE.stats,
        masteredTransformation,
        true,
      ),
    ).toBe(Math.floor(clawBase * 1.5));

    const throwingBase = damageForHit(
      AttackKind.Basic,
      0,
      0,
      DEFAULT_PLAYER_PROFILE.stats,
      masteredTransformation,
    );
    expect(
      damageForHit(
        AttackKind.Basic,
        0,
        0,
        DEFAULT_PLAYER_PROFILE.stats,
        masteredTransformation,
        true,
      ),
    ).toBe(throwingBase);
  });

  it("makes the transformed claw twice as fast and stronger than the equipped basic attack", () => {
    const skillLevels = {
      ...DEFAULT_PLAYER_PROFILE.skillLevels,
      nineTailsTransformation: 20,
    };
    const character = {
      ...DEFAULT_PLAYER_PROFILE,
      job: PlayerJob.Hokage,
      level: 120,
      stats: { str: 4, dex: 135, int: 4, luk: 477 },
      skillLevels,
      nineTailsTransformationActive: true,
    };
    const basic = resolveAttack(AttackKind.Basic, character, 3);
    const claw = resolveAttack(AttackKind.NineTailsClaw, character, 3);
    if (!basic.ok || !claw.ok) throw new Error("attacks should resolve");

    expect(attackSpeedMultiplier(AttackKind.Basic)).toBe(1);
    expect(attackSpeedMultiplier(AttackKind.NineTailsClaw)).toBe(2);
    expect(basic.hits[0]?.delayMs).toBe(110);
    expect(claw.hits[0]?.delayMs).toBe(45);
    expect(usesEquippedWeaponPower(AttackKind.Basic)).toBe(true);
    expect(usesEquippedWeaponPower(AttackKind.NineTailsClaw)).toBe(true);
    expect(usesEquippedWeaponPower(AttackKind.Rasengan)).toBe(false);

    for (const tier of THROWING_STAR_TIERS) {
      expect(
        applyThrowingStarDamage(claw.hits[0]!.damage, tier),
      ).toBeGreaterThan(
        applyThrowingStarDamage(basic.hits[0]!.damage, tier),
      );
    }
  });

  it("gives the transformed claw the same horizontal reach as the regular basic projectile", () => {
    const masteredKeenSight = {
      ...DEFAULT_PLAYER_PROFILE.skillLevels,
      keenSight: 20,
    };
    expect(
      meleeAttackRangePx(AttackKind.NineTailsClaw, masteredKeenSight),
    ).toBe(
      projectileHorizontalReachPx(AttackKind.Basic, masteredKeenSight),
    );
    expect(
      meleeAttackRangePx(AttackKind.NineTailsClaw, masteredKeenSight),
    ).toBeGreaterThan(700);
    expect(meleeAttackRangePx(AttackKind.Rasengan, masteredKeenSight)).toBe(
      155,
    );
  });

  it("advances projectile lifetime only by simulated movement time", () => {
    const beforeCinematic = advanceProjectileActiveAgeMs(240, 16, true);
    const unchangedDuringCinematic = advanceProjectileActiveAgeMs(
      beforeCinematic,
      900,
      false,
    );
    expect(unchangedDuringCinematic).toBe(256);
    expect(
      advanceProjectileActiveAgeMs(unchangedDuringCinematic, 16, true),
    ).toBe(272);
    expect(advanceProjectileActiveAgeMs(Number.NaN, -10, true)).toBe(0);
  });

  it("clamps HP at zero and blocks repeated contact during invulnerability", () => {
    expect(applyDamage(10, 12)).toBe(0);
    expect(applyDamage(10, -5)).toBe(10);
    expect(canTakeContactDamage(999, 1000)).toBe(false);
    expect(canTakeContactDamage(1000, 1000)).toBe(true);
  });

  it("alternates the player flash and restores full alpha after invulnerability", () => {
    const startedAt = 100;
    const until = startedAt + PLAYER_INVULNERABILITY.durationMs;

    expect(playerInvulnerabilityAlpha(startedAt, startedAt, until)).toBe(0.32);
    expect(playerInvulnerabilityAlpha(179, startedAt, until)).toBe(0.32);
    expect(playerInvulnerabilityAlpha(180, startedAt, until)).toBe(1);
    expect(playerInvulnerabilityAlpha(260, startedAt, until)).toBe(0.32);
    expect(playerInvulnerabilityAlpha(until, startedAt, until)).toBe(1);
  });
});
