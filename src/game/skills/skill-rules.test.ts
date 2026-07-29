import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_PROFILE, PlayerJob } from "../data/catalog";
import {
  ACTIVE_SKILL_ORDER,
  CRITICAL_THROW_DAMAGE_MULTIPLIER,
  NINE_TAILS_TRANSFORMATION_MP_COST,
  NINE_TAILS_TRANSFORMATION_MP_DRAIN_INTERVAL_MS,
  NINE_TAILS_TRANSFORMATION_MP_DRAIN_PERCENT,
  PASSIVE_SKILL_ORDER,
  SKILL_DEFINITIONS,
  SKILL_HOTKEY_ASSIGNMENTS,
  SKILL_ORDER,
  SkillId,
  allocateSkillPoint,
  assignSkillHotkeyAlias,
  criticalThrowChance,
  drainNineTailsTransformationMp,
  earnedSkillPointsForLevel,
  isActiveSkillId,
  isPassiveSkillId,
  isSkillUnlocked,
  keenSightRangeMultiplier,
  mobileSkillsForHotbar,
  nineTailsTransformationDamageMultiplier,
  mobilePrimarySkillsForJob,
  normalizeSkillHotbar,
  normalizeSkillHotkeyAliases,
  normalizeSkillLevels,
  sageModeRecoveryIntervalMultiplier,
  shadowBreathingRecoveryIntervalMultiplier,
  skillDamageBonus,
  skillHotkeyAssignments,
  skillHotkeyFor,
  skillHotkeysFor,
  swapSkillHotkeyAliases,
  swapSkillHotbarSlots,
  toggleNineTailsTransformation,
} from "./skill-rules";

describe("skill rules", () => {
  it("grants access by job rank while keeping future skills locked", () => {
    expect(isSkillUnlocked(SkillId.LuckySeven, PlayerJob.Rogue)).toBe(true);
    expect(isSkillUnlocked(SkillId.ShadowVolley, PlayerJob.Rogue)).toBe(true);
    expect(isSkillUnlocked(SkillId.KeenSight, PlayerJob.Rogue)).toBe(true);
    expect(isSkillUnlocked(SkillId.Drain, PlayerJob.Rogue)).toBe(false);
    expect(isSkillUnlocked(SkillId.PhantomStars, PlayerJob.Rogue)).toBe(false);
    expect(isSkillUnlocked(SkillId.CriticalThrow, PlayerJob.Rogue)).toBe(false);
    expect(isSkillUnlocked(SkillId.Drain, PlayerJob.Hermit)).toBe(true);
    expect(isSkillUnlocked(SkillId.ShadowBreathing, PlayerJob.Hermit)).toBe(
      true,
    );
    expect(isSkillUnlocked(SkillId.AbyssRain, PlayerJob.Hermit)).toBe(true);
    expect(isSkillUnlocked(SkillId.Rasengan, PlayerJob.Hermit)).toBe(false);
    expect(isSkillUnlocked(SkillId.Rasengan, PlayerJob.Hokage)).toBe(true);
    expect(isSkillUnlocked(SkillId.TeamAssault, PlayerJob.Hermit)).toBe(false);
    expect(isSkillUnlocked(SkillId.TeamAssault, PlayerJob.Hokage)).toBe(true);
    expect(isSkillUnlocked(SkillId.ThunderOrb, PlayerJob.Hokage)).toBe(true);
    expect(isSkillUnlocked(SkillId.SageMode, PlayerJob.Hokage)).toBe(true);
  });

  it("interleaves each tier while assigning hotkeys only to active skills", () => {
    expect(SKILL_ORDER).toEqual([
      SkillId.LuckySeven,
      SkillId.ShadowVolley,
      SkillId.KeenSight,
      SkillId.Drain,
      SkillId.PhantomStars,
      SkillId.CriticalThrow,
      SkillId.Avenger,
      SkillId.AbyssRain,
      SkillId.ShadowBreathing,
      SkillId.Rasengan,
      SkillId.NineTailsTransformation,
      SkillId.TailedBeastBomb,
      SkillId.TeamAssault,
      SkillId.ThunderOrb,
      SkillId.SageMode,
    ]);
    expect(ACTIVE_SKILL_ORDER).toEqual([
      SkillId.LuckySeven,
      SkillId.ShadowVolley,
      SkillId.Drain,
      SkillId.PhantomStars,
      SkillId.Avenger,
      SkillId.AbyssRain,
      SkillId.Rasengan,
      SkillId.NineTailsTransformation,
      SkillId.TailedBeastBomb,
      SkillId.TeamAssault,
      SkillId.ThunderOrb,
    ]);
    expect(PASSIVE_SKILL_ORDER).toEqual([
      SkillId.KeenSight,
      SkillId.CriticalThrow,
      SkillId.ShadowBreathing,
      SkillId.SageMode,
    ]);
    expect(skillHotkeyFor(SkillId.LuckySeven)).toBe("1");
    expect(skillHotkeyFor(SkillId.ShadowVolley)).toBe("2");
    expect(skillHotkeyFor(SkillId.Drain)).toBe("3");
    expect(skillHotkeyFor(SkillId.PhantomStars)).toBe("4");
    expect(skillHotkeyFor(SkillId.Avenger)).toBe("5");
    expect(skillHotkeyFor(SkillId.AbyssRain)).toBe("6");
    expect(skillHotkeyFor(SkillId.Rasengan)).toBe("7");
    expect(skillHotkeyFor(SkillId.NineTailsTransformation)).toBe("8");
    expect(skillHotkeyFor(SkillId.TailedBeastBomb)).toBe("9");
    expect(skillHotkeyFor(SkillId.TeamAssault)).toBe("0");
    expect(skillHotkeyFor(SkillId.ThunderOrb)).toBe("-");
    expect(SKILL_HOTKEY_ASSIGNMENTS.map(({ hotkey }) => hotkey).join("")).toBe(
      "1234567890-",
    );
    expect(SKILL_HOTKEY_ASSIGNMENTS.every(({ skillId }) => skillId)).toBe(true);
    expect(isActiveSkillId(SkillId.LuckySeven)).toBe(true);
    expect(isActiveSkillId(SkillId.KeenSight)).toBe(false);
    expect(isPassiveSkillId(SkillId.KeenSight)).toBe(true);
    expect(isPassiveSkillId(SkillId.Avenger)).toBe(false);
    expect(isPassiveSkillId(SkillId.SageMode)).toBe(true);
  });

  it("limits mobile touch slots to each current job tier's primary attacks", () => {
    expect(mobilePrimarySkillsForJob(PlayerJob.Beginner)).toEqual([]);
    expect(mobilePrimarySkillsForJob(PlayerJob.Rogue)).toEqual([
      SkillId.LuckySeven,
      SkillId.ShadowVolley,
    ]);
    expect(mobilePrimarySkillsForJob(PlayerJob.Assassin)).toEqual([
      SkillId.Drain,
      SkillId.PhantomStars,
    ]);
    expect(mobilePrimarySkillsForJob(PlayerJob.Hermit)).toEqual([
      SkillId.Avenger,
      SkillId.AbyssRain,
    ]);
    expect(mobilePrimarySkillsForJob(PlayerJob.Hokage)).toEqual([
      SkillId.Rasengan,
      SkillId.TailedBeastBomb,
      SkillId.TeamAssault,
      SkillId.ThunderOrb,
    ]);
    expect(mobilePrimarySkillsForJob(PlayerJob.Hokage)).toHaveLength(4);
    expect(
      mobileSkillsForHotbar(
        PlayerJob.Hokage,
        swapSkillHotbarSlots(
          ACTIVE_SKILL_ORDER,
          SkillId.Rasengan,
          SkillId.ThunderOrb,
        ),
      ),
    ).toEqual([
      SkillId.ThunderOrb,
      SkillId.TailedBeastBomb,
      SkillId.TeamAssault,
      SkillId.Rasengan,
    ]);
  });

  it("uses distinct active and passive definitions", () => {
    expect(SKILL_DEFINITIONS[SkillId.LuckySeven]).toMatchObject({
      kind: "active",
      shortcut: "SHIFT",
      damagePerLevel: 1,
    });
    expect(SKILL_DEFINITIONS[SkillId.ShadowVolley]).toMatchObject({
      kind: "active",
      label: "그림자 연사",
      shortcut: "Q",
      damagePerLevel: 1,
    });
    expect(SKILL_DEFINITIONS[SkillId.KeenSight]).toMatchObject({
      kind: "passive",
      label: "예리한 시야",
      effect: { kind: "projectile-range", percentPerLevel: 2 },
    });
    expect(SKILL_DEFINITIONS[SkillId.CriticalThrow]).toMatchObject({
      kind: "passive",
      label: "치명 투척",
      effect: {
        kind: "critical-throw",
        chancePercentPerLevel: 1,
        damageMultiplier: 1.5,
      },
    });
    expect(SKILL_DEFINITIONS[SkillId.PhantomStars]).toMatchObject({
      kind: "active",
      label: "환영 쌍성",
      shortcut: "W",
      damagePerLevel: 2,
    });
    expect(SKILL_DEFINITIONS[SkillId.ShadowBreathing]).toMatchObject({
      kind: "passive",
      label: "그림자 호흡",
      effect: { kind: "recovery-interval", reductionPercentPerLevel: 2 },
    });
    expect(SKILL_DEFINITIONS[SkillId.AbyssRain]).toMatchObject({
      kind: "active",
      label: "심연 폭우",
      shortcut: "E",
      damagePerLevel: 3,
    });
    expect(SKILL_DEFINITIONS[SkillId.Rasengan]).toMatchObject({
      kind: "active",
      label: "나선환",
      damagePerLevel: 3,
    });
    expect(SKILL_DEFINITIONS[SkillId.NineTailsTransformation]).toMatchObject({
      kind: "active",
      label: "구미호 변신",
      maxLevel: 20,
    });
    expect(SKILL_DEFINITIONS[SkillId.TailedBeastBomb]).toMatchObject({
      kind: "active",
      label: "미수옥",
      damagePerLevel: 4,
    });
    expect(SKILL_DEFINITIONS[SkillId.TeamAssault]).toMatchObject({
      kind: "active",
      label: "삼인 협공",
      shortcut: "N",
      maxLevel: 20,
      damagePerLevel: 2,
    });
    expect(SKILL_DEFINITIONS[SkillId.ThunderOrb]).toMatchObject({
      kind: "active",
      label: "천뢰옥",
      shortcut: "R",
      damagePerLevel: 5,
    });
    expect(SKILL_DEFINITIONS[SkillId.SageMode]).toMatchObject({
      kind: "passive",
      label: "선인모드",
      effect: { kind: "recovery-interval", reductionPercentPerLevel: 4 },
    });
  });

  it("defaults to advancement order and swaps persisted hotbar slots", () => {
    const swapped = swapSkillHotbarSlots(
      ACTIVE_SKILL_ORDER,
      SkillId.LuckySeven,
      SkillId.PhantomStars,
    );
    expect(swapped.slice(0, 4)).toEqual([
      SkillId.PhantomStars,
      SkillId.ShadowVolley,
      SkillId.Drain,
      SkillId.LuckySeven,
    ]);
    expect(skillHotkeyFor(SkillId.PhantomStars, swapped)).toBe("1");
    expect(skillHotkeyFor(SkillId.LuckySeven, swapped)).toBe("4");
    expect(skillHotkeyAssignments(swapped).slice(0, 4)).toEqual([
      { hotkey: "1", skillId: SkillId.PhantomStars },
      { hotkey: "2", skillId: SkillId.ShadowVolley },
      { hotkey: "3", skillId: SkillId.Drain },
      { hotkey: "4", skillId: SkillId.LuckySeven },
    ]);
    expect(
      normalizeSkillHotbar([SkillId.Drain, SkillId.Drain, "invalid"]),
    ).toEqual([
      SkillId.Drain,
      ...ACTIVE_SKILL_ORDER.filter((skillId) => skillId !== SkillId.Drain),
    ]);
  });

  it("normalizes, assigns, clears, and swaps the configurable extra hotkeys", () => {
    const aliases = normalizeSkillHotkeyAliases({
      Shift: SkillId.LuckySeven,
      A: SkillId.ThunderOrb,
      S: "broken",
      Z: SkillId.Drain,
      Unknown: SkillId.Drain,
    });
    expect(aliases).toEqual({
      Shift: SkillId.LuckySeven,
      A: SkillId.ThunderOrb,
    });
    const withSkill = assignSkillHotkeyAlias(aliases, "S", SkillId.Drain);
    expect(withSkill.S).toBe(SkillId.Drain);
    expect(assignSkillHotkeyAlias(withSkill, "S").S).toBeUndefined();
    expect(swapSkillHotkeyAliases(withSkill, "A", "S")).toMatchObject({
      A: SkillId.Drain,
      S: SkillId.ThunderOrb,
    });
    expect(
      skillHotkeysFor(SkillId.ThunderOrb, ACTIVE_SKILL_ORDER, withSkill),
    ).toEqual(["-", "A"]);
  });

  it("spends one SP without mutating the source", () => {
    const character = {
      ...DEFAULT_PLAYER_PROFILE,
      job: PlayerJob.Rogue,
      skillPoints: 3,
      skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
    };
    const allocated = allocateSkillPoint(character, SkillId.LuckySeven);

    expect(allocated.skillPoints).toBe(2);
    expect(allocated.skillLevels.luckySeven).toBe(1);
    expect(character.skillLevels.luckySeven).toBe(0);
  });

  it("spends SP on an unlocked passive without mutating the source", () => {
    const character = {
      ...DEFAULT_PLAYER_PROFILE,
      job: PlayerJob.Assassin,
      skillPoints: 2,
      skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
    };
    const allocated = allocateSkillPoint(character, SkillId.CriticalThrow);

    expect(allocated.skillPoints).toBe(1);
    expect(allocated.skillLevels.criticalThrow).toBe(1);
    expect(character.skillLevels.criticalThrow).toBe(0);
  });

  it("blocks locked, empty, and mastered allocations", () => {
    const rogue = {
      ...DEFAULT_PLAYER_PROFILE,
      job: PlayerJob.Rogue,
      skillPoints: 1,
      skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
    };
    expect(allocateSkillPoint(rogue, SkillId.Drain)).toBe(rogue);
    expect(allocateSkillPoint(rogue, SkillId.CriticalThrow)).toBe(rogue);
    expect(
      allocateSkillPoint({ ...rogue, skillPoints: 0 }, SkillId.LuckySeven),
    ).toMatchObject({ skillPoints: 0, skillLevels: rogue.skillLevels });
    expect(
      allocateSkillPoint(
        {
          ...rogue,
          skillLevels: {
            ...rogue.skillLevels,
            luckySeven: SKILL_DEFINITIONS[SkillId.LuckySeven].maxLevel,
          },
        },
        SkillId.LuckySeven,
      ),
    ).toMatchObject({ skillPoints: 1, skillLevels: { luckySeven: 20 } });
  });

  it("normalizes levels and calculates deterministic damage bonuses", () => {
    const levels = normalizeSkillLevels({
      luckySeven: 4,
      shadowVolley: 8,
      keenSight: 7,
      drain: 99,
      phantomStars: 3,
      criticalThrow: 1.5,
      avenger: -1,
      abyssRain: 4,
      shadowBreathing: 25,
      rasengan: 3,
      nineTailsTransformation: 4,
      tailedBeastBomb: 5,
      teamAssault: 6,
      thunderOrb: 5,
      sageMode: 99,
    });
    expect(levels).toEqual({
      luckySeven: 4,
      shadowVolley: 8,
      keenSight: 7,
      drain: 20,
      phantomStars: 3,
      criticalThrow: 0,
      avenger: 0,
      abyssRain: 4,
      shadowBreathing: 20,
      rasengan: 3,
      nineTailsTransformation: 4,
      tailedBeastBomb: 5,
      teamAssault: 6,
      thunderOrb: 5,
      sageMode: 20,
    });
    expect(skillDamageBonus(SkillId.LuckySeven, levels)).toBe(4);
    expect(skillDamageBonus(SkillId.Drain, levels)).toBe(40);
    expect(skillDamageBonus(SkillId.KeenSight, levels)).toBe(0);
    expect(skillDamageBonus(SkillId.Rasengan, levels)).toBe(9);
    expect(skillDamageBonus(SkillId.TailedBeastBomb, levels)).toBe(20);
    expect(skillDamageBonus(SkillId.TeamAssault, levels)).toBe(12);
    expect(skillDamageBonus(SkillId.ShadowVolley, levels)).toBe(8);
    expect(skillDamageBonus(SkillId.PhantomStars, levels)).toBe(6);
    expect(skillDamageBonus(SkillId.AbyssRain, levels)).toBe(12);
    expect(skillDamageBonus(SkillId.ThunderOrb, levels)).toBe(25);
    expect(skillDamageBonus("basicAttack", levels)).toBe(0);
    expect(earnedSkillPointsForLevel(12)).toBe(6);
  });

  it("backfills missing passive levels with zero", () => {
    expect(
      normalizeSkillLevels({ luckySeven: 12, drain: 3, avenger: 1 }),
    ).toEqual({
      luckySeven: 12,
      shadowVolley: 0,
      keenSight: 0,
      drain: 3,
      phantomStars: 0,
      criticalThrow: 0,
      avenger: 1,
      abyssRain: 0,
      shadowBreathing: 0,
      rasengan: 0,
      nineTailsTransformation: 0,
      tailedBeastBomb: 0,
      teamAssault: 0,
      thunderOrb: 0,
      sageMode: 0,
    });
  });

  it("calculates bounded passive multipliers from normalized levels", () => {
    expect(keenSightRangeMultiplier(undefined)).toBe(1);
    expect(criticalThrowChance(undefined)).toBe(0);
    expect(shadowBreathingRecoveryIntervalMultiplier(undefined)).toBe(1);
    expect(sageModeRecoveryIntervalMultiplier(undefined)).toBe(1);
    expect(nineTailsTransformationDamageMultiplier(undefined)).toBe(1);

    const mastered = normalizeSkillLevels({
      keenSight: 20,
      criticalThrow: 20,
      shadowBreathing: 20,
      sageMode: 20,
      nineTailsTransformation: 20,
    });
    expect(keenSightRangeMultiplier(mastered)).toBeCloseTo(1.4);
    expect(criticalThrowChance(mastered)).toBeCloseTo(0.2);
    expect(CRITICAL_THROW_DAMAGE_MULTIPLIER).toBe(1.5);
    expect(shadowBreathingRecoveryIntervalMultiplier(mastered)).toBeCloseTo(
      0.6,
    );
    expect(sageModeRecoveryIntervalMultiplier(mastered)).toBeCloseTo(0.2);
    expect(nineTailsTransformationDamageMultiplier(mastered)).toBeCloseTo(1.5);

    const pathological = {
      ...mastered,
      keenSight: 99,
      criticalThrow: -1,
      shadowBreathing: 1.5,
      sageMode: 99,
      nineTailsTransformation: -1,
    };
    expect(keenSightRangeMultiplier(pathological)).toBeCloseTo(1.4);
    expect(criticalThrowChance(pathological)).toBe(0);
    expect(shadowBreathingRecoveryIntervalMultiplier(pathological)).toBe(1);
    expect(sageModeRecoveryIntervalMultiplier(pathological)).toBeCloseTo(0.2);
    expect(nineTailsTransformationDamageMultiplier(pathological)).toBe(1);
  });

  it("toggles Nine-Tails Transformation with an activation-only MP cost", () => {
    expect(NINE_TAILS_TRANSFORMATION_MP_COST).toBe(60);
    expect(
      toggleNineTailsTransformation(false, { job: PlayerJob.Hermit, mp: 100 }),
    ).toEqual({
      ok: false,
      active: false,
      remainingMp: 100,
      reason: "job-required",
    });
    expect(
      toggleNineTailsTransformation(false, { job: PlayerJob.Hokage, mp: 59 }),
    ).toEqual({
      ok: false,
      active: false,
      remainingMp: 59,
      reason: "not-enough-mp",
    });
    expect(
      toggleNineTailsTransformation(false, { job: PlayerJob.Hokage, mp: 100 }),
    ).toEqual({ ok: true, active: true, remainingMp: 40 });
    expect(
      toggleNineTailsTransformation(true, { job: PlayerJob.Hokage, mp: 40 }),
    ).toEqual({ ok: true, active: false, remainingMp: 40 });
  });

  it("drains one percent of maximum MP per second and ends at zero", () => {
    expect(NINE_TAILS_TRANSFORMATION_MP_DRAIN_INTERVAL_MS).toBe(1_000);
    expect(NINE_TAILS_TRANSFORMATION_MP_DRAIN_PERCENT).toBe(1);
    expect(
      drainNineTailsTransformationMp(true, { mp: 940, maxMp: 1_000 }),
    ).toEqual({ active: true, remainingMp: 930, drainedMp: 10 });
    expect(
      drainNineTailsTransformationMp(true, { mp: 20, maxMp: 600 }, 2),
    ).toEqual({ active: true, remainingMp: 8, drainedMp: 12 });
    expect(drainNineTailsTransformationMp(true, { mp: 1, maxMp: 90 })).toEqual({
      active: false,
      remainingMp: 0,
      drainedMp: 1,
    });
    expect(
      drainNineTailsTransformationMp(false, { mp: 77, maxMp: 600 }),
    ).toEqual({ active: false, remainingMp: 77, drainedMp: 0 });
    expect(
      drainNineTailsTransformationMp(true, {
        mp: Number.NaN,
        maxMp: Number.NaN,
      }),
    ).toEqual({ active: false, remainingMp: 0, drainedMp: 0 });
  });
});
